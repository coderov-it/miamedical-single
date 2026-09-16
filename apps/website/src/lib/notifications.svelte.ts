/// <reference types="svelte" />
/**
 * The customer's notification feed, for the lifetime of the account island.
 *
 * A CLASS, INSTANTIATED IN `AccountApp`, for the same reason `AccountSession`
 * is one: this island is server-rendered on every request inside one long-lived
 * Node process, so a module-level singleton would be one visitor's unread count
 * visible to the next.
 *
 * ── Two ways in, one source of truth ────────────────────────────────────────
 * The snapshot (`GET /api/customer/notifications`) is the record. The stream is
 * a hint that the record changed. Every frame the server sends is therefore
 * safe to lose: `ready` and `resync` both just re-read the snapshot, and a
 * `notification` frame is a shortcut that saves a round trip rather than the
 * only way a row can arrive. That is what makes a dropped connection a
 * non-event — the next reconnect re-reads, and so does opening the screen.
 *
 * The count is never computed here. Both mark-read calls answer with the
 * recomputed `unread`, and the snapshot carries it too, so the badge is always
 * a number the server gave us. Decrementing locally is how a bell ends up
 * disagreeing with the list under it.
 */
import type { AccountSession } from './account-session.svelte.ts';
import {
  type CustomerNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
  notificationStreamUrl,
} from './customer-session.ts';

/** One screenful. The feed is read, not scrolled through, so this is generous. */
const PER_PAGE = 20;

export class NotificationStore {
  /* `$state` deep-proxies an array literal, so a prepend is reactive without
     reaching for `svelte/reactivity`. */
  #rows = $state<CustomerNotification[]>([]);
  #unread = $state(0);
  #total = $state(0);
  #page = $state(1);
  #loading = $state(false);
  #error = $state<unknown>(null);

  #pending: Promise<void> | null = null;
  #source: EventSource | null = null;

  readonly #session: AccountSession;

  constructor(session: AccountSession) {
    this.#session = session;
  }

  get rows(): CustomerNotification[] {
    return this.#rows;
  }

  /** Unread across the whole feed, whatever page is on screen. This is the badge. */
  get unread(): number {
    return this.#unread;
  }

  get total(): number {
    return this.#total;
  }

  get loading(): boolean {
    return this.#loading;
  }

  get error(): unknown {
    return this.#error;
  }

  get hasMore(): boolean {
    return this.#rows.length < this.#total;
  }

  /**
   * Load the first page at most once. Safe to call from an `$effect` that runs
   * on every render.
   */
  ensureLoaded(): Promise<void> {
    this.#pending ??= this.refresh();
    return this.#pending;
  }

  /**
   * Re-read page one and throw away what we had.
   *
   * The whole first page rather than a merge: the rows are ordered newest
   * first and the only thing that can have changed below the fold is read
   * state, which the next `loadMore` will pick up anyway. Merging by id would
   * be more code for a list nobody is paging through while it updates.
   */
  async refresh(): Promise<void> {
    this.#loading = true;
    try {
      const { rows, meta } = await listNotifications(1, PER_PAGE);
      this.#rows = rows;
      this.#unread = meta.unread;
      this.#total = meta.total;
      this.#page = 1;
      this.#error = null;
    } catch (error) {
      if (this.#session.escalate(error)) {
        this.disconnect();
        return;
      }
      this.#error = error;
    } finally {
      this.#loading = false;
      /* Drop the memo on the way out so `ensureLoaded` can genuinely try again
         after a failure — a retry button that replays a rejected promise is a
         button that does nothing. */
      this.#pending = null;
    }
  }

