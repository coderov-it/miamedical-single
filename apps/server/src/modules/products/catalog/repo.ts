import type { Database } from '@mia/db';
import { and, asc, count, eq, sql } from '@mia/db';
import type {
  LanguageCode,
  Localized,
  ProductChip,
  ProductMedia,
  RentalPackage,
} from '@mia/db/schema';
import {
  categories,
  categorySpecOptions,
  categorySpecs,
  products,
  productSpecValueOptions,
  productSpecValues,
  productTranslations,
  searchVectorFor,
} from '@mia/db/schema';
import { startingPrice } from '@mia/pricing';
import { richTextToPlain } from '@mia/validators';

import type { ProductAggregate, ProductListFilters } from '../types.ts';
import { baseWhere } from './list-query.ts';

/** Data access only. No auth checks, no DTO shaping — see service.ts / mapper.ts. */

export interface TranslationData {
  title: string;
  shortDescription: string | null;
  description: string | null;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
}

export interface CreateProductData {
  categoryId: string;
  status: 'draft' | 'active' | 'archived';
  brand: string | null;
  pricingMode: 'fixed' | 'rental';
  basePrice: string | null;
  marketingRate: string | null;
  currency: string;
  rentalUnit: 'hour' | 'day' | null;
  /** Non-empty on a rental product; `[]` on a fixed one. Enforced by CHECK. */
  rentalPackages: RentalPackage[];
  stock: number;
  isFeatured: boolean;
  chips: ProductChip[];
  translations: Partial<Record<LanguageCode, TranslationData>>;
}

export interface UpdateProductData {
  categoryId?: string;
  status?: 'draft' | 'active' | 'archived';
  brand?: string | null;
  /** Fixed products only — the service rejects it on a rental. */
  basePrice?: string;
  /** Rental products only — the service rejects it on a fixed one. */
  marketingRate?: string | null;
  currency?: string;
  rentalUnit?: 'hour' | 'day';
  /** Replaces the whole list, and never with an empty one — see the CHECK. */
  rentalPackages?: RentalPackage[];
  /**
   * `startingPrice()` of the product as saved. The service sets it whenever
   * `basePrice` or `rentalPackages` is in the update — it holds the other half.
   */
  startingPrice?: string | null;
  stock?: number;
  isFeatured?: boolean;
  /** Replaces the whole list — `[]` clears the product's chips. */
  chips?: ProductChip[];
  media?: ProductMedia;
  translations?: Partial<Record<LanguageCode, TranslationData>>;
}

const AGGREGATE_WITH = {
  translations: true,
  category: { with: { translations: true, specs: { with: { options: true } } } },
  specValues: true,
  specValueOptions: true,
  addons: true,
  faqs: true,
  questions: { with: { options: true } },
  terms: { with: { terms: { with: { translations: true } } } },
} as const;

export async function findAggregate(
  db: Database,
  productId: string,
): Promise<ProductAggregate | undefined> {
  const row = await db.query.products.findFirst({
    where: eq(products.id, productId),
    with: AGGREGATE_WITH,
  });
  if (!row) return undefined;
  return { ...row, specs: row.category.specs } as unknown as ProductAggregate;
}

/**
 * `findAggregate` for several products in one query, keyed by id. An id with no
 * product is simply absent from the map; the caller decides what that means.
 */
export async function findAggregatesByIds(
  db: Database,
  productIds: readonly string[],
): Promise<Map<string, ProductAggregate>> {
  const found = new Map<string, ProductAggregate>();
  if (productIds.length === 0) return found;

  const rows = await db.query.products.findMany({
    where: (table, { inArray }) => inArray(table.id, [...productIds]),
    with: AGGREGATE_WITH,
  });
  for (const row of rows) {
    found.set(row.id, { ...row, specs: row.category.specs } as unknown as ProductAggregate);
  }
  return found;
}

