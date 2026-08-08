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

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'title';

export interface ProductQuery {
  page?: number;
  perPage?: number;
  /** Free-text search across title and short description. */
  q?: string;
  /** Category **code**, not slug — that is what the API filters on. */
  category?: string;
  sort?: ProductSort;
  featured?: boolean;
}

/** The API's hard ceiling on `perPage`; asking for more is a validation error. */
export const MAX_PER_PAGE = 100;

export async function listProducts(query: ProductQuery = {}): Promise<ProductListResponse> {
  const response = await api.api.products.$get({
    query: {
      locale: 'it',
      page: String(query.page ?? 1),
      perPage: String(query.perPage ?? 24),
      sort: query.sort ?? 'newest',
      ...(query.q ? { q: query.q } : {}),
      ...(query.category ? { category: query.category } : {}),
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
 */
export async function listAllProducts(
  opts: { maxPages?: number; sort?: ProductSort } = {},
): Promise<{ items: ProductSummary[]; total: number }> {
  const { maxPages = 20, sort = 'newest' } = opts;

  const first = await listProducts({ page: 1, perPage: MAX_PER_PAGE, sort });
  const items = [...first.data];

  if (first.meta.pageCount > maxPages) {
    throw new Error(
      `Catalogue has ${first.meta.pageCount} pages, above the ${maxPages}-page guard. ` +
        'Raise maxPages deliberately rather than shipping a truncated catalogue.',
    );
  }

  for (let page = 2; page <= first.meta.pageCount; page += 1) {
    const next = await listProducts({ page, perPage: MAX_PER_PAGE, sort });
    items.push(...next.data);
  }

  return { items, total: first.meta.total };
}

export async function listCategories(): Promise<Category[]> {
  const response = await api.api.categories.$get({ query: { locale: 'it' } });
  if (!response.ok) throw new Error(`GET /api/categories failed (${response.status})`);
  const { data } = await response.json();
  return data;
}

/** `null` when the product is missing or not published — render a 404. */
export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const response = await api.api.products[':slug'].$get({
    param: { slug },
    query: { locale: 'it' },
  });
  if (!response.ok) return null;
  const { data } = await response.json();
  return data;
}

/** `null` when the legal document has not been published yet. */
export async function getTermsBySlug(slug: string): Promise<TermsDocument | null> {
  const response = await api.api.terms[':slug'].$get({
    param: { slug },
    query: { locale: 'it' },
  });
  if (!response.ok) return null;
  const { data } = await response.json();
  return data;
}

/**
 * Every read on a prerendered page goes through this.
 *
 * A marketing page must still build when the API or the database is down —
 * the sections that need data hide themselves when the list comes back empty.
 * Failing the whole build instead would make a content deploy depend on
 * database uptime.
 */
export async function safely<T>(read: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await read();
  } catch (error) {
    console.warn(`[catalog] ${label} failed, rendering without it:`, error);
    return fallback;
  }
}