  async loadMore(): Promise<void> {
    if (this.#loading || !this.hasMore) return;
    this.#loading = true;
    try {
      const next = this.#page + 1;
      const { rows, meta } = await listNotifications(next, PER_PAGE);
      /* Filter by id rather than trusting the offset: a row arriving between
         the two requests shifts the window, and without this the last row of
         page one comes back as the first row of page two. */
      const seen = new Set(this.#rows.map((row) => row.id));
      this.#rows = [...this.#rows, ...rows.filter((row) => !seen.has(row.id))];
      this.#unread = meta.unread;
      this.#total = meta.total;
      this.#page = next;
      this.#error = null;
    } catch (error) {
      if (this.#session.escalate(error)) {
        this.disconnect();
        return;
      }
      this.#error = error;
    } finally {
      this.#loading = false;
    }
  }

  /**
   * Mark rows read. Optimistic in the list, authoritative in the count.
   *
   * The row is greyed immediately because the customer just clicked it and a
   * delay there reads as a broken control; the badge waits for the server,
   * because it is the number that has to be right.
   */
  async markRead(ids: string[]): Promise<void> {
    const wanted = ids.filter((id) => this.#rows.some((row) => row.id === id && !row.readAt));
    if (wanted.length === 0) return;

    const now = new Date().toISOString();
    this.#rows = this.#rows.map((row) => (wanted.includes(row.id) ? { ...row, readAt: now } : row));

    try {
      const result = await markNotificationsRead(wanted);
      this.#unread = result.unread;
    } catch (error) {
      if (this.#session.escalate(error)) {
        this.disconnect();
        return;
      }
      /* Put it back: the row is still unread on the server, and leaving it grey
         here would hide something the customer has not actually seen. */
      void this.refresh();
    }
  }

  async markAllRead(): Promise<void> {
    if (this.#unread === 0) return;
    const now = new Date().toISOString();
    this.#rows = this.#rows.map((row) => (row.readAt ? row : { ...row, readAt: now }));

    try {
      const result = await markAllNotificationsRead();
      this.#unread = result.unread;
    } catch (error) {
      if (this.#session.escalate(error)) {
        this.disconnect();
        return;
      }
      void this.refresh();
    }
  }

  /**
   * Open the live channel. Idempotent, so the shell can call it from an
   * `$effect` without guarding.
   *
   * `EventSource` reconnects on its own and we let it: the browser's backoff is
   * better than anything worth writing here, and `onlisten` on the server
   * broadcasts `resync` after its own reconnect, so a gap on either side ends
   * with the same snapshot re-read.
   */
  connect(): void {
    if (this.#source || typeof EventSource === 'undefined') return;

    const source = new EventSource(notificationStreamUrl(), { withCredentials: true });
    this.#source = source;

    /* Both mean "you may be behind": `ready` on a fresh connection, `resync`
       when the server's own listener reconnected and may have missed a NOTIFY
       while it was down. One handler, because the answer is the same. */
    const reread = () => void this.refresh();
    source.addEventListener('ready', reread);
    source.addEventListener('resync', reread);

    source.addEventListener('notification', (event) => {
      const row = parseRow((event as MessageEvent<string>).data);
      if (!row) return;
      this.#arrived(row);
    });
  }

  disconnect(): void {
    this.#source?.close();
    this.#source = null;
  }

  /**
   * A row pushed while the screen was open.
   *
   * Guarded on id because the server pushes on COMMIT and the snapshot may
   * already have caught the same row — the two races on every navigation.
   */
  #arrived(row: CustomerNotification): void {
    if (this.#rows.some((existing) => existing.id === row.id)) return;
    this.#rows = [row, ...this.#rows];
    this.#total += 1;
    if (!row.readAt) this.#unread += 1;
  }
}

/**
 * A frame's payload, or null.
 *
 * Anything on this connection is ours and already shaped by `repo.findById`, so
 * this is a parse guard and not validation: the only realistic failure is a
 * truncated frame, and a dropped row costs nothing because the next snapshot
 * has it.
 */
function parseRow(data: string): CustomerNotification | null {
  try {
    const parsed = JSON.parse(data) as Partial<CustomerNotification>;
    return typeof parsed?.id === 'string' ? (parsed as CustomerNotification) : null;
  } catch {
    return null;
  }
}
