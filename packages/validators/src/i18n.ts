import * as v from 'valibot';

/**
 * "Italian mandatory, English optional" is stated once here and reused
 * everywhere — never restated per entity.
 */

export const LANGUAGE_CODES = ['it', 'en'] as const;
export type LanguageCode = (typeof LANGUAGE_CODES)[number];
export const DEFAULT_LANGUAGE: LanguageCode = 'it';

const requiredText = (max: number) =>
  v.pipe(v.string(), v.trim(), v.minLength(1, 'Italian text is required.'), v.maxLength(max));

const optionalText = (max: number) => v.optional(v.pipe(v.string(), v.trim(), v.maxLength(max)));

/**
 * Shape of every inline `{ it, en }` jsonb column. `strictObject` is what
 * polices the key set — the database CHECK can only demand that `it` exists.
 */
export const localizedSchema = (max = 500) =>
  v.strictObject({
    it: requiredText(max),
    en: optionalText(max),
  });

/** Default cap suits labels and names; pass a larger max for long-form text. */
export const LocalizedSchema = localizedSchema();
export type Localized = v.InferOutput<typeof LocalizedSchema>;

export const LanguageCodeSchema = v.picklist(LANGUAGE_CODES, 'Language must be "it" or "en".');

/** `?locale=` query param — absent means Italian. */
export const LocaleQuerySchema = v.optional(LanguageCodeSchema, DEFAULT_LANGUAGE);

/**
 * The same guarantee for the three translation tables: an object keyed by
 * language where the Italian entry is mandatory and English may be missing.
 */
export function translationsSchema<TEntries extends v.ObjectEntries>(entries: TEntries) {
  return v.strictObject({
    it: v.strictObject(entries),
    en: v.optional(v.strictObject(entries)),
  });
}

/** Resolve a `Localized` value for a locale, falling back to Italian. */
export function pickLocalized(value: { it: string; en?: string }, locale: LanguageCode): string {
  return locale === 'en' && value.en ? value.en : value.it;
}
