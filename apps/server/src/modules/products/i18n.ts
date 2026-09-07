import {
  type LanguageCode,
  type Localized,
  type MediaAlt,
  pickLocalized,
  SOURCE_LANGUAGE,
} from '@mia/db/schema';

/**
 * The fallback rule, in both storage styles: prefer the requested locale, fall
 * back to the source language. The source language is guaranteed to exist — by
 * CHECK for jsonb columns, by the service for translation rows.
 *
 * Nothing here names a language. `pickLocalized` lives in the registry package
 * because the storefront and the admin resolve the same way, and three copies
 * of the same ternary is how the second language leaked into fifty files.
 */

/** Inline `{ it, en, … }` jsonb value → plain string. */
export const pick = pickLocalized;

export function pickOptional(
  value: Localized | null | undefined,
  locale: LanguageCode,
): string | null {
  return value ? pick(value, locale) : null;
}

/**
 * Alt text differs from every other localized value: it is optional in the
 * source language too, so there is no guaranteed fallback and the result is
 * nullable.
 */
export function pickAlt(alt: MediaAlt | undefined, locale: LanguageCode): string | null {
  if (!alt) return null;
  return alt[locale] ?? alt[SOURCE_LANGUAGE] ?? null;
}

/**
 * Translation-table rows, already fetched with
 * `WHERE language_code IN (requested, 'it')` in a single pass.
 */
export function pickTranslation<T extends { languageCode: LanguageCode }>(
  rows: T[],
  locale: LanguageCode,
): T | undefined {
  return (
    rows.find((row) => row.languageCode === locale) ??
    rows.find((row) => row.languageCode === SOURCE_LANGUAGE)
  );
}

/**
 * Field-level resolution with a fallback marker: returns the requested
 * locale's value when present, else the source language plus `fellBack: true` —
 * which the public mapper turns into the `*Locale: "it"` sibling key.
 */
export function resolveField(
  requested: string | null | undefined,
  source: string | null | undefined,
  locale: LanguageCode,
): { value: string | null; fellBack: boolean } {
  if (locale === SOURCE_LANGUAGE) return { value: source ?? null, fellBack: false };
  if (requested != null && requested !== '') return { value: requested, fellBack: false };
  return { value: source ?? null, fellBack: source != null };
}
