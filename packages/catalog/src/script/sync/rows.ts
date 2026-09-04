/**
 * Categories, their specs, and the products themselves, in dependency order.
 * The detail rows a product owns — spec values, add-ons, FAQs, questions — are
 * next door in `rows-details.ts`.
 *
 * Every write is an upsert on a derived id, so a second run updates what it
 * wrote the first time. Where a data file declares a LIST, the list is
 * reconciled: rows it no longer contains are deleted. That is what makes the
 * TypeScript the source of truth rather than an append-only feed — deleting a
 * spec from a file has to delete it from the catalogue, or the two drift apart
 * with no way back.
 *
 * The one thing never deleted here is a product or a category: an order line
 * points at a product, so removing one is a decision for a person, and the run
 * reports them (see `conflicts.ts`) instead.
 */
import type { AnyPgColumn, Database, PgTable, SQL } from '@mia/db';
import { and, eq, notInArray } from '@mia/db';
import type { LanguageCode } from '@mia/db/schema';
import {
  categories,
  categorySpecOptions,
  categorySpecs,
  categoryTranslations,
  productTranslations,
  products,
  searchVectorFor,
} from '@mia/db/schema';
import { richTextToPlain, sanitizeRichText } from '@mia/validators';

import type {
  CatalogPlan,
  PlannedCategory,
  PlannedProduct,
  PlannedTranslation,
} from './planned.ts';

export interface WriteCounts {
  categories: number;
  categoryTranslations: number;
  specs: number;
  specOptions: number;
  products: number;
  productTranslations: number;
  deletedSpecs: number;
  deletedSpecOptions: number;
}

export async function writeCategories(db: Database, plan: CatalogPlan): Promise<WriteCounts> {
  const counts: WriteCounts = {
    categories: 0,
    categoryTranslations: 0,
    specs: 0,
    specOptions: 0,
    products: 0,
    productTranslations: 0,
    deletedSpecs: 0,
    deletedSpecOptions: 0,
  };

  for (const category of plan.categories) {
    await upsertCategory(db, category);
    counts.categories += 1;
    counts.categoryTranslations += await writeCategoryTranslations(db, category);
    const specCounts = await writeSpecs(db, category);
    counts.specs += specCounts.specs;
    counts.specOptions += specCounts.options;
    counts.deletedSpecs += specCounts.deletedSpecs;
    counts.deletedSpecOptions += specCounts.deletedOptions;
  }

  for (const product of plan.products) {
    await upsertProduct(db, product);
    counts.products += 1;
    counts.productTranslations += await writeProductTranslations(db, product);
  }

  return counts;
}

async function upsertCategory(db: Database, category: PlannedCategory): Promise<void> {
  await db
    .insert(categories)
    .values({
      id: category.id,
      code: category.code,
      position: category.position,
      isActive: category.isActive,
      requiresDeposit: category.requiresDeposit,
    })
    .onConflictDoUpdate({
      target: categories.id,
      // `icon` stays out: it holds the R2 key the media pass wrote, and the
      // plan's copy is a file name on somebody's laptop.
      set: {
        code: category.code,
        position: category.position,
        isActive: category.isActive,
        requiresDeposit: category.requiresDeposit,
      },
    });
}

async function writeCategoryTranslations(db: Database, category: PlannedCategory): Promise<number> {
  let written = 0;
  for (const [lang, translation] of entries(category.translations)) {
    const description = translation.description;
    const values = {
      categoryId: category.id,
      languageCode: lang,
      name: translation.title,
      description,
      slug: translation.slug,
      metaTitle: translation.metaTitle,
      metaDescription: translation.metaDescription,
      searchVector: searchVectorFor(lang, translation.title, description) as unknown as string,
    };
    await db
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
    written += 1;
  }
  return written;
}

interface SpecCounts {
  specs: number;
  options: number;
  deletedSpecs: number;
  deletedOptions: number;
}

