import type { Database } from '@mia/db';
import { and, asc, count, desc, eq, ilike, or } from '@mia/db';
import { productImages, productVariants, products } from '@mia/db/schema';

import type {
  ProductListFilters,
  ProductSummaryRow,
  ProductWithRelations,
  VariantRow,
} from './types.ts';

/** Data access only. No auth checks, no DTO shaping — see service.ts / mapper.ts. */

function whereFor(filters: ProductListFilters) {
  const clauses = [
    filters.includeNonActive
      ? filters.status
        ? eq(products.status, filters.status)
        : undefined
      : eq(products.status, 'active'),
    filters.q
      ? or(ilike(products.name, `%${filters.q}%`), ilike(products.brand, `%${filters.q}%`))
      : undefined,
  ].filter((clause) => clause !== undefined);

  return clauses.length > 0 ? and(...clauses) : undefined;
}

const ORDER_BY = {
  newest: desc(products.createdAt),
  name: asc(products.name),
  // Price ordering needs a variant join; ordered in the service for now.
  price_asc: asc(products.createdAt),
  price_desc: desc(products.createdAt),
} as const;

export async function findMany(
  db: Database,
  filters: ProductListFilters,
): Promise<{ rows: ProductSummaryRow[]; total: number }> {
  const where = whereFor(filters);

  const [rows, totals] = await Promise.all([
    db.query.products.findMany({
      where,
      orderBy: ORDER_BY[filters.sort],
      limit: filters.perPage,
      offset: (filters.page - 1) * filters.perPage,
      with: {
        variants: { orderBy: desc(productVariants.isDefault) },
        images: { orderBy: asc(productImages.position), limit: 1 },
      },
    }),
    db.select({ value: count() }).from(products).where(where),
  ]);

  return { rows, total: totals[0]?.value ?? 0 };
}

export async function findBySlug(
  db: Database,
  slug: string,
): Promise<ProductWithRelations | undefined> {
  return db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: {
      variants: { orderBy: desc(productVariants.isDefault) },
      images: { orderBy: asc(productImages.position) },
      categories: { with: { category: true } },
    },
  });
}

export async function existsBySlug(db: Database, slug: string): Promise<boolean> {
  const row = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    columns: { id: true },
  });
  return row !== undefined;
}

export interface CreateProductData {
  slug: string;
  name: string;
  description: string | null;
  status: 'draft' | 'active' | 'archived';
  brand: string | null;
  metadata: Record<string, unknown>;
  variants: Array<Omit<typeof productVariants.$inferInsert, 'productId'>>;
}

export async function create(db: Database, data: CreateProductData): Promise<ProductWithRelations> {
  return db.transaction(async (tx) => {
    const [product] = await tx
      .insert(products)
      .values({
        slug: data.slug,
        name: data.name,
        description: data.description,
        status: data.status,
        brand: data.brand,
        metadata: data.metadata,
      })
      .returning();

    if (!product) throw new Error('Product insert returned no row.');

    const variants: VariantRow[] = await tx
      .insert(productVariants)
      .values(data.variants.map((variant) => ({ ...variant, productId: product.id })))
      .returning();

    return { ...product, variants, images: [], categories: [] };
  });
}
