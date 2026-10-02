import type { Database } from '@mia/db';
import { and, count, eq, inArray } from '@mia/db';
import type { LanguageCode } from '@mia/db/schema';
import {
  categories,
  categorySpecs,
  products,
  productSpecValueOptions,
  productSpecValues,
  productTranslations,
  SOURCE_LANGUAGE,
} from '@mia/db/schema';

import type {
  AdminSummaryRowData,
  ProductListFilters,
  PublicSummaryRowData,
  SpecDefinition,
  SpecValueData,
  SpecValueOptionLink,
  SummaryCategory,
} from '../types.ts';
import { listOrderBy, listWhere } from './list-query.ts';

/**
 * The listing's read model: one page of products, then only what its cards
 * print — the requested locale's and Italian's text, each category once, and
 * spec data only for the cards that fall back to spec tags. The walk-through is
 * docs/code/catalog-list-read-model.md.
 */

export interface SummaryPage<Row> {
  rows: Row[];
  total: number;
}

const SUMMARY_COLUMNS = {
  id: true,
  categoryId: true,
  status: true,
  brand: true,
  isFeatured: true,
  pricingMode: true,
  rentalUnit: true,
  currency: true,
  basePrice: true,
  marketingRate: true,
  stock: true,
  media: true,
  updatedAt: true,
} as const;

/** The requested locale, then Italian — once when they are the same. */
const languagesFor = (locale: LanguageCode): LanguageCode[] => [
  ...new Set([locale, SOURCE_LANGUAGE]),
];

const distinct = (values: string[]): string[] => [...new Set(values)];

function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const list = groups.get(key(row)) ?? [];
    list.push(row);
    groups.set(key(row), list);
  }
  return groups;
}

function pageWindow(filters: ProductListFilters) {
  return {
    where: listWhere(filters),
    orderBy: listOrderBy(filters),
    limit: filters.perPage,
    offset: (filters.page - 1) * filters.perPage,
  };
}

async function countMatches(db: Database, filters: ProductListFilters): Promise<number> {
  const totals = await db.select({ value: count() }).from(products).where(listWhere(filters));
  return totals[0]?.value ?? 0;
}

/** Each distinct category on the page, once, with its names in `languages`. */
async function findCategories(
  db: Database,
  categoryIds: string[],
  languages: LanguageCode[],
): Promise<Map<string, SummaryCategory>> {
  const rows = await db.query.categories.findMany({
    where: inArray(categories.id, categoryIds),
    columns: { id: true, code: true },
    with: {
      translations: {
        columns: { languageCode: true, name: true, slug: true },
        where: (t, { inArray: within }) => within(t.languageCode, languages),
      },
    },
  });
  return new Map(rows.map((row) => [row.id, row]));
}

interface CardSpecs {
  specsByCategory: Map<string, SpecDefinition[]>;
  valuesByProduct: Map<string, SpecValueData[]>;
  optionsByProduct: Map<string, SpecValueOptionLink[]>;
}

/**
 * Spec tags are the fallback for a product with no chips, and a tag shows a
 * comparable spec only — so that is all this loads, for those products only.
 */
async function findCardSpecs(
  db: Database,
  page: { id: string; categoryId: string; chips: unknown[] }[],
): Promise<CardSpecs> {
  const bare = page.filter((row) => row.chips.length === 0);
  const empty: CardSpecs = {
    specsByCategory: new Map(),
    valuesByProduct: new Map(),
    optionsByProduct: new Map(),
  };
  if (bare.length === 0) return empty;

  const specs = await db.query.categorySpecs.findMany({
    where: and(
      inArray(categorySpecs.categoryId, distinct(bare.map((row) => row.categoryId))),
      eq(categorySpecs.isComparable, true),
    ),
    columns: {
      id: true,
      categoryId: true,
      key: true,
      label: true,
      valueType: true,
      unit: true,
      isFilterable: true,
      isComparable: true,
      icon: true,
      position: true,
    },
    with: { options: { columns: { id: true, value: true, label: true } } },
  });
  if (specs.length === 0) return empty;

  const productIds = bare.map((row) => row.id);
  const specIds = specs.map((spec) => spec.id);
  const [values, links] = await Promise.all([
    db
      .select({
        productId: productSpecValues.productId,
        specId: productSpecValues.specId,
        numberValue: productSpecValues.numberValue,
        numberMin: productSpecValues.numberMin,
        numberMax: productSpecValues.numberMax,
        booleanValue: productSpecValues.booleanValue,
        textValue: productSpecValues.textValue,
      })
      .from(productSpecValues)
      .where(
        and(
          inArray(productSpecValues.productId, productIds),
          inArray(productSpecValues.specId, specIds),
        ),
      ),
    db
      .select({
        productId: productSpecValueOptions.productId,
        specId: productSpecValueOptions.specId,
        optionId: productSpecValueOptions.optionId,
      })
      .from(productSpecValueOptions)
      .where(
        and(
          inArray(productSpecValueOptions.productId, productIds),
          inArray(productSpecValueOptions.specId, specIds),
        ),
      ),
  ]);

  return {
    specsByCategory: groupBy(specs, (spec) => spec.categoryId),
    valuesByProduct: groupBy(values, (value) => value.productId),
    optionsByProduct: groupBy(links, (link) => link.productId),
  };
}

