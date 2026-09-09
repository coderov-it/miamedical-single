/**
 * Public route paths — single source of truth.
 *
 * Changing a public URL is an SEO event, so every path lives here rather than
 * as a literal scattered through components. Italian slugs match the storefront
 * design and the live site's URL shape.
 */
import { SOURCE_LANGUAGE, type SiteLocale } from './i18n.ts';

export const routePaths = {
  it: {
    home: '/',
    /**
     * The catalogue is three destinations, not one: a category directory, and a
     * product listing per pricing mode. `catalogRental` keeps the URL the site
     * has always had — it always meant the rental listing, and now it is one.
     */
    catalog: '/catalogo/',
    catalogRental: '/catalogo-noleggio/',
    catalogSale: '/catalogo-vendita/',
    product: '/prodotto/',
    search: '/cerca/',
    /**
     * The guided selector. Italian keeps the live site's own slug, which is an
     * indexed URL there and stays one here; English gets a real English path
     * because nothing links to `/en/aiutami-a-scegliere/` yet.
     */
    productFinder: '/aiutami-a-scegliere/',
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
    catalog: '/en/catalog/',
    catalogRental: '/en/rental-catalog/',
    catalogSale: '/en/sale-catalog/',
    product: '/en/product/',
    search: '/en/search/',
    productFinder: '/en/help-me-choose/',
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
  /**
   * French. Every path is prefixed, exactly like English — only the source
   * language is unprefixed, and that is a property of the registry, not a fact
   * about Italian written into this table.
   *
   * Nothing links to these yet, so unlike the Italian slugs they carry no SEO
   * commitment: they are chosen to read naturally in French rather than to
   * preserve a URL somebody already indexed. Once published they inherit the
   * same rule as the rest of this file — changing one is an SEO event.
   */
  fr: {
    home: '/fr/',
    catalog: '/fr/catalogue/',
    catalogRental: '/fr/catalogue-location/',
    catalogSale: '/fr/catalogue-vente/',
    product: '/fr/produit/',
    search: '/fr/recherche/',
    productFinder: '/fr/aidez-moi-a-choisir/',
    support: '/fr/assistance/',
    cart: '/fr/panier/',
    checkout: '/fr/commande/',
    terms: '/fr/conditions-generales/',
    privacy: '/fr/politique-de-confidentialite/',
    cookies: '/fr/politique-de-cookies/',
    login: '/fr/connexion/',
    account: '/fr/espace-client/',
    accountOrders: '/fr/espace-client/commandes/',
    activateAccount: '/fr/activer-le-compte/',
    resetPassword: '/fr/reinitialiser-le-mot-de-passe/',
    reportOrder: '/fr/signaler-une-commande/',
    signContract: '/fr/signer-le-contrat/',
    blog: '/fr/blog/',
  },
  /**
   * German. Slugs are written as German reads them rather than as calques of
   * the Italian: `agb` is what a German site calls its terms, `warenkorb` its
   * cart, and `auswahlhilfe` is the compound German forms where French needed a
   * phrase. Umlauts are transliterated — `zuruecksetzen`, not `zurücksetzen` —
   * for the same reason the French paths dropped their accents.
   *
   * Like the French block these carry no SEO history yet, and inherit the
   * file's rule the moment they are published: changing one is an SEO event.
   */
  de: {
    home: '/de/',
    catalog: '/de/katalog/',
    catalogRental: '/de/mietkatalog/',
    catalogSale: '/de/verkaufskatalog/',
    product: '/de/produkt/',
    search: '/de/suche/',
    productFinder: '/de/auswahlhilfe/',
    support: '/de/kundenservice/',
    cart: '/de/warenkorb/',
    checkout: '/de/kasse/',
    terms: '/de/agb/',
    privacy: '/de/datenschutz/',
    cookies: '/de/cookie-richtlinie/',
    login: '/de/anmelden/',
    account: '/de/kundenbereich/',
    accountOrders: '/de/kundenbereich/bestellungen/',
    activateAccount: '/de/konto-aktivieren/',
    resetPassword: '/de/passwort-zuruecksetzen/',
    reportOrder: '/de/bestellung-melden/',
    signContract: '/de/vertrag-unterzeichnen/',
    blog: '/de/blog/',
  },
} as const;

/** The source language is the unprefixed one. Kept for existing route imports. */
export const routes = routePaths[SOURCE_LANGUAGE];

export type RouteKey = keyof typeof routes;

/**
 * `satisfies` rather than an annotation on `routePaths`: it keeps every path a
 * literal type — the middleware builds lookup tables out of them — while making
 * a registered language with no route table, or a language missing one route, a
 * compile error here rather than a 404 in production.
 */
const _routeTableIsComplete = routePaths satisfies Record<SiteLocale, Record<RouteKey, string>>;
void _routeTableIsComplete;

export function routePath(locale: SiteLocale, key: RouteKey): string {
  return routePaths[locale][key];
}

/**
 * The home search's answers — where, from when, and roughly how long — carried
 * through browsing. They are NOT filters: the catalogue echoes them back and
 * the product page prints the city and prefills its start date from them. They
 * ride the query string because the storefront is server-rendered and has no
 * session to keep them in, and every browse link has to hand them on or the
 * funnel forgets what the customer already told it.
 *
 * `for` is the duration, back by the owner's hero reference (2026-08-31) after
 * leaving on 2026-08-30. What changed: it no longer pretends to be a package
 * ("30 giorni"), it is a fuzzy intent bucket ('1w'…'2m', 'unsure') that rides
 * as context only — nothing prices from it, nothing filters by it.
 */
export interface BrowseContext {
  area?: string;
  from?: string;
  for?: string;
}

function appendContext(search: URLSearchParams, context: BrowseContext): void {
  if (context.area) search.set('area', context.area);
  if (context.from) search.set('from', context.from);
  if (context.for) search.set('for', context.for);
}

/**
 * A product's page. The context is for BROWSE links only — the canonical URL
 * and the JSON-LD `url` must stay bare, or every carried area mints a duplicate
 * of the same product in the index.
 */
export function productPath(
  slug: string,
  context: BrowseContext = {},
  locale: SiteLocale = SOURCE_LANGUAGE,
): string {
  const search = new URLSearchParams();
  appendContext(search, context);
  const qs = search.toString();
  const base = routePath(locale, 'product');
  return qs ? `${base}${slug}/?${qs}` : `${base}${slug}/`;
}

export function blogPostPath(slug: string, locale: SiteLocale = SOURCE_LANGUAGE): string {
  return `${routePath(locale, 'blog')}${slug}/`;
}

export function blogPath(
  params: { categoria?: string; page?: number } = {},
  locale: SiteLocale = SOURCE_LANGUAGE,
): string {
  const search = new URLSearchParams();
  if (params.categoria) search.set('categoria', params.categoria);
  if (params.page && params.page > 1) search.set('page', String(params.page));
  const qs = search.toString();
  const base = routePath(locale, 'blog');
  return qs ? `${base}?${qs}` : base;
}

/**
 * Which of the three catalogue surfaces a link points at.
 *
 * `all` is the only one that changes shape with its query: bare, it is the
 * category directory; narrowed by a category or a search it becomes a product
 * listing across both modes. `rental` and `sale` are always listings.
 */
export type CatalogView = 'all' | 'rental' | 'sale';

const CATALOG_ROUTE: Record<CatalogView, RouteKey> = {
  all: 'catalog',
  rental: 'catalogRental',
  sale: 'catalogSale',
};

export function catalogRoot(view: CatalogView, locale: SiteLocale = SOURCE_LANGUAGE): string {
  return routePath(locale, CATALOG_ROUTE[view]);
}

/** Catalogue URL with the browse state preserved. */
export function catalogPath(
  params: {
    view?: CatalogView;
    q?: string;
    category?: string;
    /** Product type, and the group inside it — see lib/product-types.ts. */
    type?: string;
    group?: string;
    sort?: string;
    /** "Solo disponibili". Absent means both, so only `true` is ever written. */
    inStock?: boolean;
    layout?: string;
    page?: number;
  } & BrowseContext = {},
  locale: SiteLocale = SOURCE_LANGUAGE,
): string {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.category) search.set('category', params.category);
  if (params.type) search.set('type', params.type);
  /* A group is a subdivision OF a type and means nothing on its own, so it
     never rides alone — a hand-edited `?group=` is dropped, not guessed at. */
  if (params.type && params.group) search.set('group', params.group);
  if (params.sort) search.set('sort', params.sort);
  if (params.inStock) search.set('stock', '1');
  /* `grid` is the default and never written — a URL should carry a choice, not
     a restatement of what the page does anyway. */
  if (params.layout === 'list') search.set('layout', 'list');
  if (params.page && params.page > 1) search.set('page', String(params.page));
  appendContext(search, params);
  const qs = search.toString();
  const base = catalogRoot(params.view ?? 'all', locale);
  return qs ? `${base}?${qs}` : base;
}

/** Search URL carrying what the customer already told the home booking bar. */
export function searchPath(
  params: { q?: string; category?: string; sort?: string; page?: number } & BrowseContext = {},
  locale: SiteLocale = SOURCE_LANGUAGE,
): string {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.category) search.set('category', params.category);
  if (params.sort) search.set('sort', params.sort);
  if (params.page && params.page > 1) search.set('page', String(params.page));
  appendContext(search, params);
  const qs = search.toString();
  const base = routePath(locale, 'search');
  return qs ? `${base}?${qs}` : base;
}

/** One customer's order, by the number they were given. */
export function accountOrderPath(number: string, locale: SiteLocale = SOURCE_LANGUAGE): string {
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
