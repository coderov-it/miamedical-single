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

/** Routes that must never be indexed and must be served `no-store`. */
export const PRIVATE_ROUTES: RouteKey[] = ['cart', 'checkout'];