/** A category the page names is always found: `category_id` is a NOT NULL FK. */
function categoryOf(byId: Map<string, SummaryCategory>, id: string): SummaryCategory {
  const category = byId.get(id);
  if (!category) throw new Error(`Category ${id} vanished mid-listing.`);
  return category;
}

export async function findPublicSummaries(
  db: Database,
  filters: ProductListFilters,
): Promise<SummaryPage<PublicSummaryRowData>> {
  const [page, total] = await Promise.all([
    db.query.products.findMany({
      ...pageWindow(filters),
      columns: { ...SUMMARY_COLUMNS, rentalPackages: true, chips: true },
      // Codes only, every language: the card's `availableLocales`.
      with: { translations: { columns: { languageCode: true } } },
    }),
    countMatches(db, filters),
  ]);
  if (page.length === 0) return { rows: [], total };

  const languages = languagesFor(filters.locale);
  const [texts, categoriesById, cardSpecs] = await Promise.all([
    db
      .select({
        productId: productTranslations.productId,
        languageCode: productTranslations.languageCode,
        title: productTranslations.title,
        slug: productTranslations.slug,
        shortDescription: productTranslations.shortDescription,
      })
      .from(productTranslations)
      .where(
        and(
          inArray(
            productTranslations.productId,
            page.map((row) => row.id),
          ),
          inArray(productTranslations.languageCode, languages),
        ),
      ),
    findCategories(db, distinct(page.map((row) => row.categoryId)), languages),
    findCardSpecs(db, page),
  ]);
  const textsByProduct = groupBy(texts, (text) => text.productId);

  const rows = page.map(({ translations, ...row }) => ({
    ...row,
    availableLocales: translations.map((t) => t.languageCode),
    translations: textsByProduct.get(row.id) ?? [],
    category: categoryOf(categoriesById, row.categoryId),
    specs: cardSpecs.specsByCategory.get(row.categoryId) ?? [],
    specValues: cardSpecs.valuesByProduct.get(row.id) ?? [],
    specValueOptions: cardSpecs.optionsByProduct.get(row.id) ?? [],
  }));
  return { rows, total };
}

export async function findAdminSummaries(
  db: Database,
  filters: ProductListFilters,
): Promise<SummaryPage<AdminSummaryRowData>> {
  const [page, total] = await Promise.all([
    db.query.products.findMany({
      ...pageWindow(filters),
      columns: SUMMARY_COLUMNS,
      with: {
        translations: {
          columns: {
            languageCode: true,
            title: true,
            shortDescription: true,
            slug: true,
            metaTitle: true,
            metaDescription: true,
          },
          // Same NULL / '' / filled answer as the whole text, at one character.
          extras: (t, { sql }) => ({
            description: sql<string | null>`left(${t.description}, 1)`.as('description'),
          }),
        },
      },
    }),
    countMatches(db, filters),
  ]);
  if (page.length === 0) return { rows: [], total };

  const categoriesById = await findCategories(
    db,
    distinct(page.map((row) => row.categoryId)),
    languagesFor(filters.locale),
  );
  const rows = page.map((row) => ({
    ...row,
    category: categoryOf(categoriesById, row.categoryId),
  }));
  return { rows, total };
}
