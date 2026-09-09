import { can as canCode, canAny as canAnyCode } from '@mia/permissions';
import type { InferResponseType } from 'hono/client';

import { api } from './api';

type Me = InferResponseType<typeof api.api.auth.me.$get, 200>['data'];

/**
 * The signed-in back-office user.
 *
 * The session itself lives in an httpOnly cookie the browser cannot read, so
 * "am I logged in" is answered by `GET /api/auth/me` on boot — a 401 means no.
 * Permissions arrive already expanded (a super admin gets the whole catalog),
 * so `can()` here is the same integer check the server runs.
 */
class Session {
  #user = $state<Me | null>(null);
  #loading = $state(true);
  #pending: Promise<void> | null = null;

  get user() {
    return this.#user;
  }

  get loading() {
    return this.#loading;
  }

  get isAuthenticated() {
    return this.#user !== null;
  }

  /**
   * Resolve the session at most once, and make every caller wait for the same
   * request. The root layout calls this on boot; `loading` is what the auth
   * conditionals render against until it settles.
   *
   * The promise — not a boolean — is what gets memoised: a flag set before the
   * `await` would let a second caller through against a still-empty user.
   */
  ensureLoaded(): Promise<void> {
    this.#pending ??= this.load();
    return this.#pending;
  }

  /** Resolve the current session. Prefer `ensureLoaded()` outside of tests. */
  async load(): Promise<void> {
    this.#loading = true;
    try {
      const response = await api.api.auth.me.$get();
      this.#user = response.ok ? ((await response.json()) as { data: Me }).data : null;
    } catch {
      this.#user = null;
    } finally {
      this.#loading = false;
    }
  }

  /**
   * Re-read the signed-in user, leaving `loading` alone.
   *
   * Not `load()`, and the difference matters: the root layout uses `loading` as
   * its auth gate, so a page that called `load()` to pick up a name it had just
   * saved would swap the whole workspace for "Loading workspace…", unmount
   * itself mid-save and lose its own success toast. This is the call for "the
   * user I am already showing has changed".
   *
   * A failed refresh keeps the current user rather than clearing it — the
   * session is still valid, we just did not get an update.
   */
  async refreshUser(): Promise<void> {
    try {
      const response = await api.api.auth.me.$get();
      if (response.ok) this.#user = ((await response.json()) as { data: Me }).data;
    } catch {
      // Keep what we have; this is a refresh, not a sign-out.
    }
  }

  /** Resolves to an error message, or null on success. */
  async login(email: string, password: string): Promise<string | null> {
    const response = await api.api.auth.login.$post({ json: { email, password } });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      return body?.error?.message ?? `Sign in failed (${response.status}).`;
    }

    this.#user = ((await response.json()) as { data: Me }).data;
    // Already resolved — no guard should refetch `/me` right after a login.
    this.#pending = Promise.resolve();
    return null;
  }

  async logout(): Promise<void> {
    await api.api.auth.logout.$post().catch(() => undefined);
    this.clear();
  }

  /**
   * Forget the signed-in user without calling the server. For when the session
   * is already gone server-side and there is nothing left to revoke — changing
   * your own password revokes every session including this one, and the
   * response has already cleared the cookie.
   */
  clear(): void {
    this.#user = null;
    // Let the next guard refetch rather than trusting this cleared state.
    this.#pending = null;
  }

  /** Integer permission check — pass a code from `@mia/permissions`. */
  can(code: number): boolean {
    return canCode(this.#user, code);
  }

  canAny(...codes: number[]): boolean {
    return canAnyCode(this.#user, codes);
  }
}

export const session = new Session();