/**
 * The product a storefront URL names, in the language it was asked for.
 *
 * Slugs are unique per language only, so two different products may share one
 * across languages — and a lookup by slug alone would pick whichever row came
 * back first. The exact pair wins; another language's slug is accepted only
 * when it belongs to ONE product (that is what lets the product page find its
 * alternate-language URLs, and a link pasted from another language still land):
 *
 *   ('en', 'wheelchair')  it: wheelchair → product B, en: wheelchair → product A  → A  (exact)
 *   ('it', 'sedia-x')     en: sedia-x → product A only                            → A  (unambiguous)
 *   ('fr', 'wheelchair')  it → product B, en → product A                          → none (ambiguous, 404)
 */
export async function findIdBySlug(
  db: Database,
  slug: string,
  languageCode: LanguageCode,
): Promise<{ productId: string; languageCode: LanguageCode } | undefined> {
  const rows = await db.query.productTranslations.findMany({
    where: eq(productTranslations.slug, slug),
    columns: { productId: true, languageCode: true },
  });

  const exact = rows.find((row) => row.languageCode === languageCode);
  if (exact) return exact;

  const productIds = new Set(rows.map((row) => row.productId));
  if (productIds.size !== 1) return undefined;
  return rows[0];
}

export async function existsBySlug(
  db: Database,
  languageCode: LanguageCode,
  slug: string,
  excludeProductId?: string,
): Promise<boolean> {
  const row = await db.query.productTranslations.findFirst({
    where: and(
      eq(productTranslations.languageCode, languageCode),
      eq(productTranslations.slug, slug),
    ),
    columns: { productId: true },
  });
  return row !== undefined && row.productId !== excludeProductId;
}

export async function findCategoryIdByCode(
  db: Database,
  code: string,
): Promise<string | undefined> {
  const row = await db.query.categories.findFirst({
    where: eq(categories.code, code),
    columns: { id: true },
  });
  return row?.id;
}

// --- list -------------------------------------------------------------------
// The WHERE / ORDER BY live in list-query.ts, the page loaders in summary-repo.ts.

// --- facets -----------------------------------------------------------------

export interface SelectFacetCountRow {
  specKey: string;
  specLabel: Localized;
  valueType: string;
  optionValue: string;
  optionLabel: Localized;
  count: number;
}

export interface NumberFacetRow {
  specKey: string;
  specLabel: Localized;
  valueType: string;
  unit: string | null;
  min: string | null;
  max: string | null;
}

/**
 * Facets are computed against the base match set (status, category, q) —
 * deliberately ignoring the current spec selections, so a selected facet
 * still shows its alternatives' counts.
 */
export async function facetCounts(
  db: Database,
  filters: ProductListFilters,
): Promise<{ selects: SelectFacetCountRow[]; numbers: NumberFacetRow[] }> {
  if (!filters.categoryId) return { selects: [], numbers: [] };
  const clauses = baseWhere(filters);
  const where = clauses.length > 0 ? and(...clauses) : undefined;

  const [selects, numbers] = await Promise.all([
    db
      .select({
        specKey: categorySpecs.key,
        specLabel: categorySpecs.label,
        valueType: sql<string>`${categorySpecs.valueType}`,
        optionValue: categorySpecOptions.value,
        optionLabel: categorySpecOptions.label,
        count: count(sql`DISTINCT ${products.id}`),
      })
      .from(productSpecValueOptions)
      .innerJoin(products, eq(products.id, productSpecValueOptions.productId))
      .innerJoin(categorySpecs, eq(categorySpecs.id, productSpecValueOptions.specId))
      .innerJoin(categorySpecOptions, eq(categorySpecOptions.id, productSpecValueOptions.optionId))
      .where(and(eq(categorySpecs.isFilterable, true), where))
      .groupBy(
        categorySpecs.key,
        categorySpecs.label,
        categorySpecs.valueType,
        categorySpecs.position,
        categorySpecOptions.value,
        categorySpecOptions.label,
        categorySpecOptions.position,
      )
      .orderBy(asc(categorySpecs.position), asc(categorySpecOptions.position)),
    db
      .select({
        specKey: categorySpecs.key,
        specLabel: categorySpecs.label,
        valueType: sql<string>`${categorySpecs.valueType}`,
        unit: categorySpecs.unit,
        min: sql<
          string | null
        >`min(COALESCE(${productSpecValues.numberValue}, ${productSpecValues.numberMin}))`,
        max: sql<
          string | null
        >`max(COALESCE(${productSpecValues.numberValue}, ${productSpecValues.numberMax}))`,
      })
      .from(productSpecValues)
      .innerJoin(products, eq(products.id, productSpecValues.productId))
      .innerJoin(categorySpecs, eq(categorySpecs.id, productSpecValues.specId))
      .where(
        and(
          eq(categorySpecs.isFilterable, true),
          sql`${categorySpecs.valueType} IN ('number', 'number_range')`,
          where,
        ),
      )
      .groupBy(
        categorySpecs.key,
        categorySpecs.label,
        categorySpecs.valueType,
        categorySpecs.unit,
        categorySpecs.position,
      )
      .orderBy(asc(categorySpecs.position)),
  ]);

  return {
    selects: selects as SelectFacetCountRow[],
    numbers: numbers as NumberFacetRow[],
  };
}

