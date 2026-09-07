/**
 * THE language registry. Adding a language is one entry here plus the pgEnum
 * value in `@mia/db` — see docs/code/adding-a-language.md.
 *
 * Everything downstream derives from this array: the valibot picklist, the
 * `{ it, en, … }` jsonb shape, the admin's language switcher, the storefront's
 * `<html lang>` and `og:locale`, and the PostgreSQL search dictionary. Nothing
 * anywhere else may hardcode a language code or count them.
 *
 * ⚠️ APPEND ONLY, and keep the source language first. The order is the order
 * PostgreSQL stores in `language_code`, and enum ordering is part of the type —
 * reordering this array is a destructive migration, not an edit.
 */

/** What every language must state. Adding a field here is a compile error until every language answers it. */
export interface LanguageDefinition {
  /** Wire code: the pgEnum member, the `?locale=` value, and the URL prefix for every non-source language. */
  readonly code: string;
  /** Endonym — what the language calls itself. This is what a language picker shows, in any interface language. */
  readonly label: string;
  /** BCP 47, for `<html lang>` and every `Intl` formatter. */
  readonly tag: string;
  /** Open Graph `og:locale`. */
  readonly ogLocale: string;
  /**
   * PostgreSQL text-search dictionary. Must exist on the instance —
   * `SELECT cfgname FROM pg_ts_config` — or every write of a translation row
   * in this language throws.
   */
  readonly searchConfig: string;
  /** Regional indicator, for the storefront's compact switcher only. */
  readonly flag: string;
}

export const LANGUAGES = [
  {
    code: 'it',
    label: 'Italiano',
    tag: 'it-IT',
    ogLocale: 'it_IT',
    searchConfig: 'italian',
    flag: '🇮🇹',
  },
  {
    code: 'en',
    label: 'English',
    tag: 'en-GB',
    ogLocale: 'en_GB',
    searchConfig: 'english',
    flag: '🇬🇧',
  },
  {
    code: 'fr',
    label: 'Français',
    tag: 'fr-FR',
    ogLocale: 'fr_FR',
    searchConfig: 'french',
    flag: '🇫🇷',
  },
] as const satisfies readonly LanguageDefinition[];

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

/**
 * The mandatory language. Every translated value is guaranteed to exist in it —
 * by CHECK constraint for jsonb columns, by the service for translation rows —
 * so it is both the fallback for a gap and the source an automatic translation
 * would be generated from.
 */
export const SOURCE_LANGUAGE = LANGUAGES[0].code;

/** `?locale=` absent means the source language. Kept as its own name because "default" is about request handling, not authoring. */
export const DEFAULT_LANGUAGE: LanguageCode = SOURCE_LANGUAGE;

export type TargetLanguageCode = Exclude<LanguageCode, typeof SOURCE_LANGUAGE>;

export const LANGUAGE_CODES: readonly LanguageCode[] = LANGUAGES.map((language) => language.code);

/** Every language a value may be *translated into* — the source language excluded. */
export const TARGET_LANGUAGES = LANGUAGES.filter(
  (language): language is (typeof LANGUAGES)[number] & { code: TargetLanguageCode } =>
    language.code !== SOURCE_LANGUAGE,
);

export const TARGET_LANGUAGE_CODES: readonly TargetLanguageCode[] = TARGET_LANGUAGES.map(
  (language) => language.code,
);

const BY_CODE = new Map<string, LanguageDefinition>(
  LANGUAGES.map((language) => [language.code, language]),
);

/** Registry lookup. Narrow with `isLanguageCode` first — an unknown code is a programming error, not input. */
export function languageOf(code: LanguageCode): LanguageDefinition {
  const language = BY_CODE.get(code);
  if (!language) throw new Error(`Unknown language code: ${code}`);
  return language;
}

/** Runtime narrowing for anything arriving as a string — a URL segment, a stored preference. */
export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && BY_CODE.has(value);
}

// --- value shape (no valibot: this file must stay importable by @mia/db) -----

/**
 * `{ it: string, en?: string, fr?: string, … }`, derived from the registry.
 * Hand-writing this shape is what made adding a third language a 50-file
 * change the first time.
 */
export type Localized = Record<typeof SOURCE_LANGUAGE, string> & {
  [K in TargetLanguageCode]?: string | undefined;
};

/** Alt text is optional in every language, including the source. */
export type LocalizedOptional = { [K in LanguageCode]?: string | undefined };

/**
 * Resolve a `Localized` value for a locale, falling back to the source language.
 *
 * An empty string falls back too: a translation row that exists but was left
 * blank is a gap, not a translation into nothing.
 */
export function pickLocalized(value: Localized, locale: LanguageCode): string {
  const text = (value as Record<LanguageCode, string | undefined>)[locale];
  return text !== undefined && text !== '' ? text : value[SOURCE_LANGUAGE];
}

/**
 * Which languages a localized value is still missing. The admin renders this
 * per field, and it is the input an automatic translation would work from.
 */
export function missingLanguages(
  value: Partial<Record<LanguageCode, string | undefined>> | null | undefined,
): TargetLanguageCode[] {
  if (!value) return [...TARGET_LANGUAGE_CODES];
  return TARGET_LANGUAGE_CODES.filter((code) => {
    const text = value[code];
    return text === undefined || text.trim() === '';
  });
}

/**
 * A localized value with every registered language accounted for, built from a
 * map of translation rows: `localizedFrom(product.translations, (t) => t.title)`.
 *
 * The alternative — a positional `(it, en)` helper — is one parameter per
 * language, so a third language is an edit at every call site. That is the
 * mistake this replaces.
 *
 * The source language is coerced to a string, because it is the one every other
 * language falls back to. Targets stay absent when they have no text, which is
 * what keeps the gap visible to `missingLanguages`.
 */
export function localizedFrom<TRow>(
  translations: Partial<Record<LanguageCode, TRow | undefined>> | null | undefined,
  pick: (row: TRow) => string | null | undefined,
): Localized {
  const value: Record<string, string | undefined> = { [SOURCE_LANGUAGE]: '' };
  for (const code of LANGUAGE_CODES) {
    const row = translations?.[code];
    const text = row ? (pick(row) ?? undefined) : undefined;
    if (code === SOURCE_LANGUAGE) value[code] = text ?? '';
    else if (text !== undefined && text !== '') value[code] = text;
  }
  return value as Localized;
}
