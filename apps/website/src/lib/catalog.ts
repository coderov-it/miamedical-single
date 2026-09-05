/**
 * Catalogue read models — thin typed wrappers over the RPC client. Every shape
 * is inferred from the Hono router, so a DTO change on the server surfaces here
 * as a type error rather than a runtime surprise on a rendered page.
 *
 * Italian-first: `locale: 'it'` everywhere, with the server's `en → it` fallback
 * applied per field. See docs/code/storefront-design-system.md.
 */
import type { InferResponseType } from 'hono/client';

import { api } from './api.ts';
import { localeForRequest, type SiteLocale } from './i18n.ts';

type ProductListResponse = InferResponseType<typeof api.api.products.$get, 200>;

export type ProductSummary = ProductListResponse['data'][number];
export type PageMeta = ProductListResponse['meta'];
export type SpecFacet = ProductListResponse['facets']['specs'][number];

export type ProductDetail = InferResponseType<
  (typeof api.api.products)[':slug']['$get'],
  200
>['data'];

export type Category = InferResponseType<typeof api.api.categories.$get, 200>['data'][number];

export type TermsDocument = InferResponseType<(typeof api.api.terms)[':slug']['$get'], 200>['data'];

export type ProductSort = 'newest' | 'popular' | 'price_asc' | 'price_desc' | 'title';

export interface ProductQuery {
  page?: number;
  perPage?: number;
  /** Free-text search across title and short description. */
  q?: string;
  /** Category **code**, not slug — that is what the API filters on. */
  category?: string;
  /** Pricing mode. What separates the rental catalogue from the sale one. */
  mode?: 'rental' | 'fixed';
  sort?: ProductSort;
  featured?: boolean;
}

/** The API's hard ceiling on `perPage`; asking for more is a validation error. */
export const MAX_PER_PAGE = 100;

export async function listProducts(
  query: ProductQuery = {},
  locale: SiteLocale = localeForRequest(),
): Promise<ProductListResponse> {
  const response = await api.api.products.$get({
    query: {
      locale,
      page: String(query.page ?? 1),
      perPage: String(query.perPage ?? 24),
      sort: query.sort ?? 'newest',
      ...(query.q ? { q: query.q } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.mode ? { mode: query.mode } : {}),
      ...(query.featured === undefined ? {} : { featured: query.featured ? 'true' : 'false' }),
    },
  });

  if (!response.ok) throw new Error(`GET /api/products failed (${response.status})`);
  return response.json();
}

/**
 * The whole catalogue, by walking the collection.
 *
 * `perPage` is capped at 100 by the API, so one oversized request would return
 * a silently short list. `maxPages` is a guard, not a limit to tune casually:
 * it throws rather than shipping a truncated catalogue.
 *
 * ⚠️ THE WALK IS ONLY AS STABLE AS THE SORT IT ASKS FOR. `sort=newest` orders by
 * `created_at` alone and the catalogue was seeded in bulk, so rows sharing a
 * timestamp can move between page 1 and page 2 — 107 products currently come
 * back as 101 unique plus 6 repeats. De-duplicating below stops the repeats
 * reaching a rail; the rows they displaced are still missing, and that needs an
 * id tiebreak in the server's `orderBy`. Every other sort walks cleanly.
 */
export async function listAllProducts(
  opts: { maxPages?: number; sort?: ProductSort } = {},
  locale: SiteLocale = localeForRequest(),
): Promise<{ items: ProductSummary[]; total: number }> {
  const { maxPages = 20, sort = 'newest' } = opts;

  const first = await listProducts({ page: 1, perPage: MAX_PER_PAGE, sort }, locale);
  const items = [...first.data];

  if (first.meta.pageCount > maxPages) {
    throw new Error(
      `Catalogue has ${first.meta.pageCount} pages, above the ${maxPages}-page guard. ` +
        'Raise maxPages deliberately rather than shipping a truncated catalogue.',
    );
  }

  for (let page = 2; page <= first.meta.pageCount; page += 1) {
    const next = await listProducts({ page, perPage: MAX_PER_PAGE, sort }, locale);
    items.push(...next.data);
  }

  const seen = new Set<string>();
  const unique = items.filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });

  return { items: unique, total: first.meta.total };
}

export async function listCategories(locale: SiteLocale = localeForRequest()): Promise<Category[]> {
  const response = await api.api.categories.$get({ query: { locale } });
  if (!response.ok) throw new Error(`GET /api/categories failed (${response.status})`);
  const { data } = await response.json();
  return data;
}

/** `null` when the product is missing or not published — render a 404. */
export async function getProductBySlug(
  slug: string,
  locale: SiteLocale = localeForRequest(),
): Promise<ProductDetail | null> {
  const response = await api.api.products[':slug'].$get({
    param: { slug },
    query: { locale },
  });
  if (!response.ok) return null;
  const { data } = await response.json();
  return data;
}

/** `null` when the legal document has not been published yet. */
export async function getTermsBySlug(
  slug: string,
  locale: SiteLocale = localeForRequest(),
): Promise<TermsDocument | null> {
  const response = await api.api.terms[':slug'].$get({
    param: { slug },
    query: { locale },
  });
  if (!response.ok) return null;
  const { data } = await response.json();
  return data;
}

/**
 * The last line under a read that a marketing page cannot fail on.
 *
 * `assistenza` is still prerendered, so this keeps a content deploy from
 * depending on database uptime. The home page renders on demand behind
 * `cached()`, which holds the last good catalogue across an outage — this only
 * catches the case that gets past it, a cold cache and an API that is down.
 * Either way the sections that need data hide themselves when the list comes
 * back empty, rather than 500 the page.
 */
export async function safely<T>(read: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await read();
  } catch (error) {
    console.warn(`[catalog] ${label} failed, rendering without it:`, error);
    return fallback;
  }
}
