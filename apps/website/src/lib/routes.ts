/**
 * Public route paths — single source of truth.
 *
 * Changing a public URL is an SEO event, so every path lives here rather than
 * as a literal scattered through components. Italian slugs match the storefront
 * design and the live site's URL shape.
 */
import type { SiteLocale } from './i18n.ts';

export const routePaths = {
  it: {
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
    signContract: '/firma-contratto/',
    blog: '/blog/',
  },
  en: {
    home: '/en/',
    catalog: '/en/rental-catalog/',
    product: '/en/product/',
    search: '/en/search/',
    support: '/en/support/',
    cart: '/en/cart/',
    checkout: '/en/checkout/',
    terms: '/en/terms-and-conditions/',
    privacy: '/en/privacy-policy/',
    cookies: '/en/cookie-policy/',
    login: '/en/sign-in/',
    account: '/en/customer-area/',
    accountOrders: '/en/customer-area/orders/',
    activateAccount: '/en/activate-account/',
    resetPassword: '/en/reset-password/',
    reportOrder: '/en/report-order/',
    signContract: '/en/sign-contract/',
    blog: '/en/blog/',
  },
} as const;

/** Italian is the unprefixed default. Kept for existing route imports. */
export const routes = routePaths.it;

export type RouteKey = keyof typeof routes;

export function routePath(locale: SiteLocale, key: RouteKey): string {
  return routePaths[locale][key];
}

/**
 * The home search's two answers — where, and from when — carried through
 * browsing. They are NOT filters: the catalogue echoes them back and the
 * product page prints the city and prefills its start date from them. They ride
 * the query string because the storefront is server-rendered and has no session
 * to keep them in, and every browse link has to hand them on or the funnel
 * forgets what the customer already told it.
 *
 * `duration` rides along for the catalogue's sentence only. It cannot reach the
 * product page: a rental is priced by a package now, and "30 giorni" from the
 * home selector is not one of this product's packages.
 */
export interface BrowseContext {
  area?: string;
  from?: string;
  duration?: string;
}

function appendContext(search: URLSearchParams, context: BrowseContext): void {
  if (context.area) search.set('area', context.area);
  if (context.from) search.set('from', context.from);
  if (context.duration) search.set('duration', context.duration);
}

/**
 * A product's page. The context is for BROWSE links only — the canonical URL
 * and the JSON-LD `url` must stay bare, or every carried area mints a duplicate
 * of the same product in the index.
 */
export function productPath(
  slug: string,
  context: BrowseContext = {},
  locale: SiteLocale = 'it',
): string {
  const search = new URLSearchParams();
  appendContext(search, context);
  const qs = search.toString();
  const base = routePath(locale, 'product');
  return qs ? `${base}${slug}/?${qs}` : `${base}${slug}/`;
}

export function blogPostPath(slug: string, locale: SiteLocale = 'it'): string {
  return `${routePath(locale, 'blog')}${slug}/`;
}

export function blogPath(
  params: { categoria?: string; page?: number } = {},
  locale: SiteLocale = 'it',
): string {
  const search = new URLSearchParams();
  if (params.categoria) search.set('categoria', params.categoria);
  if (params.page && params.page > 1) search.set('page', String(params.page));
  const qs = search.toString();
  const base = routePath(locale, 'blog');
  return qs ? `${base}?${qs}` : base;
}

/** Catalogue URL with the browse state preserved. */
export function catalogPath(
  params: { q?: string; category?: string; sort?: string; page?: number } & BrowseContext = {},
  locale: SiteLocale = 'it',
): string {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.category) search.set('category', params.category);
  if (params.sort) search.set('sort', params.sort);
  if (params.page && params.page > 1) search.set('page', String(params.page));
  appendContext(search, params);
  const qs = search.toString();
  const base = routePath(locale, 'catalog');
  return qs ? `${base}?${qs}` : base;
}

/** One customer's order, by the number they were given. */
export function accountOrderPath(number: string, locale: SiteLocale = 'it'): string {
  return `${routePath(locale, 'accountOrders')}${encodeURIComponent(number)}/`;
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
  'signContract',
];
