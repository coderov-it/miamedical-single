import * as v from 'valibot';

import {
  type LanguageCode,
  LANGUAGE_CODES,
  SOURCE_LANGUAGE,
  TARGET_LANGUAGE_CODES,
  type TargetLanguageCode,
  DEFAULT_LANGUAGE,
  languageOf,
} from './language.ts';

/**
 * The valibot layer over the language registry in `./language.ts`.
 *
 * The registry itself is kept free of valibot so `@mia/db` can import it for
 * the pgEnum and the search dictionary without pulling a validation library
 * into the schema package. Everything here is derived from it — no schema in
 * this file names a language.
 */

export * from './language.ts';

const requiredText = (max: number) =>
  v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, `${languageOf(SOURCE_LANGUAGE).label} text is required.`),
    v.maxLength(max),
  );

const optionalText = (max: number) => v.optional(v.pipe(v.string(), v.trim(), v.maxLength(max)));

type RequiredText = ReturnType<typeof requiredText>;
type OptionalText = ReturnType<typeof optionalText>;

type LocalizedEntries = Record<typeof SOURCE_LANGUAGE, RequiredText> &
  Record<TargetLanguageCode, OptionalText>;

/**
 * Built from the registry rather than written out, so a new language needs no
 * edit here. The single cast is what that costs: the loop cannot prove to `tsc`
 * that it visited every member of the union, but `TARGET_LANGUAGE_CODES` is
 * derived from the same array the union is, so it always has.
 */
function localizedEntries(max: number): LocalizedEntries {
  const entries: Record<string, RequiredText | OptionalText> = {
    [SOURCE_LANGUAGE]: requiredText(max),
  };
  for (const code of TARGET_LANGUAGE_CODES) entries[code] = optionalText(max);
  return entries as LocalizedEntries;
}

type LocalizedOptionalEntries = Record<LanguageCode, OptionalText>;

/**
 * A localized value with NO mandatory language, built from the registry like
 * `localizedEntries` above.
 *
 * Alt text is the case that needs it: a decorative image has none in any
 * language, so there is no source value to require. Media alt text used to be
 * written out with `it` and `en` as literal keys, which is why it could not be
 * translated into French or German — the shape, not the provider, was the
 * limit.
 */
function localizedOptionalEntries(max: number): LocalizedOptionalEntries {
  const entries: Record<string, OptionalText> = {};
  for (const code of LANGUAGE_CODES) entries[code] = optionalText(max);
  return entries as LocalizedOptionalEntries;
}

/**
 * Shape of every inline `{ it, en, … }` jsonb column. `strictObject` is what
 * polices the key set — the database CHECK can only demand that the source
 * language exists.
 */
export const localizedSchema = (max = 500) => v.strictObject(localizedEntries(max));

/** The same shape with every language optional — see `localizedOptionalEntries`. */
export const localizedOptionalSchema = (max = 500) => v.strictObject(localizedOptionalEntries(max));

/** Default cap suits labels and names; pass a larger max for long-form text. */
export const LocalizedSchema = localizedSchema();

export const LanguageCodeSchema = v.picklist(
  LANGUAGE_CODES,
  `Language must be one of: ${LANGUAGE_CODES.join(', ')}.`,
);

/** `?locale=` query param — absent means the source language. */
export const LocaleQuerySchema = v.optional(LanguageCodeSchema, DEFAULT_LANGUAGE);

type TranslationEntries<TEntries extends v.ObjectEntries> = Record<
  typeof SOURCE_LANGUAGE,
  v.StrictObjectSchema<TEntries, undefined>
> & {
  [K in TargetLanguageCode]: v.OptionalSchema<v.StrictObjectSchema<TEntries, undefined>, undefined>;
};

/**
 * The same guarantee for the translation tables: an object keyed by language
 * where the source-language entry is mandatory and every other may be missing.
 */
export function translationsSchema<TEntries extends v.ObjectEntries>(entries: TEntries) {
  const shape: Record<string, v.GenericSchema> = {
    [SOURCE_LANGUAGE]: v.strictObject(entries),
  };
  for (const code of TARGET_LANGUAGE_CODES) shape[code] = v.optional(v.strictObject(entries));
  return v.strictObject(shape as TranslationEntries<TEntries>);
}

/** Narrows a `?locale=` string that has already been through `LanguageCodeSchema`. */
export type { LanguageCode };
