/// <reference types="svelte" />
/**
 * Who is signed in, for the lifetime of the account island.
 *
 * The three account pages each used to answer this on their own — a
 * `GET /api/customer/auth/me` per document, cross-origin, before anything
 * painted. One island means one answer, which is most of why it is an island.
 *
 * A CLASS, INSTANTIATED IN `AccountApp` — never a module-level
 * `export const session = new AccountSession()`. The admin can do that because
 * it is a pure client SPA; this island is server-rendered on every request
 * inside one long-lived Node process, so module scope is shared between
 * visitors. That is the hazard `lib/i18n.ts` keeps an `AsyncLocalStorage` for.
 */
import { ApiError, type Customer, loadCustomer, logout as apiLogout } from './customer-session.ts';

export class AccountSession {
  #customer = $state<Customer | null>(null);
  #loading = $state(true);
  #pending: Promise<void> | null = null;

  /** Both in the reader's language — the island never rebuilds a path. */
  readonly #loginPath: string;
  readonly #homePath: string;

  constructor(loginPath: string, homePath: string) {
    this.#loginPath = loginPath;
    this.#homePath = homePath;
  }

  get customer(): Customer | null {
    return this.#customer;
  }

  get loading(): boolean {
    return this.#loading;
  }

  get isAuthenticated(): boolean {
    return this.#customer !== null;
  }

  /**
   * Resolve the session at most once, and make every caller wait on the same
   * request.
   *
   * The PROMISE is what gets memoised, not a boolean: a flag set before the
   * `await` would let a second caller through against a still-empty customer.
   */
  ensureLoaded(): Promise<void> {
    this.#pending ??= this.#load();
    return this.#pending;
  }

  async #load(): Promise<void> {
    this.#loading = true;
    try {
      this.#customer = await loadCustomer();
    } catch {
      /* A network failure is not a sign-out. `AccountApp` reads `customer`
         being null on a settled load as "send them to sign in", which is the
         same thing this page did before, and the honest reading: we cannot
         prove who they are. */
      this.#customer = null;
    } finally {
      this.#loading = false;
    }
  }

  /**
   * Re-read the signed-in customer, leaving `loading` alone.
   *
   * Not `#load()`, and the difference is visible: `loading` gates the whole
   * island, so a form that called it would replace itself with the loading
   * plate mid-save and throw away its own success message.
   */
  async revalidate(): Promise<void> {
    try {
      const next = await loadCustomer();
      if (next) {
        this.#customer = next;
        return;
      }
      /* Settled, and genuinely signed out — the session was revoked
         server-side (a password change on another device does exactly this).
         Nothing here can recover it. */
      this.#customer = null;
      this.redirectToLogin();
    } catch {
      // Keep what we have; this is a refresh, not a sign-out.
    }
  }

  /** `PATCH /profile` answers with the fresh customer — take it, don't refetch. */
  adopt(customer: Customer): void {
    this.#customer = customer;
  }

  /**
   * A 401 from anywhere means the session died under us. Returns true when it
   * handled the error, so a caller can `if (session.escalate(error)) return;`
   * before deciding what to show.
   *
   * Nothing did this before, because a document only lived for one screen and
   * the next page load asked again. One long-lived document has to notice.
   */
  escalate(error: unknown): boolean {
    if (!(error instanceof ApiError) || error.status !== 401) return false;
    this.#customer = null;
    this.redirectToLogin();
    return true;
  }

  /**
   * `replace`, not `assign`: a page they cannot see must not become a back-button
   * destination. `search` rides along — the old code dropped it, which was
   * harmless only because nothing put anything there.
   */
  redirectToLogin(): void {
    const here = window.location.pathname + window.location.search;
    window.location.replace(`${this.#loginPath}?next=${encodeURIComponent(here)}`);
  }

  async signOut(): Promise<void> {
    await apiLogout().catch(() => undefined);
    window.location.assign(this.#homePath);
  }
}