async function writeSpecs(db: Database, category: PlannedCategory): Promise<SpecCounts> {
  const counts: SpecCounts = { specs: 0, options: 0, deletedSpecs: 0, deletedOptions: 0 };

  for (const spec of category.specs) {
    await db
      .insert(categorySpecs)
      .values({
        id: spec.id,
        categoryId: spec.categoryId,
        key: spec.key,
        label: spec.label,
        helpText: spec.helpText,
        valueType: spec.valueType,
        unit: spec.unit,
        isRequired: spec.isRequired,
        isFilterable: spec.isFilterable,
        isComparable: spec.isComparable,
        position: spec.position,
      })
      .onConflictDoUpdate({
        target: categorySpecs.id,
        set: {
          key: spec.key,
          label: spec.label,
          helpText: spec.helpText,
          valueType: spec.valueType,
          unit: spec.unit,
          isRequired: spec.isRequired,
          isFilterable: spec.isFilterable,
          isComparable: spec.isComparable,
          position: spec.position,
        },
      });
    counts.specs += 1;

    for (const option of spec.options) {
      await db
        .insert(categorySpecOptions)
        .values({
          id: option.id,
          specId: spec.id,
          value: option.value,
          label: option.label,
          position: option.position,
        })
        .onConflictDoUpdate({
          target: categorySpecOptions.id,
          set: { value: option.value, label: option.label, position: option.position },
        });
      counts.options += 1;
    }

    counts.deletedOptions += await prune(
      db,
      categorySpecOptions,
      eq(categorySpecOptions.specId, spec.id),
      categorySpecOptions.id,
      spec.options.map((option) => option.id),
    );
  }

  counts.deletedSpecs += await prune(
    db,
    categorySpecs,
    eq(categorySpecs.categoryId, category.id),
    categorySpecs.id,
    category.specs.map((spec) => spec.id),
  );
  return counts;
}

async function upsertProduct(db: Database, product: PlannedProduct): Promise<void> {
  const columns = {
    status: product.status,
    categoryId: product.categoryId,
    brand: product.brand,
    basePrice: product.basePrice,
    marketingRate: product.marketingRate,
    currency: product.currency,
    rentalUnit: product.rentalUnit,
    rentalPackages: product.rentalPackages,
    stock: product.stock,
    isFeatured: product.isFeatured,
    chips: product.chips,
  };
  await db
    .insert(products)
    .values({ id: product.id, pricingMode: product.pricingMode, ...columns })
    .onConflictDoUpdate({
      target: products.id,
      // `pricingMode` is write-once everywhere else and stays out here too — a
      // re-run must not flip a product's mode under the add-ons priced against
      // it, and the composite FK on `product_addons` would refuse anyway.
      set: columns,
    });
}

async function writeProductTranslations(db: Database, product: PlannedProduct): Promise<number> {
  let written = 0;
  for (const [lang, translation] of entries(product.translations)) {
    const values = translationValues(product.id, lang, translation);
    await db
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
    written += 1;
  }
  return written;
}

function translationValues(productId: string, lang: LanguageCode, translation: PlannedTranslation) {
  // Same treatment the admin's own save gives it: sanitised against the
  // allowlist on the way in, and the tsvector gets its words, never its tags.
  const description = sanitizeRichText(translation.description);
  const body =
    [translation.shortDescription, richTextToPlain(description)].filter(Boolean).join(' ') || null;
  return {
    productId,
    languageCode: lang,
    title: translation.title,
    shortDescription: translation.shortDescription,
    description,
    slug: translation.slug,
    metaTitle: translation.metaTitle,
    metaDescription: translation.metaDescription,
    searchVector: searchVectorFor(lang, translation.title, body) as unknown as string,
  };
}

/** Delete every row under `scope` whose id the file no longer lists. */
export async function prune(
  db: Database,
  table: PgTable,
  scope: SQL,
  idColumn: AnyPgColumn,
  keep: string[],
): Promise<number> {
  const where = keep.length > 0 ? and(scope, notInArray(idColumn, keep)) : scope;
  const removed = await db.delete(table).where(where).returning({ id: idColumn });
  return removed.length;
}

const entries = <T>(record: Partial<Record<LanguageCode, T>>): [LanguageCode, T][] =>
  Object.entries(record) as [LanguageCode, T][];
