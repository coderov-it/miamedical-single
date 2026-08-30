/**
 * Checkout and cart messages are part of the storefront message catalog, not
 * TypeScript constants. Both `it.json` and `en.json` carry every key so server
 * rendering fails loudly during development when a translation is missing.
 */
import it from '~/i18n/it.json';

import { localeForRequest, translate, type SiteLocale } from './i18n.ts';

export type StorefrontLabelKey = keyof typeof it & string;

export function t(
  key: StorefrontLabelKey,
  params?: Record<string, string | number>,
  locale: SiteLocale = localeForRequest(),
): string {
  return translate(locale, key, params);
}
