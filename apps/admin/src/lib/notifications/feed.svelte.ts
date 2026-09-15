import type {
  NotificationCategory,
  NotificationCategoryCount,
  NotificationView,
} from '@mia/validators';

import { api, apiUrl } from '~/lib/api';
import { unwrapFull } from '~/lib/request';

/**
 * The operator's live feed.
 *
 * A singleton rather than a per-component resource, because three things read
 * it — the bell, its dropdown, and the inbox screen — and they must agree on
 * the unread count. `Resource` is the right tool for a page's own fetch; this is
 * session-lifetime state with a socket attached.
 *
 * The contract with the server is that **the table is the truth and the stream
 * is a hint**. Every frame either carries a row we could have fetched anyway or
 * simply says "look again", and nothing here is ever reconstructed from the
 * sequence of frames. That is what makes a dropped connection a re-read rather
 * than a correctness problem, and it is why `resync` needs no cursor.
 *
 * Two lists, deliberately. `latest` is the newest handful the dropdown shows and
 * is never filtered; `items` is the inbox's list and follows the rail. Sharing
 * one array would mean opening the bell after filtering to Contracts showed only
 * contracts, which is the opposite of what a bell is for.
 */

const PAGE_SIZE = 20;

/** What the dropdown shows. Ten is the ask, and it is about one screen of rows. */
export const PREVIEW_SIZE = 10;

/**
 * How long a hidden tab keeps its stream. A stream costs the server a socket to
 * do nothing while nobody is looking at it, and reopening costs one snapshot
 * fetch — so a backgrounded tab hands the connection back and picks the feed up
 * on return. At five operators this changes nothing; it is the same code the
 * customer feed will run at ten thousand, proven first where it is cheap.
 */
const HIDDEN_TAB_GRACE_MS = 5 * 60 * 1000;

type Counts = Record<NotificationCategory | 'all', NotificationCategoryCount>;

interface FeedResponse {
  data: NotificationView[];
  meta: { page: number; perPage: number; total: number; unread: number; counts: Counts };
}

const ZERO_COUNTS: Counts = {
  all: { total: 0, unread: 0 },
  order: { total: 0, unread: 0 },
  rental: { total: 0, unread: 0 },
  contract: { total: 0, unread: 0 },
};

class NotificationFeed {
  /** The inbox's list — follows `category` and `unreadOnly`. Newest first. */
  items = $state.raw<NotificationView[]>([]);
  /** The dropdown's list — newest few, never filtered. */
  latest = $state.raw<NotificationView[]>([]);
  counts = $state.raw<Counts>(ZERO_COUNTS);
  /** Rows matching the active filter, for "showing 20 of 48". */
  total = $state(0);
  loading = $state(false);
  error = $state<string | null>(null);
  /** False while the stream is down. The screen says so rather than lying. */
  connected = $state(false);

  /** The rail. `null` is "All". */
  category = $state<NotificationCategory | null>(null);
  unreadOnly = $state(false);

  #source: EventSource | null = null;
  #loadedPages = 0;
  #hiddenTimer: ReturnType<typeof setTimeout> | null = null;
  #visibilityBound = false;

  /** Across every category, whatever the rail is doing. This is the bell. */
  get unread(): number {
    return this.counts.all.unread;
  }

  get hasMore(): boolean {
    return this.items.length < this.total;
  }

