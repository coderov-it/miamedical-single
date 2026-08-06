import { eq } from '@mia/db';
import { sessions, users } from '@mia/db/schema';
import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';

import type { AppEnv, SessionUser } from '../http/context.ts';

export const SESSION_COOKIE = 'mia_session';

/** SHA-256 of the raw token — the DB only ever stores the hash. */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Resolves the current user onto the context. Never rejects — routes decide
 * whether authentication is required via the guards in ./guards.ts.
 */
export const withSession = createMiddleware<AppEnv>(async (c, next) => {
  c.set('user', null);

  const token = getCookie(c, SESSION_COOKIE);
  if (token) {
    const [row] = await c
      .get('db')
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        expiresAt: sessions.expiresAt,
        isActive: users.isActive,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(eq(sessions.id, await hashToken(token)))
      .limit(1);

    if (row && row.isActive && row.expiresAt > new Date()) {
      c.set('user', { id: row.id, email: row.email, role: row.role } satisfies SessionUser);
    }
  }

  await next();
});
