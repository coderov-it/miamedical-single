import { eq } from '@mia/db';
import { adminSessions, adminUsers } from '@mia/db/schema';
import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import type { CookieOptions } from 'hono/utils/cookie';
import { randomBytes } from 'node:crypto';

import { env } from '../../config/env.ts';
import type { AppEnv, SessionUser } from '../http/context.ts';

/**
 * Back-office session cookie. Customers get a separate one
 * (`mia_customer_session`, see ./customer-session.ts) so that signing into the
 * panel and browsing the storefront cannot clobber each other.
 */
export const SESSION_COOKIE = 'mia_session';

/**
 * Fixed, not sliding: a back-office session ends this long after sign-in whatever
 * the operator does in between. `customer-session.ts` slides instead, and says
 * there why the two differ.
 */
export const SESSION_TTL_MS = env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

/** SHA-256 of the raw token — the DB only ever stores the hash. */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** 256 bits of CSPRNG output. Only ever exists in the cookie and this return. */
export function createSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

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

export function setSessionCookie(c: Context, token: string, expiresAt: Date): void {
  setCookie(c, SESSION_COOKIE, token, cookieOptions(expiresAt));
}

export function clearSessionCookie(c: Context): void {
  // The attributes must match the ones the cookie was set with, or the browser
  // keeps the original and the user stays "logged in" until it expires.
  deleteCookie(c, SESSION_COOKIE, cookieOptions(new Date(0)));
}

export function readSessionCookie(c: Context): string | undefined {
  return getCookie(c, SESSION_COOKIE);
}

/**
 * Resolves the current user onto the context. Never rejects — routes decide
 * whether authentication is required via the guards in ./guards.ts.
 */
export const withSession = createMiddleware<AppEnv>(async (c, next) => {
  c.set('user', null);

  const token = readSessionCookie(c);
  if (token) {
    const [row] = await c
      .get('db')
      .select({
        id: adminUsers.id,
        email: adminUsers.email,
        fullName: adminUsers.fullName,
        isSuperuser: adminUsers.isSuperuser,
        permissions: adminUsers.permissions,
        expiresAt: adminSessions.expiresAt,
        isActive: adminUsers.isActive,
      })
      .from(adminSessions)
      .innerJoin(adminUsers, eq(adminUsers.id, adminSessions.adminUserId))
      .where(eq(adminSessions.id, await hashToken(token)))
      .limit(1);

    if (row && row.isActive && row.expiresAt > new Date()) {
      c.set('user', {
        id: row.id,
        email: row.email,
        fullName: row.fullName,
        isSuperuser: row.isSuperuser,
        permissions: row.permissions,
      } satisfies SessionUser);
    }
  }

  await next();
});