  /**
   * Opens the stream and takes the first snapshot. Safe to call repeatedly —
   * the topbar mounts once per session, but a hot reload should not end up with
   * two sockets.
   */
  connect(): void {
    this.#bindVisibility();
    if (this.#source) return;

    /* `withCredentials` is what carries the session cookie cross-origin: the
       admin is served from a different port in dev and a different host in
       production, and EventSource cannot set headers. The origin is already in
       CORS_ORIGINS for the RPC client, so nothing new is allowed here. */
    const source = new EventSource(apiUrl('/api/admin/notifications/stream'), {
      withCredentials: true,
    });
    this.#source = source;

    // Both mean the same thing to us: fetch again. `ready` is the first connect,
    // `resync` is the server saying its listener reconnected and may have missed
    // something while it was away.
    source.addEventListener('ready', () => {
      this.connected = true;
      void this.refresh();
    });
    source.addEventListener('resync', () => {
      this.connected = true;
      void this.refresh();
    });

    source.addEventListener('notification', (event) => {
      this.#arrived(JSON.parse((event as MessageEvent<string>).data) as NotificationView);
    });

    /* EventSource reconnects on its own — this only records that it is trying,
       so the screen can say "reconnecting" instead of quietly going stale. */
    source.onerror = () => {
      this.connected = false;
    };
  }

  disconnect(): void {
    this.#source?.close();
    this.#source = null;
    this.connected = false;
  }

  /** Point the rail somewhere else and re-read. */
  async setCategory(category: NotificationCategory | null): Promise<void> {
    if (this.category === category) return;
    this.category = category;
    await this.refresh();
  }

  async setUnreadOnly(value: boolean): Promise<void> {
    if (this.unreadOnly === value) return;
    this.unreadOnly = value;
    await this.refresh();
  }

  /**
   * The newest page of both lists, replacing what we hold. The answer to every
   * resync, and to every change of filter.
   *
   * Two requests, not one: the dropdown must stay unfiltered while the inbox is
   * filtered, and they are only the same request while the rail sits on "All".
   */
  async refresh(): Promise<void> {
    this.loading = true;
    try {
      const filtered = await this.#fetchPage(1);
      this.items = filtered.data;
      this.total = filtered.meta.total;
      this.counts = filtered.meta.counts;
      this.#loadedPages = 1;

      this.latest = this.#isUnfiltered()
        ? filtered.data.slice(0, PREVIEW_SIZE)
        : (await this.#fetchPage(1, { unfiltered: true, perPage: PREVIEW_SIZE })).data;

      this.error = null;
    } catch (cause) {
      this.error = cause instanceof Error ? cause.message : 'Could not load notifications.';
    } finally {
      this.loading = false;
    }
  }

  async loadMore(): Promise<void> {
    if (this.loading || !this.hasMore) return;
    this.loading = true;
    try {
      const body = await this.#fetchPage(this.#loadedPages + 1);
      /* Appending by id rather than by index: a notification arriving between
         the two requests shifts every later row by one, and a blind concat would
         show the boundary row twice. */
      const seen = new Set(this.items.map((item) => item.id));
      this.items = [...this.items, ...body.data.filter((item) => !seen.has(item.id))];
      this.total = body.meta.total;
      this.counts = body.meta.counts;
      this.#loadedPages += 1;
      this.error = null;
    } catch (cause) {
      this.error = cause instanceof Error ? cause.message : 'Could not load notifications.';
    } finally {
      this.loading = false;
    }
  }

  async markRead(ids: string[]): Promise<void> {
    const unreadIds = ids.filter((id) => this.#byId(id)?.readAt === null);
    if (unreadIds.length === 0) return;

    // Optimistic: the row greys out on click. A failed call re-reads rather than
    // rolling back by hand, so the list and the badges cannot disagree.
    this.#applyRead(unreadIds);

    try {
      const body = await unwrapFull<{ data: { unread: number; counts: Counts } }>(
        await api.api.admin.notifications.read.$post({ json: { ids: unreadIds } }),
      );
      this.counts = body.data.counts;
    } catch {
      await this.refresh();
    }
  }

  async markAllRead(): Promise<void> {
    if (this.unread === 0) return;

    const readAt = new Date().toISOString();
    const clear = (rows: NotificationView[]) =>
      rows.map((row) => (row.readAt ? row : { ...row, readAt }));
    this.items = clear(this.items);
    this.latest = clear(this.latest);
    this.counts = { ...ZERO_COUNTS };

    try {
      const body = await unwrapFull<{ data: { counts: Counts } }>(
        await api.api.admin.notifications['read-all'].$post(),
      );
      this.counts = body.data.counts;
      // Reading everything empties an "unread only" view, so it has to re-read
      // rather than sit there showing rows it no longer matches.
      if (this.unreadOnly) await this.refresh();
    } catch {
      await this.refresh();
    }
  }

  /** Forget everything. Called on sign-out, so the next operator starts clean. */
  clear(): void {
    this.disconnect();
    this.items = [];
    this.latest = [];
    this.counts = ZERO_COUNTS;
    this.total = 0;
    this.category = null;
    this.unreadOnly = false;
    this.#loadedPages = 0;
    this.error = null;
  }

  #isUnfiltered(): boolean {
    return this.category === null && !this.unreadOnly;
  }

  #byId(id: string): NotificationView | undefined {
    return this.items.find((item) => item.id === id) ?? this.latest.find((item) => item.id === id);
  }

  async #fetchPage(
    page: number,
    options: { unfiltered?: boolean; perPage?: number } = {},
  ): Promise<FeedResponse> {
    const query: Record<string, string> = {
      page: String(page),
      perPage: String(options.perPage ?? PAGE_SIZE),
    };
    if (!options.unfiltered) {
      if (this.category) query.category = this.category;
      if (this.unreadOnly) query.unread = 'true';
    }

    return unwrapFull<FeedResponse>(await api.api.admin.notifications.$get({ query }));
  }

