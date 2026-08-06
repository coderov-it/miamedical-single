import { can, canAll, canAny, permissionByCode } from '@mia/permissions';
import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';

import type { AppEnv, SessionUser } from '../http/context.ts';
import { forbidden, unauthorized } from '../http/errors.ts';

/** Reject anonymous callers. Pairs with `withSession`, which resolves the user. */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.get('user')) throw unauthorized();
  await next();
});

/**
 * The authenticated user inside a handler already behind `requireAuth`.
 * Middleware cannot narrow `c.get('user')`, so this re-checks instead of
 * scattering non-null assertions through the route files.
 */
export function currentUser(c: Context<AppEnv>): SessionUser {
  const user = c.get('user');
  if (!user) throw unauthorized();
  return user;
}

export function requireRole(...roles: SessionUser['role'][]) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get('user');
    if (!user) throw unauthorized();
    if (!roles.includes(user.role)) throw forbidden();
    await next();
  });
}

/**
 * Attribute-based guard. Codes come from `@mia/permissions` (`P.ORDER_UPDATE`),
 * and the comparison is integer-only — `super_admin` short-circuits to allowed.
 *
 * Listing several codes requires **all** of them; use `requireAnyPermission`
 * for alternatives. Route-level guards answer "may this role do this at all";
 * anything that depends on the specific resource belongs in `service.ts`.
 */
export function requirePermission(...codes: number[]) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get('user');
    if (!user) throw unauthorized();
    if (!canAll(user, codes)) throw missingPermission(codes.filter((code) => !can(user, code)));
    await next();
  });
}

export function requireAnyPermission(...codes: number[]) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get('user');
    if (!user) throw unauthorized();
    if (!canAny(user, codes)) throw missingPermission(codes);
    await next();
  });
}

/**
 * 403 naming the permission keys the caller lacks. Safe to expose: it says what
 * capability is needed, never what the resource is or whether it exists.
 */
function missingPermission(codes: number[]) {
  const keys = codes.map((code) => permissionByCode(code)?.key ?? String(code));
  return forbidden(`Requires permission: ${keys.join(', ')}.`);
}
