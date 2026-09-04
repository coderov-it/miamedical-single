/**
 * The checks that need the database open: identity collisions with rows that
 * are already there, and rows the data files no longer mention.
 *
 * They exist because ids here are derived from codes while the database also
 * enforces uniqueness on `categories.code`, on `terms_documents.code` and on
 * `(language_code, slug)`. A category already in the table under some other id
 * and now hand-written under the same code holds a DIFFERENT uuid, so the
 * insert would collide on the code halfway through a run. Caught here it is one
 * line naming the row; caught by PostgreSQL it is a half-written catalogue.
 */
import type { Database } from '@mia/db';
import { eq, inArray, sql } from '@mia/db';
import {
  categories,
  categoryTranslations,
  productTranslations,
  products,
  termsDocuments,
} from '@mia/db/schema';

import type { CatalogPlan } from './planned.ts';
import { whereCategory, whereProduct, whereTerms } from './planned.ts';

export interface Preflight {
  /** Fatal — the write would break a unique index. */
  conflicts: string[];
  /** Not fatal: rows in a category the run touches that no data file mentions. */
  orphans: string[];
}

export async function preflight(db: Database, plan: CatalogPlan): Promise<Preflight> {
  const conflicts = [...(await codeConflicts(db, plan)), ...(await slugConflicts(db, plan))];
  return { conflicts, orphans: await orphans(db, plan) };
}

/** A `code` a data file claims that a row with a different id already holds. */
async function codeConflicts(db: Database, plan: CatalogPlan): Promise<string[]> {
  const problems: string[] = [];

  const categoryCodes = plan.categories.map((category) => category.code);
  const storedCategories = categoryCodes.length
    ? await db
        .select({ id: categories.id, code: categories.code })
        .from(categories)
        .where(inArray(categories.code, categoryCodes))
    : [];
  const heldCategory = new Map(storedCategories.map((row) => [row.code, row.id]));

  for (const category of plan.categories) {
    const held = heldCategory.get(category.code);
    if (held && held !== category.id) {
      problems.push(
        `${whereCategory(category.code)}: the database already has this code on ${held}. ` +
          'Change the code, or delete that row.',
      );
    }
  }

  const termsCodes = plan.terms.map((document) => document.code);
  const storedTerms = termsCodes.length
    ? await db
        .select({ id: termsDocuments.id, code: termsDocuments.code })
        .from(termsDocuments)
        .where(inArray(termsDocuments.code, termsCodes))
    : [];
  const heldTerms = new Map(storedTerms.map((row) => [row.code, row.id]));

  for (const document of plan.terms) {
    const held = heldTerms.get(document.code);
    if (held && held !== document.id) {
      problems.push(
        `${whereTerms(document.code)}: the database already has this code on ${held}. ` +
          'Change the code, or delete that row.',
      );
    }
  }

  return problems;
}

interface Owner {
  id: string;
  where: string;
}

/** A slug the data files claim that a row outside this run already owns. */
async function slugConflicts(db: Database, plan: CatalogPlan): Promise<string[]> {
  const categoryOwners = new Map<string, Owner>();
  for (const category of plan.categories) {
    for (const [lang, translation] of Object.entries(category.translations)) {
      categoryOwners.set(`${lang}/${translation.slug}`, {
        id: category.id,
        where: whereCategory(category.code),
      });
    }
  }

  const productOwners = new Map<string, Owner>();
  for (const product of plan.products) {
    for (const [lang, translation] of Object.entries(product.translations)) {
      productOwners.set(`${lang}/${translation.slug}`, {
        id: product.id,
        where: whereProduct(product.categoryCode, product.code),
      });
    }
  }

  const categoryRows = categoryOwners.size
    ? await db
        .select({
          id: categoryTranslations.categoryId,
          lang: categoryTranslations.languageCode,
          slug: categoryTranslations.slug,
        })
        .from(categoryTranslations)
        .where(inArray(categoryTranslations.slug, [...categoryOwners.keys()].map(slugOf)))
    : [];

  const productRows = productOwners.size
    ? await db
        .select({
          id: productTranslations.productId,
          lang: productTranslations.languageCode,
          slug: productTranslations.slug,
        })
        .from(productTranslations)
        .where(inArray(productTranslations.slug, [...productOwners.keys()].map(slugOf)))
    : [];

  const problems: string[] = [];
  for (const [rows, owners, kind] of [
    [categoryRows, categoryOwners, 'category'],
    [productRows, productOwners, 'product'],
  ] as const) {
    for (const row of rows) {
      const owner = owners.get(`${row.lang}/${row.slug}`);
      if (owner && owner.id !== row.id) {
        problems.push(
          `${owner.where}: the ${row.lang} slug "${row.slug}" already belongs to ${kind} ${row.id}`,
        );
      }
    }
  }
  return problems;
}

/**
 * Products sitting in a category this run touches that no data file lists.
 * Reported and never deleted: an order line points at a product, and a product
 * not authored yet is not the same thing as a product that should go.
 */
async function orphans(db: Database, plan: CatalogPlan): Promise<string[]> {
  const ids = plan.categories.map((category) => category.id);
  if (ids.length === 0) return [];

  const known = new Set(plan.products.map((product) => product.id));
  const rows = await db
    .select({
      id: products.id,
      title: sql<string>`(SELECT title FROM ${productTranslations}
                            WHERE product_id = ${products.id} AND language_code = 'it' LIMIT 1)`,
      code: categories.code,
    })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(inArray(products.categoryId, ids));

  return rows
    .filter((row) => !known.has(row.id))
    .map(
      (row) =>
        `${row.code}: "${row.title ?? row.id}" (${row.id}) is in the database but in no data file`,
    );
}

const slugOf = (key: string): string => key.slice(key.indexOf('/') + 1);