  #applyRead(ids: string[]): void {
    const readAt = new Date().toISOString();
    const mark = (rows: NotificationView[]) =>
      rows.map((row) => (ids.includes(row.id) ? { ...row, readAt } : row));
    this.items = mark(this.items);
    this.latest = mark(this.latest);

    // Move the badges now so the rail does not lag the row the operator just
    // clicked; the server's own counts land a moment later and win.
    const counts = structuredClone(this.counts);
    for (const id of ids) {
      const category = this.#byId(id)?.type.split('.')[0] as NotificationCategory | undefined;
      counts.all.unread = Math.max(0, counts.all.unread - 1);
      if (category && counts[category]) {
        counts[category].unread = Math.max(0, counts[category].unread - 1);
      }
    }
    this.counts = counts;
  }

  /**
   * A live frame. It joins `latest` always, and `items` only when it matches
   * what the rail is currently showing — a contract notification must not appear
   * under the Orders tab just because it arrived while that tab was open.
   */
  #arrived(row: NotificationView): void {
    if (!this.latest.some((item) => item.id === row.id)) {
      this.latest = [row, ...this.latest].slice(0, PREVIEW_SIZE);
    }

    const counts = structuredClone(this.counts);
    counts.all.total += 1;
    if (!row.readAt) counts.all.unread += 1;
    const category = row.type.split('.')[0] as NotificationCategory;
    if (counts[category]) {
      counts[category].total += 1;
      if (!row.readAt) counts[category].unread += 1;
    }
    this.counts = counts;

    if (!this.#matchesFilter(row)) return;
    if (this.items.some((item) => item.id === row.id)) return;
    this.items = [row, ...this.items];
    this.total += 1;
  }

  #matchesFilter(row: NotificationView): boolean {
    if (this.unreadOnly && row.readAt !== null) return false;
    if (this.category && !row.type.startsWith(`${this.category}.`)) return false;
    return true;
  }

  #bindVisibility(): void {
    if (this.#visibilityBound || typeof document === 'undefined') return;
    this.#visibilityBound = true;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.#hiddenTimer = setTimeout(() => this.disconnect(), HIDDEN_TAB_GRACE_MS);
        return;
      }

      if (this.#hiddenTimer) {
        clearTimeout(this.#hiddenTimer);
        this.#hiddenTimer = null;
      }
      // Reconnecting fetches a snapshot through `ready`, which is also what
      // catches up a tab that was hidden long enough to be dropped.
      this.connect();
    });
  }
}

export const notificationFeed = new NotificationFeed();
