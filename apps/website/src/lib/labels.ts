/**
 * Checkout and cart messages are part of the storefront message catalog, not
 * TypeScript constants.
 *
 * The key type comes from `it.json` alone, because that is the source language:
 * it is the catalogue every other locale is checked against, and the only one
 * `translate()` throws for. A target locale with a gap falls back rather than
 * failing, so `pnpm --filter @mia/website run i18n:coverage` is what reports
 * one — not the type system.
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
