import type { Database } from '@mia/db';
import { and, asc, count, desc, eq, sql } from '@mia/db';
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
  productSpecValueOptions,
  productSpecValues,
  productTranslations,
  products,
  searchQueryFor,
  searchVectorFor,
} from '@mia/db/schema';

import { richTextToPlain } from '../../../shared/html/rich-text.ts';
import type {
  ProductAggregate,
  ProductListFilters,
  ProductSummaryRowData,
  SpecFilter,
} from '../types.ts';

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
  baseSku: string;
  categoryId: string;
  status: 'draft' | 'active' | 'archived';
  brand: string | null;
  pricingMode: 'fixed' | 'rental';
  basePrice: string;
  currency: string;
  rentalUnit: 'hour' | 'day' | null;
  isFeatured: boolean;
  chips: ProductChip[];
  translations: Partial<Record<LanguageCode, TranslationData>>;
}

export interface UpdateProductData {
  baseSku?: string;
  categoryId?: string;
  status?: 'draft' | 'active' | 'archived';
  brand?: string | null;
  basePrice?: string;
  currency?: string;
  rentalUnit?: 'hour' | 'day';
  /** Replaces the whole list — the service rejects a non-empty one on `fixed`. */
  rentalPackages?: RentalPackage[];
  isFeatured?: boolean;
  /** Replaces the whole list — `[]` clears the product's chips. */
  chips?: ProductChip[];
  media?: ProductMedia;
  translations?: Partial<Record<LanguageCode, TranslationData>>;
}

const AGGREGATE_WITH = {
  translations: true,
  category: { with: { translations: true, specs: { with: { options: true } } } },
  variantGroups: { with: { options: true } },
  skus: { with: { options: true } },
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

/** Slug lookup across all languages — enables the 301 when locales are mixed. */
export async function findIdBySlug(
  db: Database,
  slug: string,
): Promise<{ productId: string; languageCode: LanguageCode } | undefined> {
  const row = await db.query.productTranslations.findFirst({
    where: eq(productTranslations.slug, slug),
    columns: { productId: true, languageCode: true },
  });
  return row;
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

export async function existsByBaseSku(
  db: Database,
  baseSku: string,
  excludeProductId?: string,
): Promise<boolean> {
  const row = await db.query.products.findFirst({
    where: eq(products.baseSku, baseSku),
    columns: { id: true },
  });
  return row !== undefined && row.id !== excludeProductId;
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
      AND pt.language_code IN (${locale}, 'it')
      AND pt.search_vector @@ ${searchQueryFor(locale, q)}
  )`;
}

/** Everything except the spec filters — the facet queries reuse this. */
function baseWhere(filters: ProductListFilters) {
  const clauses = [
    filters.includeNonActive
      ? filters.status
        ? eq(products.status, filters.status)
        : undefined
      : eq(products.status, 'active'),
    filters.categoryId ? eq(products.categoryId, filters.categoryId) : undefined,
    filters.featured === undefined ? undefined : eq(products.isFeatured, filters.featured),
    filters.q ? searchClause(filters.locale, filters.q) : undefined,
  ].filter((clause) => clause !== undefined);
  return clauses;
}

function orderBy(filters: ProductListFilters) {
  switch (filters.sort) {
    case 'price_asc':
      return asc(products.basePrice);
    case 'price_desc':
      return desc(products.basePrice);
    case 'title':
      return sql`(
        SELECT pt.title FROM ${productTranslations} pt
        WHERE pt.product_id = ${products.id} AND pt.language_code = 'it'
      ) ASC`;
    default:
      return desc(products.createdAt);
  }
}

export async function findMany(
  db: Database,
  filters: ProductListFilters,
): Promise<{ rows: ProductSummaryRowData[]; total: number }> {
  const clauses = [...baseWhere(filters), ...filters.specFilters.map(specFilterClause)];
  const where = clauses.length > 0 ? and(...clauses) : undefined;

  const [rows, totals] = await Promise.all([
    db.query.products.findMany({
      where,
      orderBy: orderBy(filters),
      limit: filters.perPage,
      offset: (filters.page - 1) * filters.perPage,
      with: {
        translations: true,
        category: { with: { translations: true, specs: { with: { options: true } } } },
        skus: { columns: { stock: true, isActive: true } },
        specValues: true,
        specValueOptions: true,
      },
    }),
    db.select({ value: count() }).from(products).where(where),
  ]);

  return {
    rows: rows.map((row) => ({
      ...row,
      specs: row.category.specs,
      // No SKU matrix → stock is untracked → sellable.
      inStock: row.skus.length === 0 || row.skus.some((sku) => sku.isActive && sku.stock > 0),
    })) as unknown as ProductSummaryRowData[],
    total: totals[0]?.value ?? 0,
  };
}

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
        baseSku: data.baseSku,
        categoryId: data.categoryId,
        status: data.status,
        brand: data.brand,
        pricingMode: data.pricingMode,
        basePrice: data.basePrice,
        currency: data.currency,
        rentalUnit: data.rentalUnit,
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
