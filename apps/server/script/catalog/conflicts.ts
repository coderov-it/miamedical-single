/**
 * The checks that need the database open: identity collisions with rows that
 * are already there, and rows the files no longer mention.
 *
 * They exist because ids here are derived from codes while the database also
 * enforces uniqueness on `categories.code` and on `(language_code, slug)`. A
 * category already in the table under some other id and now hand-written under
 * the same code holds a DIFFERENT uuid, so the insert would collide on the code
 * halfway through a run. Caught here, it is one line telling the author to pin
 * `"id"`; caught by PostgreSQL, it is a half-written catalogue.
 */
import type { Database } from '@mia/db';
import { eq, inArray, sql } from '@mia/db';
import { categories, categoryTranslations, productTranslations, products } from '@mia/db/schema';

import type { CatalogPlan } from './planned.ts';

export interface Preflight {
  /** Fatal — the write would break a unique index. */
  conflicts: string[];
  /** Not fatal: rows in a category the run touches that no file mentions. */
  orphans: string[];
}

export async function preflight(db: Database, plan: CatalogPlan): Promise<Preflight> {
  const conflicts: string[] = [];

  const plannedCodes = plan.categories.map((category) => category.code);
  const stored = plannedCodes.length
    ? await db
        .select({ id: categories.id, code: categories.code })
        .from(categories)
        .where(inArray(categories.code, plannedCodes))
    : [];
  const storedByCode = new Map(stored.map((row) => [row.code, row.id]));

  for (const category of plan.categories) {
    const held = storedByCode.get(category.code);
    if (held && held !== category.id) {
      conflicts.push(
        `${category.file}.json › category "${category.code}": the database already has this code ` +
          `on ${held}. Add "id": "${held}" to adopt that row, or change the code.`,
      );
    }
  }

  conflicts.push(...(await slugConflicts(db, plan)));

  return { conflicts, orphans: await orphans(db, plan) };
}

/** A slug the files claim that a row outside this run already owns. */
async function slugConflicts(db: Database, plan: CatalogPlan): Promise<string[]> {
  const problems: string[] = [];

  const categoryOwners = new Map<string, { id: string; where: string }>();
  for (const category of plan.categories) {
    for (const [lang, translation] of Object.entries(category.translations)) {
      categoryOwners.set(`${lang}/${translation.slug}`, {
        id: category.id,
        where: `${category.file}.json › category "${category.code}"`,
      });
    }
  }
  const productOwners = new Map<string, { id: string; where: string }>();
  for (const product of plan.products) {
    for (const [lang, translation] of Object.entries(product.translations)) {
      productOwners.set(`${lang}/${translation.slug}`, {
        id: product.id,
        where: `${product.file}.json › product "${product.code}"`,
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

  for (const row of categoryRows) {
    const owner = categoryOwners.get(`${row.lang}/${row.slug}`);
    if (owner && owner.id !== row.id) {
      problems.push(
        `${owner.where}: the ${row.lang} slug "${row.slug}" already belongs to category ${row.id}`,
      );
    }
  }
  for (const row of productRows) {
    const owner = productOwners.get(`${row.lang}/${row.slug}`);
    if (owner && owner.id !== row.id) {
      problems.push(
        `${owner.where}: the ${row.lang} slug "${row.slug}" already belongs to product ${row.id}`,
      );
    }
  }
  return problems;
}

/**
 * Products sitting in a category this run touches that no file lists. Reported
 * and never deleted: an order line points at a product, and a file that has not
 * been written yet is not the same thing as a product that should go.
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
        `${row.code}: "${row.title ?? row.id}" (${row.id}) is in the database but in no file`,
    );
}

const slugOf = (key: string): string => key.slice(key.indexOf('/') + 1);
