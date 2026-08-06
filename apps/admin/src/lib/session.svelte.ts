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

  get user() {
    return this.#user;
  }

  get loading() {
    return this.#loading;
  }

  get isAuthenticated() {
    return this.#user !== null;
  }

  /** Resolve the current session. Call once, at startup. */
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
    return null;
  }

  async logout(): Promise<void> {
    await api.api.auth.logout.$post().catch(() => undefined);
    this.#user = null;
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
