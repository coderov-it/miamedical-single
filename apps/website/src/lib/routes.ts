/**
 * Public route paths — single source of truth.
 *
 * Changing a public URL is an SEO event, so every path lives here rather than
 * as a literal scattered through components. Italian slugs match the storefront
 * design and the live site's URL shape.
 */
export const routes = {
  home: '/',
  catalog: '/catalogo-noleggio/',
  product: '/prodotto/',
  search: '/cerca/',
  support: '/assistenza/',
  cart: '/carrello/',
  /* "Checkout" is the loanword Italian e-commerce actually uses, and it is what
     the owner's reference design names this step. */
  checkout: '/checkout/',
  terms: '/termini-e-condizioni/',
  privacy: '/privacy-policy/',
  cookies: '/cookie-policy/',

  /* Customer area. "Area clienti" is the term Italian e-commerce actually uses.
     ⚠️ The server builds email links from its own copy of these paths, in
     apps/server/src/modules/notifications/links.ts — it cannot import from this
     app. Change a path here and you must change it there, or every link in every
     account email 404s. */
  login: '/accedi/',
  account: '/area-clienti/',
  accountOrders: '/area-clienti/ordini/',
  activateAccount: '/attiva-account/',
  resetPassword: '/reimposta-password/',
  reportOrder: '/segnala-ordine/',
} as const;

export type RouteKey = keyof typeof routes;

export function productPath(slug: string): string {
  return `${routes.product}${slug}/`;
}

/** Catalogue URL with the browse state preserved. */
export function catalogPath(
  params: { q?: string; category?: string; sort?: string; page?: number } = {},
): string {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.category) search.set('category', params.category);
  if (params.sort) search.set('sort', params.sort);
  if (params.page && params.page > 1) search.set('page', String(params.page));
  const qs = search.toString();
  return qs ? `${routes.catalog}?${qs}` : routes.catalog;
}

/** One customer's order, by the number they were given. */
export function accountOrderPath(number: string): string {
  return `${routes.accountOrders}${encodeURIComponent(number)}/`;
}

/**
 * Routes that must never be indexed and must be served `no-store`.
 *
 * Every account route is here. Two reasons beyond the obvious: the token-bearing
 * pages carry a live credential in their query string, which must not reach a
 * cache or an index; and a sign-in form in search results is a phishing surface
 * with no upside, since nobody finds their order history through Google.
 */
export const PRIVATE_ROUTES: RouteKey[] = [
  'cart',
  'checkout',
  'login',
  'account',
  'accountOrders',
  'activateAccount',
  'resetPassword',
  'reportOrder',
];
