/**
 * Turning what the author wrote into what the database stores: translation
 * rows, and a file name into a path on disk.
 *
 * Shared by both planners, which is the whole reason it is its own module — a
 * category and a product resolve a slug and an icon by exactly the same rules,
 * and two copies of that would drift.
 *
 * The authoring API groups text BY LANGUAGE (`translations: { it: {…}, en: {…} }`)
 * rather than by field, so unlike the JSON format this replaces there is no
 * merging to do: a language written is a row, a language absent is no row.
 * English never falls back to Italian — untranslated stays untranslated, which
 * is what lets the storefront's own fallback stay the single place that decides
 * what a missing translation shows.
 */
import { existsSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';

import type { LanguageCode } from '@mia/db/schema';

import type { CategoryTranslationInput, ProductTranslationInput } from '../../lib/types.ts';
import { slugify } from './ids.ts';
import type { PlannedAsset, PlannedTranslation, Translations } from './planned.ts';

/**
 * A category calls its headline `name` and has no short description; a product
 * calls it `title`. One shape covers both so `planTranslations` is written once.
 */
export interface AuthoredTranslation {
  headline: string;
  slug?: string | undefined;
  shortDescription?: string | undefined;
  description?: string | undefined;
  metaTitle?: string | undefined;
  metaDescription?: string | undefined;
}

type Written<T> = { it: T } & Partial<Record<LanguageCode, T>>;

export const fromProduct = (input: ProductTranslationInput): AuthoredTranslation => ({
  headline: input.title,
  slug: input.slug,
  shortDescription: input.shortDescription,
  description: input.description,
  metaTitle: input.metaTitle,
  metaDescription: input.metaDescription,
});

export const fromCategory = (input: CategoryTranslationInput): AuthoredTranslation => ({
  headline: input.name,
  slug: input.slug,
  description: input.description,
  metaTitle: input.metaTitle,
  metaDescription: input.metaDescription,
});

/**
 * One translation row per language the author actually wrote.
 *
 * A missing slug is derived from the headline and REPORTED — a slug is a public
 * URL and an SEO commitment, so the run prints every one it had to invent
 * rather than letting it appear silently in the database.
 */
export function planTranslations<T>(
  written: Written<T>,
  adapt: (input: T) => AuthoredTranslation,
): Translations {
  const translations: Translations = {};
  for (const [language, input] of Object.entries(written) as [LanguageCode, T][]) {
    const text = adapt(input);
    translations[language] = {
      title: text.headline,
      slug: text.slug ?? slugify(text.headline),
      slugDerived: text.slug === undefined,
      shortDescription: text.shortDescription ?? null,
      description: text.description ?? null,
      metaTitle: text.metaTitle ?? null,
      metaDescription: text.metaDescription ?? null,
    } satisfies PlannedTranslation;
  }
  return translations;
}

/**
 * `"foo.jpg"` lives in the category's own folder under the assets root; a ref
 * with a slash is taken from the root as written, so a file shared by several
 * categories needs no copy per category.
 *
 * A missing file still returns an asset, carrying `exists: false` — validation
 * reports every one of them at once instead of dying on the first.
 *
 * The same two steps run in `script/preview/assets.ts`, which is deliberate:
 * the preview must show a broken photo for exactly the refs this would fail on,
 * and it cannot import the sync without dragging Drizzle into a browser file.
 */
export function resolveAsset(
  ref: string | null | undefined,
  assetsRoot: string,
  categoryCode: string,
): PlannedAsset | null {
  if (!ref) return null;
  if (isAbsolute(ref)) return { ref, sourcePath: ref, exists: existsSync(ref) };

  const scoped = join(assetsRoot, categoryCode, ref);
  if (!ref.includes('/') && existsSync(scoped)) return { ref, sourcePath: scoped, exists: true };

  const rooted = join(assetsRoot, ref);
  if (existsSync(rooted)) return { ref, sourcePath: rooted, exists: true };
  return { ref, sourcePath: ref.includes('/') ? rooted : scoped, exists: false };
}

/** Bound to one category's folder, so a planner passes a file name and nothing else. */
export type AssetResolver = (ref: string | null | undefined) => PlannedAsset | null;

export const assetResolverFor =
  (assetsRoot: string, categoryCode: string): AssetResolver =>
  (ref) =>
    resolveAsset(ref, assetsRoot, categoryCode);
