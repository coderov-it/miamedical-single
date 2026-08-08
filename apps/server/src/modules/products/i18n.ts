import type { LanguageCode, Localized, MediaAlt } from '@mia/db/schema';

/**
 * The fallback rule, in both storage styles: prefer the requested locale, fall
 * back to Italian. Italian is guaranteed to exist — by CHECK for jsonb
 * columns, by the service for translation rows.
 */

/** Inline `{ it, en }` jsonb value → plain string. */
export function pick(value: Localized, locale: LanguageCode): string {
  return locale === 'en' && value.en ? value.en : value.it;
}

export function pickOptional(
  value: Localized | null | undefined,
  locale: LanguageCode,
): string | null {
  return value ? pick(value, locale) : null;
}

export function pickAlt(alt: MediaAlt | undefined, locale: LanguageCode): string | null {
  if (!alt) return null;
  return (locale === 'en' ? (alt.en ?? alt.it) : alt.it) ?? null;
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
    rows.find((row) => row.languageCode === locale) ?? rows.find((r) => r.languageCode === 'it')
  );
}

/**
 * Field-level resolution with a fallback marker: returns the requested
 * locale's value when present, else Italian plus `fellBack: true` — which the
 * public mapper turns into the `*Locale: "it"` sibling key.
 */
export function resolveField(
  requested: string | null | undefined,
  italian: string | null | undefined,
  locale: LanguageCode,
): { value: string | null; fellBack: boolean } {
  if (locale === 'it') return { value: italian ?? null, fellBack: false };
  if (requested != null && requested !== '') return { value: requested, fellBack: false };
  return { value: italian ?? null, fellBack: italian != null };
}
