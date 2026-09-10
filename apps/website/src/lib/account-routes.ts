/**
 * Which account screen a path names, and which path names a screen.
 *
 * PURE — no runes, no DOM, no `window`. That is deliberate: this is the half of
 * the router where a bug is silent and locale-specific (a French path that
 * fails to parse makes the back button reload the page instead of moving
 * screens), and it is the only half `node --test` can execute, because runes
 * are a compiler transform rather than a runtime function. The stateful half
 * lives in `account-router.svelte.ts`.
 *
 * It carries NO locale logic and never names a language. The paths arrive
 * already resolved for one locale, in `AccountCopy.routes`, built by
 * `accountCopy()` from `routePath()`. In the browser `location.pathname` is
 * also the public path — the middleware's rewrite onto the source-language
 * route declaration is internal and never visible to the client — so the two
 * match by construction in all four languages.
 */
import type { AccountCopy } from './account-page.ts';

/** The locale's own account paths. `orderDetail` carries a `{number}` slot. */
export type AccountRoutes = AccountCopy['routes'];

export type AccountScreen =
  { name: 'account' } | { name: 'orders' } | { name: 'orderDetail'; number: string };

const NUMBER_SLOT = '{number}';

/**
 * Astro sets no `trailingSlash`, so the default `'ignore'` serves
 * `/area-clienti/ordini` and `/area-clienti/ordini/` as the same route. The
 * route table always carries the slash, so normalise before comparing.
 */
function withTrailingSlash(path: string): string {
  if (path.endsWith('/')) return path;
  return `${path}/`;
}

/** What sits either side of the `{number}` slot. `null` if the slot is gone. */
function orderDetailParts(routes: AccountRoutes): { prefix: string; suffix: string } | null {
  const at = routes.orderDetail.indexOf(NUMBER_SLOT);
  if (at === -1) return null;
  return {
    prefix: routes.orderDetail.slice(0, at),
    suffix: routes.orderDetail.slice(at + NUMBER_SLOT.length),
  };
}

/**
 * The path for a screen, in the locale the routes came from.
 *
 * The number is percent-encoded, matching `accountOrderPath()` on the server
 * side and `parseAccountPath()`'s decode below.
 */
export function accountHref(routes: AccountRoutes, screen: AccountScreen): string {
  if (screen.name === 'account') return routes.account;
  if (screen.name === 'orders') return routes.accountOrders;

  const parts = orderDetailParts(routes);
  /* A template with no slot is a bug in `accountCopy()`, not something a
     customer can cause. Falling back to the list keeps navigation working and
     is visibly wrong in review, which a thrown error in a click handler is
     not. */
  if (!parts) return routes.accountOrders;

  return `${parts.prefix}${encodeURIComponent(screen.number)}${parts.suffix}`;
}

/**
 * The screen a path names, or `null` when it is not one of ours.
 *
 * ORDER MATTERS. `account` is a prefix of `accountOrders`, which is in turn the
 * order-detail prefix, in every locale — so the exact matches have to be tried
 * before the prefix match or every screen parses as an order detail.
 *
 * `null` is not an error: the caller reloads rather than painting a screen the
 * URL does not describe.
 */
export function parseAccountPath(routes: AccountRoutes, pathname: string): AccountScreen | null {
  const path = withTrailingSlash(pathname);

  if (path === withTrailingSlash(routes.account)) return { name: 'account' };
  if (path === withTrailingSlash(routes.accountOrders)) return { name: 'orders' };

  const parts = orderDetailParts(routes);
  if (!parts) return null;
  if (!path.startsWith(parts.prefix)) return null;
  if (!path.endsWith(parts.suffix)) return null;

  const raw = path.slice(parts.prefix.length, path.length - parts.suffix.length);
  /* One segment, and a real one. `''` is the list, which was matched above;
     anything with a slash is a deeper path we do not serve. */
  if (raw === '' || raw.includes('/')) return null;

  try {
    return { name: 'orderDetail', number: decodeURIComponent(raw) };
  } catch {
    /* A lone `%` is a malformed escape and `decodeURIComponent` throws on it.
       Unhandled, that would take out the `popstate` listener and wedge the
       router for the rest of the document's life. */
    return null;
  }
}
