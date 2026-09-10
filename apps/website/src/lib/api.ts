import { perUnitLabel } from '@mia/i18n';
import type { AppType } from '@mia/server/types';
import type { LanguageCode } from '@mia/validators';
import { hc } from 'hono/client';

import { API_BASE, apiUrl } from './api-base.ts';
import type { SiteLocale } from './i18n.ts';
import { DEFAULT_LOCALE, localeTag, translate } from '~/lib/i18n';

/**
 * The API origin lives in `api-base.ts`, which imports nothing, and is
 * re-exported here so every existing `import { API_BASE } from '~/lib/api'`
 * still resolves. A CLIENT module must import it from `api-base.ts` directly:
 * this file's module scope calls `hc()` and pulls in `@mia/i18n`, so importing
 * `API_BASE` from here ships the whole server graph to the browser. See
 * docs/code/storefront-cart.md § bundle hygiene.
 */
export { API_BASE, apiUrl };

/**
 * End-to-end typed client generated from the Hono router. Route paths, params
 * and response shapes are all inferred — no codegen step, no duplicated DTOs.
 */
export const api = hc<AppType>(API_BASE, {
  init: { credentials: 'include' },
});

/** The BCP-47 tags the storefront formats in — `localeTag()`'s return type. */
/**
 * A BCP 47 tag for `Intl`. Was the literal union `'it-IT' | 'en-GB'`, which
 * every new language had to be added to by hand; it is now whatever the
 * registry says, resolved through `localeTag`.
 */
export type IntlLocale = string;

/**
 * `amount` is the wire's decimal string ("35.00") — exact all the way from
 * PostgreSQL `numeric`. Only Intl display parsing happens here, never
 * arithmetic.
 *
 * `locale` is REQUIRED, and every money helper below follows it. It used to
 * default to `it-IT`, which meant a caller that simply forgot it printed
 * "1843,00 €" — correct on the Italian storefront, and silently wrong on the
 * English one, where it sat next to "€1,843.00" from a caller that remembered.
 * A default that is right on the default locale hides the bug on exactly the
 * pages nobody is looking at (owner, 2026-08-30).
 */
export function formatMoney(amount: string, currency: string, locale: IntlLocale) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(amount));
}

export interface Pricing {
  mode: string;
  rentalUnit: 'hour' | 'day' | null;
  currency: string;
  /** What a fixed product costs. `null` on a rental — its packages are the price. */
  price: string | null;
  /** A rental's headline rate. Copy, never priced. `null` on a fixed product. */
  marketingRate: string | null;
  /** The lowest real figure: the price, or the cheapest package. */
  fromPrice: string | null;
}

/**
 * "9,00 € al giorno" or "60,00 €" — an amount with the unit it is quoted in.
 *
 * `rentalUnit` is `null` for anything charged once, which is what makes this
 * usable for both a product's headline rate and an add-on's price.
 */
export function formatRate(
  amount: string,
  currency: string,
  rentalUnit: 'hour' | 'day' | null,
  locale: IntlLocale,
  language: LanguageCode,
): string {
  const money = formatMoney(amount, currency, locale);
  if (!rentalUnit) return money;
  const unit = perUnitLabel(rentalUnit, language);
  return unit ? `${money} ${unit}` : money;
}

/**
 * The product's price line — "35,00 € al giorno" or "289,00 €".
 *
 * On a rental the figure is `marketingRate`, which is COPY: the back office typed
 * it and no total is computed from it. That is exactly why it can sit under a
 * title where no package has been chosen — it advertises, it does not quote.
 * `null` when a rental advertises no rate; callers fall back to `fromPrice`.
 */
export function formatPricing(
  pricing: Pricing,
  locale: IntlLocale,
  language: LanguageCode,
): string | null {
  if (pricing.mode !== 'rental') {
    return pricing.price === null ? null : formatMoney(pricing.price, pricing.currency, locale);
  }
  if (pricing.marketingRate === null) return null;
  return formatRate(pricing.marketingRate, pricing.currency, pricing.rentalUnit, locale, language);
}

/**
 * The price line for a card or a hero badge.
 *
 * Rentals read "da 35,00 € al giorno" — the rate is a starting point, and on a
 * rental it is the marketing rate rather than anything the customer will be
 * charged. A fixed-price product shows its price with no qualifier, where "da"
 * would be wrong.
 *
 * With no rate typed it falls back to `fromPrice`, the cheapest package: "da
 * 89,00 €" still tells the customer where the product sits, and a listing that
 * shows no price at all tells them nothing.
 */
export function cardPrice(
  pricing: Pricing,
  locale: SiteLocale,
): { prefix: string; text: string } | null {
  const prefix = pricing.mode === 'rental' ? translate(locale, 'card.priceFrom') : '';
  const intl: IntlLocale = localeTag(locale);
  const text = formatPricing(pricing, intl, locale);
  if (text) return { prefix, text };
  if (pricing.fromPrice === null) return null;
  return { prefix, text: formatMoney(pricing.fromPrice, pricing.currency, intl) };
}

/** Major-unit decimal string for schema.org `Offer.price`, always dot-separated. */
export function offerPrice(amount: string): string {
  return Number(amount).toFixed(2);
}

/** CDN origin for stored media. No trailing slash — stored paths are bare R2 keys. */
export const MEDIA_BASE = import.meta.env.PUBLIC_MEDIA_BASE_URL ?? '';

/** Media paths are bare object-storage keys — the client prepends the CDN base. */
export function mediaUrl(path: string): string {
  return `${MEDIA_BASE}/${path}`;
}

/**
 * Localised availability label. The API returns a boolean, not UI copy.
 *
 * The strings live in the message catalogue rather than in a ternary here, so a
 * new language gets them the same way it gets every other word on the page.
 */
export function availabilityLabel(inStock: boolean, locale: SiteLocale = DEFAULT_LOCALE): string {
  return translate(locale, inStock ? 'card.available' : 'card.unavailable');
}
