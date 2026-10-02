/**
 * Which catalogue product each checkout line names — the pure half of loading a
 * checkout's products, kept free of the database so it can be tested as is.
 */

import type { LanguageCode } from '@mia/db/schema';

export interface SlugRow {
  slug: string;
  productId: string;
  languageCode: LanguageCode;
}

export interface LineRef {
  productId?: string | undefined;
  productSlug: string;
}

/**
 * The product one slug names, from every translation row carrying it — the same
 * choice `findIdBySlug` in products/catalog/repo.ts makes: the exact language
 * wins, another language's slug only when it belongs to ONE product.
 */
export function pickSlugMatch(
  rows: readonly SlugRow[],
  languageCode: LanguageCode,
): string | undefined {
  const exact = rows.find((row) => row.languageCode === languageCode);
  if (exact) return exact.productId;

  const productIds = new Set(rows.map((row) => row.productId));
  if (productIds.size !== 1) return undefined;
  return rows[0]?.productId;
}

/**
 * The product id behind every line, index for index. A line that sent an id is
 * taken at its word — its slug is not consulted, as before. `undefined` marks a
 * slug that names no product, or names several.
 */
export function lineProductIds(
  lines: readonly LineRef[],
  slugRows: readonly SlugRow[],
  languageCode: LanguageCode,
): (string | undefined)[] {
  const rowsBySlug = new Map<string, SlugRow[]>();
  for (const row of slugRows) {
    const rows = rowsBySlug.get(row.slug) ?? [];
    rows.push(row);
    rowsBySlug.set(row.slug, rows);
  }

  return lines.map(
    (line) => line.productId ?? pickSlugMatch(rowsBySlug.get(line.productSlug) ?? [], languageCode),
  );
}

/** The slugs worth looking up: those of lines that did not send an id. */
export function slugsToResolve(lines: readonly LineRef[]): string[] {
  const unresolved = lines.filter((line) => line.productId === undefined);
  return [...new Set(unresolved.map((line) => line.productSlug))];
}
