import { and, asc, desc, eq, sql } from '@mia/db';
import type { LanguageCode } from '@mia/db/schema';
import {
  categorySpecOptions,
  categorySpecs,
  products,
  productSpecValueOptions,
  productSpecValues,
  productTranslations,
  searchQueryFor,
  SOURCE_LANGUAGE,
} from '@mia/db/schema';

import type { ProductListFilters, SpecFilter } from '../types.ts';

/**
 * The WHERE and ORDER BY of a catalogue listing — SQL fragments only, no IO.
 * The page loaders (summary-repo.ts) and the facet counts (repo.ts) share them,
 * so a filter means the same thing in the grid and in its sidebar.
 */

/** One EXISTS fragment per spec filter — all index-backed. */
function specFilterClause(filter: SpecFilter) {
  if (filter.values && filter.values.length > 0) {
    return sql`EXISTS (
      SELECT 1 FROM ${productSpecValueOptions} pso
      JOIN ${categorySpecOptions} cso ON cso.id = pso.option_id
      JOIN ${categorySpecs} cs ON cs.id = pso.spec_id
      WHERE pso.product_id = ${products.id}
        AND cs.key = ${filter.key} AND cs.is_filterable = true
        AND cso.value IN ${filter.values}
    )`;
  }
  if (filter.boolean !== undefined) {
    return sql`EXISTS (
      SELECT 1 FROM ${productSpecValues} psv
      JOIN ${categorySpecs} cs ON cs.id = psv.spec_id
      WHERE psv.product_id = ${products.id}
        AND cs.key = ${filter.key} AND cs.is_filterable = true
        AND psv.boolean_value = ${filter.boolean}
    )`;
  }
  const min = filter.min ?? -1e12;
  const max = filter.max ?? 1e12;
  return sql`EXISTS (
    SELECT 1 FROM ${productSpecValues} psv
    JOIN ${categorySpecs} cs ON cs.id = psv.spec_id
    WHERE psv.product_id = ${products.id}
      AND cs.key = ${filter.key} AND cs.is_filterable = true
      AND COALESCE(psv.number_value, psv.number_max) >= ${min}
      AND COALESCE(psv.number_value, psv.number_min) <= ${max}
  )`;
}

function searchClause(locale: LanguageCode, q: string) {
  return sql`EXISTS (
    SELECT 1 FROM ${productTranslations} pt
    WHERE pt.product_id = ${products.id}
      AND pt.language_code IN (${locale}, ${SOURCE_LANGUAGE})
      AND pt.search_vector @@ ${searchQueryFor(locale, q)}
  )`;
}

/** The public sees active rows only; the back office sees what it asked for. */
function statusClause(filters: ProductListFilters) {
  if (!filters.includeNonActive) return eq(products.status, 'active');
  if (!filters.status) return undefined;
  return eq(products.status, filters.status);
}

/** Everything except the spec filters — the facet queries reuse this. */
export function baseWhere(filters: ProductListFilters) {
  const clauses = [
    statusClause(filters),
    filters.categoryId ? eq(products.categoryId, filters.categoryId) : undefined,
    filters.mode ? eq(products.pricingMode, filters.mode) : undefined,
    filters.featured === undefined ? undefined : eq(products.isFeatured, filters.featured),
    filters.q ? searchClause(filters.locale, filters.q) : undefined,
  ].filter((clause) => clause !== undefined);
  return clauses;
}

/** The listing's whole match set: the base filters plus every spec filter. */
export function listWhere(filters: ProductListFilters) {
  const clauses = [...baseWhere(filters), ...filters.specFilters.map(specFilterClause)];
  return clauses.length > 0 ? and(...clauses) : undefined;
}

/**
 * The shop rents first and sells second, so a listing that mixes both modes
 * leads with the rentals (owner, 2026-09-10).
 *
 * It is the PRIMARY key of every sort rather than a sort of its own: "cheapest
 * first" means the cheapest rental, then the cheapest sale item. A listing
 * already filtered to one mode has nothing to group, which is what turns it off
 * — see `rentalFirst` in the service.
 */
const rentalFirst = sql`(${products.pricingMode} = 'rental') DESC`;

function sortKeys(sort: ProductListFilters['sort']) {
  switch (sort) {
    /**
     * Demand first, then the newest — without the tiebreak a catalogue whose
     * orders have not started yet is one big zero bucket in whatever order the
     * heap hands back, and the page shuffles between requests.
     */
    case 'popular':
      return [desc(products.orderCount), desc(products.createdAt)];
    /**
     * "Price" across both modes: a fixed product's own rate, or a rental's
     * cheapest package — `starting_price`, written on save so the sort reads an
     * indexed column instead of opening `rental_packages` on every row.
     */
    case 'price_asc':
      return [asc(products.startingPrice)];
    case 'price_desc':
      return [desc(products.startingPrice)];
    case 'title':
      return [
        sql`(
        SELECT pt.title FROM ${productTranslations} pt
        WHERE pt.product_id = ${products.id} AND pt.language_code = ${SOURCE_LANGUAGE}
      ) ASC`,
      ];
    default:
      return [desc(products.createdAt)];
  }
}

/**
 * `id` closes every sort, because a listing is read one page at a time and
 * LIMIT/OFFSET over a tied ORDER BY is free to hand the same row back on page 2
 * and drop another. The catalogue was seeded in bulk, so `created_at` ties are
 * the normal case, not the edge one.
 */
export function listOrderBy(filters: ProductListFilters) {
  return [
    ...(filters.rentalFirst ? [rentalFirst] : []),
    ...sortKeys(filters.sort),
    asc(products.id),
  ];
}
