/**
 * The languages a customer email is written in.
 *
 * Its own union rather than `LanguageCode` from `@mia/validators`, because this
 * package imports nothing (see `src/index.ts`). The two are kept equal by the
 * compiler at the one place they meet: the server passes a `LanguageCode` into
 * every customer message, so registering a fifth language there fails to build
 * until each message below has copy for it.
 *
 * Every message keeps its copy as a `Translated<…>` table keyed by this union, so
 * a missing translation is a type error rather than an empty paragraph.
 */
export type EmailLanguage = 'it' | 'en' | 'fr' | 'de';

/** One value per language — the shape every message's copy table takes. */
export type Translated<T> = Record<EmailLanguage, T>;

/** The BCP 47 tag for `Intl` and the document's `lang`. */
export const LOCALE_TAG: Translated<string> = {
  it: 'it-IT',
  en: 'en-GB',
  fr: 'fr-FR',
  de: 'de-DE',
};