// --- writes -----------------------------------------------------------------

function translationInsert(productId: string, languageCode: LanguageCode, data: TranslationData) {
  return {
    productId,
    languageCode,
    title: data.title,
    shortDescription: data.shortDescription,
    description: data.description,
    slug: data.slug,
    metaTitle: data.metaTitle,
    metaDescription: data.metaDescription,
    // Not a generated column — see packages/db/src/schema/search.ts for why.
    // `description` is rich text: index the words, never the markup.
    searchVector: searchVectorFor(
      languageCode,
      data.title,
      [data.shortDescription, richTextToPlain(data.description)].filter(Boolean).join(' ') || null,
    ) as unknown as string,
  };
}

export async function create(db: Database, data: CreateProductData): Promise<string> {
  return db.transaction(async (tx) => {
    const [product] = await tx
      .insert(products)
      .values({
        categoryId: data.categoryId,
        status: data.status,
        brand: data.brand,
        pricingMode: data.pricingMode,
        basePrice: data.basePrice,
        marketingRate: data.marketingRate,
        currency: data.currency,
        rentalUnit: data.rentalUnit,
        rentalPackages: data.rentalPackages,
        startingPrice: startingPrice(data.basePrice, data.rentalPackages),
        stock: data.stock,
        isFeatured: data.isFeatured,
        chips: data.chips,
      })
      .returning({ id: products.id });
    if (!product) throw new Error('Product insert returned no row.');

    for (const [lang, translation] of Object.entries(data.translations)) {
      if (!translation) continue;
      await tx
        .insert(productTranslations)
        .values(translationInsert(product.id, lang as LanguageCode, translation));
    }
    return product.id;
  });
}

/** `pricingMode` is never in the SET list — write-once by construction. */
export async function update(db: Database, id: string, data: UpdateProductData): Promise<void> {
  await db.transaction(async (tx) => {
    const { translations, ...columns } = data;
    if (Object.keys(columns).length > 0) {
      await tx.update(products).set(columns).where(eq(products.id, id));
    } else {
      // Touch updatedAt even for translation-only saves.
      await tx.update(products).set({ updatedAt: new Date() }).where(eq(products.id, id));
    }

    for (const [lang, translation] of Object.entries(translations ?? {})) {
      if (!translation) continue;
      const values = translationInsert(id, lang as LanguageCode, translation);
      await tx
        .insert(productTranslations)
        .values(values)
        .onConflictDoUpdate({
          target: [productTranslations.productId, productTranslations.languageCode],
          set: {
            title: values.title,
            shortDescription: values.shortDescription,
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
  await db.delete(products).where(eq(products.id, id));
}

export async function findRow(db: Database, id: string) {
  return db.query.products.findFirst({ where: eq(products.id, id) });
}
