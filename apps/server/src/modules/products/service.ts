import type { Database } from '@mia/db';
import type { CreateProductInput, ProductQuery } from '@mia/validators';

import type { SessionUser } from '../../shared/http/context.ts';
import { conflict, notFound } from '../../shared/http/errors.ts';
import * as repo from './repo.ts';
import type { ProductSummaryRow, ProductWithRelations } from './types.ts';

/**
 * Business orchestration. Owns visibility policy and invariants; returns plain
 * records so it stays transport-agnostic — routes.ts applies the mapper.
 */

/** Staff and admins may see drafts and archived products; the public may not. */
const canSeeHidden = (user: SessionUser | null): boolean =>
  user?.role === 'admin' || user?.role === 'staff';

export async function list(
  db: Database,
  query: ProductQuery,
  user: SessionUser | null,
): Promise<{ rows: ProductSummaryRow[]; total: number }> {
  return repo.findMany(db, {
    page: query.page,
    perPage: query.perPage,
    q: query.q,
    status: query.status,
    sort: query.sort,
    includeNonActive: canSeeHidden(user),
  });
}

export async function getBySlug(
  db: Database,
  slug: string,
  user: SessionUser | null,
): Promise<ProductWithRelations> {
  const product = await repo.findBySlug(db, slug);

  if (!product || (product.status !== 'active' && !canSeeHidden(user))) {
    // Deliberately a 404, not a 403 — a hidden product's existence is not public.
    throw notFound('Product');
  }

  return product;
}

export async function create(
  db: Database,
  input: CreateProductInput,
): Promise<ProductWithRelations> {
  if (await repo.existsBySlug(db, input.slug)) {
    throw conflict(`A product with slug "${input.slug}" already exists.`);
  }

  return repo.create(db, {
    slug: input.slug,
    name: input.name,
    description: input.description ?? null,
    status: input.status,
    brand: input.brand ?? null,
    metadata: input.metadata,
    variants: input.variants.map((variant) => ({
      sku: variant.sku,
      name: variant.name,
      priceCents: variant.priceCents,
      compareAtPriceCents: variant.compareAtPriceCents ?? null,
      currency: variant.currency,
      stock: variant.stock,
      weightGrams: variant.weightGrams ?? null,
      options: variant.options,
      isDefault: variant.isDefault,
    })),
  });
}
