import { AsyncLocalStorage } from 'node:async_hooks';

import en from '~/i18n/en.json';
import it from '~/i18n/it.json';

export const LOCALES = ['it', 'en'] as const;
export type SiteLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: SiteLocale = 'it';

const MESSAGES: Record<SiteLocale, Record<string, string>> = { it, en };
interface RequestLanguageContext {
  locale: SiteLocale;
  publicPath: string;
}

const requestLocale = new AsyncLocalStorage<RequestLanguageContext>();

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

export function localeTag(locale: SiteLocale): 'it-IT' | 'en-GB' {
  return locale === 'it' ? 'it-IT' : 'en-GB';
}

export function openGraphLocale(locale: SiteLocale): 'it_IT' | 'en_GB' {
  return locale === 'it' ? 'it_IT' : 'en_GB';
}

export function translate(
  locale: SiteLocale,
  key: string,
  params: Record<string, string | number> = {},
): string {
  const template = MESSAGES[locale][key];
  if (template === undefined) throw new Error(`Missing ${locale} translation: ${key}`);

  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in params ? String(params[name]) : whole,
  );
}
