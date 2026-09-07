import { AsyncLocalStorage } from 'node:async_hooks';

import {
  isLanguageCode,
  type Localized,
  pickLocalized,
  LANGUAGE_CODES,
  LANGUAGES,
  type LanguageCode,
  languageOf,
  SOURCE_LANGUAGE,
} from '@mia/validators/language';

import en from '~/i18n/en.json';
import it from '~/i18n/it.json';

/**
 * Storefront locales come from THE language registry (`@mia/validators/language`),
 * so a language registered for the catalogue is a language the site can serve.
 * Nothing in this app may write a locale code as a literal.
 */
export const LOCALES = LANGUAGE_CODES;
export type SiteLocale = LanguageCode;
export const DEFAULT_LOCALE: SiteLocale = SOURCE_LANGUAGE;
export { LANGUAGES, isLanguageCode, languageOf, SOURCE_LANGUAGE };
export { pickLocalized, type Localized };

/**
 * UI copy per locale. A locale with no file here is not broken — see
 * `translate()`: it falls back to the source language, which is how a new
 * language can go live with correct URLs, hreflang and translated *content*
 * while its 676 chrome strings are still being written.
 */
type Messages = Record<string, string>;
const MESSAGES: Partial<Record<SiteLocale, Messages>> = { it, en };

interface RequestLanguageContext {
  locale: SiteLocale;
  publicPath: string;
}

/**
 * ONE store for the whole process, pinned to `globalThis`.
 *
 * The middleware opens the scope and every component reads it, so the two must
 * hold the same `AsyncLocalStorage` instance. In dev they otherwise do not: Vite
 * re-instantiates this module on HMR while the already-loaded middleware keeps
 * the old one, and from then on `getStore()` returns undefined on every render.
 * The fallback below is Italian, and Italian is also the default locale — so the
 * English storefront silently rendered Italian and the Italian one looked fine,
 * which is exactly why this went unnoticed (owner, 2026-08-30).
 *
 * Production loads each module once and never needed this. Dev did, and a
 * language bug you cannot reproduce locally is one nobody fixes.
 */
const STORE_KEY = Symbol.for('mia.requestLocale');
const globalStore = globalThis as typeof globalThis & {
  [STORE_KEY]?: AsyncLocalStorage<RequestLanguageContext>;
};
const requestLocale = (globalStore[STORE_KEY] ??= new AsyncLocalStorage<RequestLanguageContext>());

export function localeFromLocals(locals: App.Locals): SiteLocale {
  return locals.locale ?? DEFAULT_LOCALE;
}

/** The current SSR request's locale. Never available to browser bundles. */
export function localeForRequest(): SiteLocale {
  return requestLocale.getStore()?.locale ?? DEFAULT_LOCALE;
}

export function publicPathForRequest(): string | undefined {
  return requestLocale.getStore()?.publicPath;
}

export function renderWithLocale<T>(locale: SiteLocale, publicPath: string, render: () => T): T {
  const parent = requestLocale.getStore();
  if (parent?.locale === locale) return render();
  return requestLocale.run({ locale, publicPath }, render);
}

/** BCP 47, for `<html lang>` and every `Intl` formatter. From the registry. */
export function localeTag(locale: SiteLocale): string {
  return languageOf(locale).tag;
}

export function openGraphLocale(locale: SiteLocale): string {
  return languageOf(locale).ogLocale;
}

/**
 * A missing key behaves differently per locale, and the asymmetry is the point.
 *
 * • Source language — THROW. Every key must exist in it, because it is what
 *   everything else falls back to. A gap there is a bug in the catalogue and a
 *   loud failure is the only way it gets fixed.
 * • Any other locale — fall back to the source. A gap there is a rollout state:
 *   the language is registered, its URLs and its database content are already
 *   translated, and its chrome is still being written. Throwing would take the
 *   whole page down over one unwritten button label.
 *
 * This is the same rule the content i18n follows — prefer the locale, fall back
 * to the source, never fail on an absent translation.
 */
export function translate(
  locale: SiteLocale,
  key: string,
  params: Record<string, string | number> = {},
): string {
  // An empty string counts as a gap, not as a translation into nothing — the
  // same rule the content i18n follows, and what `i18n:coverage` reports. `??`
  // alone would render the blank.
  const requested = MESSAGES[locale]?.[key];
  const template =
    requested !== undefined && requested !== '' ? requested : MESSAGES[DEFAULT_LOCALE]?.[key];
  if (template === undefined) {
    throw new Error(`Missing ${DEFAULT_LOCALE} translation: ${key}`);
  }

  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in params ? String(params[name]) : whole,
  );
}
