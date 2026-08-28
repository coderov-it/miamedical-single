/**
 * The single page -> permission mapping.
 *
 * Both the sidebar and the route guard read this table, so a link can never
 * drift from the checkpost behind it: if a page is locked, its nav entry
 * disappears; if a nav entry shows, following it works. Nav files carry
 * presentation only and never declare a permission of their own.
 *
 * `requiredAny` is OR — holding any one code opens the page. An empty array
 * means the page is open to any signed-in user.
 */

import { P } from '@mia/permissions';

import { routePatterns, routes } from './routes.ts';

export interface RouteAccess {
  readonly pattern: string;
  readonly requiredAny: readonly number[];
}

export const ROUTE_ACCESS: readonly RouteAccess[] = [
  { pattern: routes.dashboard, requiredAny: [P.DASHBOARD_READ] },

  { pattern: routes.products, requiredAny: [P.PRODUCT_READ] },
  { pattern: routes.productNew, requiredAny: [P.PRODUCT_CREATE] },
  { pattern: routePatterns.productDetail, requiredAny: [P.PRODUCT_READ] },

  { pattern: routes.categories, requiredAny: [P.CATEGORY_READ] },
  { pattern: routes.terms, requiredAny: [P.TERMS_READ] },

  { pattern: routes.rentals, requiredAny: [P.RENTAL_READ] },
  { pattern: routes.payments, requiredAny: [P.PAYMENT_READ] },

  { pattern: routes.orders, requiredAny: [P.ORDER_READ] },
  { pattern: routePatterns.orderDetail, requiredAny: [P.ORDER_READ] },
  { pattern: routes.contracts, requiredAny: [P.CONTRACT_READ] },
  { pattern: routes.contractNew, requiredAny: [P.CONTRACT_CREATE] },
  { pattern: routePatterns.contractDetail, requiredAny: [P.CONTRACT_READ] },
  { pattern: routes.carts, requiredAny: [P.ORDER_READ] },
  { pattern: routes.orderDisputes, requiredAny: [P.ORDER_DISPUTE_READ] },

  { pattern: routes.blog, requiredAny: [P.BLOG_READ] },
  { pattern: routes.blogNew, requiredAny: [P.BLOG_CREATE] },
  { pattern: routePatterns.blogDetail, requiredAny: [P.BLOG_READ] },
  { pattern: routes.blogCategories, requiredAny: [P.BLOG_CATEGORY_READ] },

  { pattern: routes.notificationSettings, requiredAny: [P.SETTING_READ] },

  // Reading the operator list is its own grant, not part of "can look around":
  // it names every account and everything each one can reach.
  { pattern: routes.adminUsers, requiredAny: [P.ADMIN_READ] },
];

/**
 * Static segments beat `:param` ones, so `/products/new` resolves to its own
 * entry rather than to `/products/:id`. Scored rather than ordered because an
 * ordered list silently breaks the first time someone appends to it.
 */
function score(pattern: string): number {
  return pattern
    .split('/')
    .filter(Boolean)
    .reduce((total, segment) => total + (segment.startsWith(':') ? 1 : 3), 0);
}

function matches(pattern: string, pathname: string): boolean {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return false;
  return patternParts.every((part, i) => part.startsWith(':') || part === pathParts[i]);
}

/** The most specific matching entry, or undefined when nothing matches. */
export function resolveRouteAccess(pathname: string): RouteAccess | undefined {
  let best: RouteAccess | undefined;
  let bestScore = -1;

  for (const entry of ROUTE_ACCESS) {
    if (!matches(entry.pattern, pathname)) continue;
    const entryScore = score(entry.pattern);
    if (entryScore > bestScore) {
      best = entry;
      bestScore = entryScore;
    }
  }
  return best;
}

/** Whether a subject may open a path. Unmapped paths are open. */
export function canVisit(pathname: string, can: (code: number) => boolean): boolean {
  const entry = resolveRouteAccess(pathname);
  if (!entry || entry.requiredAny.length === 0) return true;
  return entry.requiredAny.some(can);
}
