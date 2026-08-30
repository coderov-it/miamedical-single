import type { Database } from '@mia/db';
import { and, asc, count, eq, sql } from '@mia/db';
import type { LanguageCode } from '@mia/db/schema';
import {
  categories,
  categorySpecOptions,
  categorySpecs,
  categoryTranslations,
  products,
  searchVectorFor,
} from '@mia/db/schema';

import type { CategoryAggregate } from './types.ts';

export interface CategoryTranslationData {
  name: string;
  description: string | null;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
}

const AGGREGATE_WITH = {
  translations: true,
  specs: { with: { options: true } },
} as const;

export async function findAll(db: Database, activeOnly: boolean): Promise<CategoryAggregate[]> {
  const rows = await db.query.categories.findMany({
    where: activeOnly ? eq(categories.isActive, true) : undefined,
    orderBy: asc(categories.position),
    with: AGGREGATE_WITH,
  });
  return rows as CategoryAggregate[];
}

// --- storefront summaries ---------------------------------------------------

/**
 * The headline figure a product advertises: a rental's promo rate when the back
 * office typed one, otherwise its cheapest package; a sale product's own price.
 *
 * Deliberately the same expression the product card prints, so a category tile
 * reading "da 0,78 €" and the cheapest card inside that category can never
 * disagree. NULL only for a product carrying no figure at all.
 */
const headlinePrice = sql`CASE WHEN ${products.pricingMode} = 'rental'
  THEN COALESCE(
    ${products.marketingRate},
    (SELECT MIN((entry->>'price')::numeric)
       FROM jsonb_array_elements(${products.rentalPackages}) AS entry)
  )
  ELSE ${products.basePrice} END`;

export interface CategorySummaryRow {
  categoryId: string;
  productCount: number;
  /** Cheapest headline figure in the category, or NULL when nothing is priced. */
  fromPrice: string | null;
  currency: string | null;
  /** Which mode that cheapest figure belongs to — decides whether it takes a unit. */
  pricingMode: 'fixed' | 'rental' | null;
  rentalUnit: 'hour' | 'day' | null;
}

/**
 * One row per category that has at least one active product: how many, and what
 * the cheapest one costs.
 *
 * Two queries rather than one, because the count is over every active product
 * while the price comes from a single winning row — a DISTINCT ON with a COUNT
 * beside it would count the winner, not the category.
 */
export async function summarise(db: Database): Promise<CategorySummaryRow[]> {
  const active = eq(products.status, 'active');

  const [counts, cheapest] = await Promise.all([
    db
      .select({ categoryId: products.categoryId, total: count() })
      .from(products)
      .where(active)
      .groupBy(products.categoryId),
    db
      .selectDistinctOn([products.categoryId], {
        categoryId: products.categoryId,
        fromPrice: sql<string>`${headlinePrice}`,
        currency: products.currency,
        pricingMode: products.pricingMode,
        rentalUnit: products.rentalUnit,
      })
      .from(products)
      .where(and(active, sql`${headlinePrice} IS NOT NULL`))
      .orderBy(asc(products.categoryId), asc(sql`${headlinePrice}`)),
  ]);

  const priced = new Map(cheapest.map((row) => [row.categoryId, row]));

  return counts.map((row) => {
    const price = priced.get(row.categoryId);
    return {
      categoryId: row.categoryId,
      productCount: row.total,
      fromPrice: price?.fromPrice ?? null,
      currency: price?.currency ?? null,
      pricingMode: price?.pricingMode ?? null,
      rentalUnit: price?.rentalUnit ?? null,
    };
  });
}

export async function findById(db: Database, id: string): Promise<CategoryAggregate | undefined> {
  const row = await db.query.categories.findFirst({
    where: eq(categories.id, id),
    with: AGGREGATE_WITH,
  });
  return row as CategoryAggregate | undefined;
}

export async function existsByCode(
  db: Database,
  code: string,
  excludeId?: string,
): Promise<boolean> {
  const row = await db.query.categories.findFirst({
    where: eq(categories.code, code),
    columns: { id: true },
  });
  return row !== undefined && row.id !== excludeId;
}

export async function hasProducts(db: Database, categoryId: string): Promise<boolean> {
  const row = await db.query.products.findFirst({
    where: eq(products.categoryId, categoryId),
    columns: { id: true },
  });
  return row !== undefined;
}

function translationInsert(
  categoryId: string,
  languageCode: LanguageCode,
  data: CategoryTranslationData,
) {
  return {
    categoryId,
    languageCode,
    name: data.name,
    description: data.description,
    slug: data.slug,
    metaTitle: data.metaTitle,
    metaDescription: data.metaDescription,
    searchVector: searchVectorFor(languageCode, data.name, data.description) as unknown as string,
  };
}

export interface CategoryData {
  code?: string;
  icon?: string | null;
  position?: number;
  isActive?: boolean;
  requiresDeposit?: boolean;
  translations?: Partial<Record<LanguageCode, CategoryTranslationData>>;
}

export async function create(
  db: Database,
  data: Required<Pick<CategoryData, 'code'>> & CategoryData,
): Promise<string> {
  return db.transaction(async (tx) => {
    const [category] = await tx
      .insert(categories)
      .values({
        code: data.code,
        icon: data.icon ?? null,
        position: data.position ?? 0,
        isActive: data.isActive ?? true,
        requiresDeposit: data.requiresDeposit ?? false,
      })
      .returning({ id: categories.id });
    if (!category) throw new Error('Category insert returned no row.');

    for (const [lang, translation] of Object.entries(data.translations ?? {})) {
      if (!translation) continue;
      await tx
        .insert(categoryTranslations)
        .values(translationInsert(category.id, lang as LanguageCode, translation));
    }
    return category.id;
  });
}

export async function update(db: Database, id: string, data: CategoryData): Promise<void> {
  await db.transaction(async (tx) => {
    const { translations, ...columns } = data;
    if (Object.keys(columns).length > 0) {
      await tx.update(categories).set(columns).where(eq(categories.id, id));
    } else {
      await tx.update(categories).set({ updatedAt: new Date() }).where(eq(categories.id, id));
    }
    for (const [lang, translation] of Object.entries(translations ?? {})) {
      if (!translation) continue;
      const values = translationInsert(id, lang as LanguageCode, translation);
      await tx
        .insert(categoryTranslations)
        .values(values)
        .onConflictDoUpdate({
          target: [categoryTranslations.categoryId, categoryTranslations.languageCode],
          set: {
            name: values.name,
            description: values.description,
            slug: values.slug,
            metaTitle: values.metaTitle,
            metaDescription: values.metaDescription,
            searchVector: values.searchVector,
          },
        });
    }
  });
}

export async function remove(db: Database, id: string): Promise<void> {
  await db.delete(categories).where(eq(categories.id, id));
}

export { categorySpecOptions, categorySpecs };
