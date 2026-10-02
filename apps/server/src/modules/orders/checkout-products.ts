/**
 * The catalogue products behind a checkout's lines, as the storefront saw them —
 * in two queries whatever the line count: the slugs of the lines that sent no id,
 * then every distinct product at once. Walked through in
 * `docs/code/orders-placement.md`.
 */

import type { Database } from '@mia/db';
import { inArray } from '@mia/db';
import { productTranslations, SOURCE_LANGUAGE } from '@mia/db/schema';
import type { PlaceOrderInput } from '@mia/validators';

import { httpError } from '../../shared/http/errors.ts';
import { findAggregatesByIds } from '../products/catalog/repo.ts';
import type { PublicProductDetailDto } from '../products/dto.ts';
import { toPublicDetail } from '../products/mapper.ts';
import { lineProductIds, type SlugRow, slugsToResolve } from './line-products.ts';

async function findSlugRows(db: Database, slugs: string[]): Promise<SlugRow[]> {
  if (slugs.length === 0) return [];
  return db
    .select({
      slug: productTranslations.slug,
      productId: productTranslations.productId,
      languageCode: productTranslations.languageCode,
    })
    .from(productTranslations)
    .where(inArray(productTranslations.slug, slugs));
}

/**
 * One entry per line, index for index: the product projected for checkout, or
 * `undefined` when the line names nothing that can still be sold.
 *
 * By id when the storefront sent one — the product the page rendered, whatever
 * language its slug was in. Otherwise by slug, in Italian first: the checkout page
 * resolves its lines in the source language, and another language's slug is
 * accepted only when it belongs to one product (`pickSlugMatch`).
 *
 * The labels are always projected in Italian — the SAME projection the checkout
 * page priced from, which is what lets `resolveLine` freeze the very labels the
 * customer read. A product on two lines is loaded and projected once.
 *
 * Nothing is rejected here. The caller walks the lines in order, so the first bad
 * line is still the one the 422 names.
 */
export async function loadLineProducts(
  db: Database,
  items: PlaceOrderInput['items'],
): Promise<(PublicProductDetailDto | undefined)[]> {
  const slugRows = await findSlugRows(db, slugsToResolve(items));
  const ids = lineProductIds(items, slugRows, SOURCE_LANGUAGE);

  const distinctIds = [...new Set(ids.filter((id) => id !== undefined))];
  const aggregates = await findAggregatesByIds(db, distinctIds);

  const details = new Map<string, PublicProductDetailDto>();
  for (const [id, product] of aggregates) {
    if (product.status === 'active') details.set(id, toPublicDetail(product, SOURCE_LANGUAGE));
  }

  return ids.map((id) => (id === undefined ? undefined : details.get(id)));
}

/**
 * The line's product, or the 422 that names the line. A product since unpublished
 * is a 422, not a 404: the request is well-formed, one thing in it can no longer
 * be honoured, and the checkout has to be able to say which.
 */
export function availableProduct(
  product: PublicProductDetailDto | undefined,
  field: string,
): PublicProductDetailDto {
  if (product) return product;
  throw httpError(422, 'That product is no longer available.', 'unprocessable_entity', {
    fields: { [`${field}.productSlug`]: 'That product is no longer available.' },
  });
}
