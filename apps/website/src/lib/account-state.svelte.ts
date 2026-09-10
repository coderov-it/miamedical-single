/// <reference types="svelte" />
/**
 * The customer's orders, fetched once per island lifetime.
 *
 * No component fetches. They read state and call methods, which is what makes
 * back-and-forward free: the list and each order detail are memoised
 * promises, so account → orders → detail → back → back costs two requests
 * where three separate documents cost five, plus a `/me` apiece.
 *
 * Every call funnels a 401 into `AccountSession.escalate()`. Three separate
 * documents never needed that — the next page load asked again — but one
 * long-lived document has to notice a session revoked under it, and a
 * password change on another device does exactly that.
 */
import type { AccountSession } from './account-session.svelte.ts';
import {
  ApiError,
  confirmOrder,
  type CustomerOrderDetail,
  type CustomerOrderSummary,
  getOrder,
  listOrders,
  rejectOrder,
} from './customer-session.ts';

/**
 * What to show for a failed call: the API's own message when it sent one — it
 * is already in the reader's language — and the caller's fallback otherwise.
 */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.message) return error.message;
  return fallback;
}

export class AccountStore {
  #rows = $state<CustomerOrderSummary[] | null>(null);
  #total = $state(0);
  #listError = $state<unknown>(null);
  #listPending: Promise<void> | null = null;

  /* A plain object rather than a Map: `$state` deep-proxies object literals,
     so adding a key is reactive without reaching for `svelte/reactivity`. */
  #details = $state<Record<string, CustomerOrderDetail>>({});
  #detailErrors = $state<Record<string, unknown>>({});
  #detailPending: Record<string, Promise<void>> = {};

  readonly #session: AccountSession;

  constructor(session: AccountSession) {
    this.#session = session;
  }

  /** `null` until the first load settles — that is the loading state. */
  get rows(): CustomerOrderSummary[] | null {
    return this.#rows;
  }

  /** What the server says the customer has, which may exceed what we fetched. */
  get total(): number {
    return this.#total;
  }

  get listError(): unknown {
    return this.#listError;
  }

  detail(number: string): CustomerOrderDetail | undefined {
    return this.#details[number];
  }

  detailError(number: string): unknown {
    return this.#detailErrors[number];
  }

  /** Load the list at most once. Safe to call from an `$effect` on every render. */
  ensureOrders(): Promise<void> {
    this.#listPending ??= this.#loadOrders();
    return this.#listPending;
  }

  async #loadOrders(): Promise<void> {
    try {
      const { rows, meta } = await listOrders();
      this.#rows = rows;
      this.#total = meta.total;
      this.#listError = null;
    } catch (error) {
      if (this.#session.escalate(error)) return;
      this.#listError = error;
      this.#rows = [];
      /* Let a retry actually retry. Without this the memoised rejection is
         the answer for the rest of the document's life, which is the
         permanent "Caricamento…" the old pages had. */
      this.#listPending = null;
    }
  }

  ensureOrder(number: string): Promise<void> {
    this.#detailPending[number] ??= this.#loadOrder(number);
    return this.#detailPending[number];
  }

  async #loadOrder(number: string): Promise<void> {
    try {
      this.#details[number] = await getOrder(number);
      delete this.#detailErrors[number];
    } catch (error) {
      if (this.#session.escalate(error)) return;
      this.#detailErrors[number] = error;
      delete this.#detailPending[number];
    }
  }

  /**
   * "Yes, this is mine." The claim the account was matched on by email alone
   * becomes a fact, so the row stops asking.
   */
  async confirm(number: string): Promise<void> {
    await confirmOrder(number);
    const row = this.#rows?.find((candidate) => candidate.number === number);
    if (row) row.linkStatus = 'confirmed';
    this.#invalidateDetail(number);
  }

  /**
   * "No, this isn't mine." The ORDER survives — it is a real order somebody
   * placed — but it is no longer linked to this account, so it is no longer
   * one of their rows. Dropping it matches what a reload would show.
   */
  async reject(number: string): Promise<void> {
    await rejectOrder(number);
    this.#rows = (this.#rows ?? []).filter((candidate) => candidate.number !== number);
    this.#invalidateDetail(number);
  }

  #invalidateDetail(number: string): void {
    delete this.#details[number];
    delete this.#detailErrors[number];
    delete this.#detailPending[number];
  }
}
