import { can, canAll, canAny, permissionByCode } from '@mia/permissions';
import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';

import type { AppEnv, SessionCustomer, SessionUser } from '../http/context.ts';
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

/**
 * Attribute-based guard. Codes come from `@mia/permissions` (`P.ORDER_UPDATE`),
 * and the comparison is integer-only — a superuser short-circuits to allowed.
 *
 * There is deliberately no `requireRole` counterpart: codes are the only unit of
 * access, so a guard that asked about anything else would be answering a
 * question the system does not model.
 *
 * Listing several codes requires **all** of them; use `requireAnyPermission`
 * for alternatives. Route-level guards answer "may this caller do this at all";
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
 * Storefront counterpart of `requireAuth`. Pairs with `withCustomerSession`.
 *
 * There is no permission dimension here and never will be: a customer's access is
 * always "their own rows", which is a service-layer question about a specific
 * resource, not something a route guard can answer.
 */
export const requireCustomer = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.get('customer')) throw unauthorized();
  await next();
});

/** The authenticated customer inside a handler already behind `requireCustomer`. */
export function currentCustomer(c: Context<AppEnv>): SessionCustomer {
  const customer = c.get('customer');
  if (!customer) throw unauthorized();
  return customer;
}

/**
 * 403 naming the permission keys the caller lacks. Safe to expose: it says what
 * capability is needed, never what the resource is or whether it exists.
 */
function missingPermission(codes: number[]) {
  const keys = codes.map((code) => permissionByCode(code)?.key ?? String(code));
  return forbidden(`Requires permission: ${keys.join(', ')}.`);
}
