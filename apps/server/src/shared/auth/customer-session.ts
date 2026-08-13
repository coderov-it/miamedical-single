import { eq, lt } from '@mia/db';
import { customerAccounts, customerSessions } from '@mia/db/schema';
import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import type { CookieOptions } from 'hono/utils/cookie';

import { env } from '../../config/env.ts';
import type { AppEnv, SessionCustomer } from '../http/context.ts';
import { createSessionToken, hashToken } from './session.ts';

/**
 * Storefront sessions. Same mechanism as the back office in `session.ts` — an
 * opaque random token in an HttpOnly cookie, only its SHA-256 in the database —
 * and `hashToken`/`createSessionToken` are imported from there rather than
 * reimplemented, so there is one definition of how a session token is made.
 *
 * Two things differ, both deliberately:
 *
 *  1. A separate cookie name. An operator browsing the storefront while signed
 *     into the panel must not have either session clobber the other.
 *  2. Sliding expiry (below). `session.ts` is fixed-expiry and says why.
 */

export const CUSTOMER_SESSION_COOKIE = 'mia_customer_session';

export const CUSTOMER_SESSION_TTL_MS = env.CUSTOMER_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

const REFRESH_AFTER_MS = env.CUSTOMER_SESSION_REFRESH_HOURS * 60 * 60 * 1000;

const SAME_SITE = { lax: 'Lax', strict: 'Strict', none: 'None' } as const;

function cookieOptions(expires: Date): CookieOptions {
  const sameSite = SAME_SITE[env.AUTH_COOKIE_SAMESITE];

  return {
    path: '/',
    httpOnly: true,
    // A cross-site cookie is only accepted when it is also Secure.
    secure: env.NODE_ENV === 'production' || sameSite === 'None',
    sameSite,
    expires,
    ...(env.AUTH_COOKIE_DOMAIN ? { domain: env.AUTH_COOKIE_DOMAIN } : {}),
  };
}

export function setCustomerSessionCookie(c: Context, token: string, expiresAt: Date): void {
  setCookie(c, CUSTOMER_SESSION_COOKIE, token, cookieOptions(expiresAt));
}

export function clearCustomerSessionCookie(c: Context): void {
  // The attributes must match the ones the cookie was set with, or the browser
  // keeps the original and the customer stays "signed in" until it expires.
  deleteCookie(c, CUSTOMER_SESSION_COOKIE, cookieOptions(new Date(0)));
}

export function readCustomerSessionCookie(c: Context): string | undefined {
  return getCookie(c, CUSTOMER_SESSION_COOKIE);
}

export { createSessionToken, hashToken };

/**
 * Resolves the current customer onto the context. Never rejects — routes decide
 * whether authentication is required, via `requireCustomer` in ./guards.ts.
 */
export const withCustomerSession = createMiddleware<AppEnv>(async (c, next) => {
  c.set('customer', null);

  const token = readCustomerSessionCookie(c);
  if (!token) {
    await next();
    return;
  }

  const tokenHash = await hashToken(token);
  const db = c.get('db');

  const [row] = await db
    .select({
      id: customerAccounts.id,
      email: customerAccounts.email,
      firstName: customerAccounts.firstName,
      lastName: customerAccounts.lastName,
      activatedAt: customerAccounts.activatedAt,
      passwordHash: customerAccounts.passwordHash,
      isActive: customerAccounts.isActive,
      deletedAt: customerAccounts.deletedAt,
      expiresAt: customerSessions.expiresAt,
    })
    .from(customerSessions)
    .innerJoin(customerAccounts, eq(customerAccounts.id, customerSessions.customerAccountId))
    .where(eq(customerSessions.id, tokenHash))
    .limit(1);

  const now = new Date();
  const usable =
    row && row.isActive && row.deletedAt === null && row.expiresAt.getTime() > now.getTime();

  if (usable) {
    c.set('customer', {
      id: row.id,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      activatedAt: row.activatedAt,
      hasPassword: row.passwordHash !== null,
    } satisfies SessionCustomer);

    /*
      Sliding expiry. Only when the row has drifted more than
      CUSTOMER_SESSION_REFRESH_HOURS below a full TTL — otherwise every request
      from an active customer would write a row, which is a write per page view
      for no benefit. A customer who visits monthly is never signed out; a session
      left alone still dies on schedule.
    */
    const fullTtlFromNow = now.getTime() + CUSTOMER_SESSION_TTL_MS;
    if (fullTtlFromNow - row.expiresAt.getTime() > REFRESH_AFTER_MS) {
      const expiresAt = new Date(fullTtlFromNow);
      await db
        .update(customerSessions)
        .set({ expiresAt })
        .where(eq(customerSessions.id, tokenHash));
      setCustomerSessionCookie(c, token, expiresAt);
    }
  }

  await next();
});

/**
 * Housekeeping. `withCustomerSession` already refuses an expired row, so this only
 * keeps the table from growing forever — nothing depends on it being prompt, and
 * it is safe to run from the same schedule as the media-orphan sweep.
 */
export async function deleteExpiredCustomerSessions(
  db: AppEnv['Variables']['db'],
): Promise<number> {
  const rows = await db
    .delete(customerSessions)
    .where(lt(customerSessions.expiresAt, new Date()))
    .returning({ id: customerSessions.id });
  return rows.length;
}
