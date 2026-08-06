import { createMiddleware } from 'hono/factory';

import type { AppEnv, SessionUser } from '../http/context.ts';
import { forbidden, unauthorized } from '../http/errors.ts';

/** Reject anonymous callers. Pairs with `withSession`, which resolves the user. */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.get('user')) throw unauthorized();
  await next();
});

export function requireRole(...roles: SessionUser['role'][]) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get('user');
    if (!user) throw unauthorized();
    if (!roles.includes(user.role)) throw forbidden();
    await next();
  });
}
