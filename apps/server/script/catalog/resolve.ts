/**
 * Turning what the author wrote into what the database stores: localized text,
 * translation rows, and a file name into a path on disk.
 *
 * Shared by both planners, which is the whole reason it is its own module — a
 * category and a product resolve a slug and an icon by exactly the same rules,
 * and two copies of that would drift.
 */
import { existsSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';

import type { LanguageCode, Localized } from '@mia/db/schema';

import type { AuthoredText } from './authored.ts';
import { slugify } from './ids.ts';
import type { PlannedAsset, PlannedTranslation, Translations } from './planned.ts';

/** `{ it, en }` with `en` omitted rather than undefined — `exactOptionalPropertyTypes`. */
export function localized(text: AuthoredText): Localized {
  return { it: text.it, ...(text.en ? { en: text.en } : {}) };
}

export const localizedOrNull = (text: AuthoredText | null | undefined): Localized | null =>
  text ? localized(text) : null;

export interface AuthoredBody {
  shortDescription: AuthoredText | null;
  description: AuthoredText | null;
  metaTitle: AuthoredText | null;
  metaDescription: AuthoredText | null;
}

/**
 * One translation row per language the author actually wrote. Italian always
 * exists; English only when a title for it does, because a translation row
 * needs a title and a slug and there is nothing honest to invent for either.
 *
 * A missing slug is derived from the title and REPORTED — a slug is a public
 * URL and an SEO commitment, so the run prints every one it had to invent
 * rather than letting it appear silently in the database.
 */
export function planTranslations(
  title: AuthoredText,
  slug: AuthoredText | undefined,
  body: AuthoredBody,
): Translations {
  const build = (lang: LanguageCode, text: string): PlannedTranslation => {
    const pinned = lang === 'it' ? slug?.it : slug?.en;
    return {
      title: text,
      slug: pinned ?? slugify(text),
      slugDerived: !pinned,
      shortDescription: pick(body.shortDescription, lang),
      description: pick(body.description, lang),
      metaTitle: pick(body.metaTitle, lang),
      metaDescription: pick(body.metaDescription, lang),
    };
  };

  const translations: Translations = { it: build('it', title.it) };
  if (title.en) translations.en = build('en', title.en);
  return translations;
}

/** English falls back to nothing, never to Italian — untranslated stays untranslated. */
function pick(text: AuthoredText | null, lang: LanguageCode): string | null {
  if (text === null) return null;
  if (lang === 'it') return text.it;
  return text.en ?? null;
}

/**
 * `"foo.jpg"` lives in the category's own folder under the assets root; a ref
 * with a slash is taken from the root as written, so a file shared by several
 * categories needs no copy per category.
 *
 * A missing file still returns an asset, carrying `exists: false` — validation
 * reports every one of them at once instead of dying on the first.
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
