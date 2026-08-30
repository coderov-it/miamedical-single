import { perUnitLabel } from '@mia/i18n';
import type { AppType } from '@mia/server/types';
import type { LanguageCode } from '@mia/validators';
import { hc } from 'hono/client';

import type { SiteLocale } from './i18n.ts';

/** The one place the API origin is named. Same variable the admin reads. */
const PUBLIC_API_URL = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:8787';

/**
 * During SSR the backend can be reached over the LAN instead of its public
 * origin, skipping DNS, TLS and the reverse proxy. `LAN_API_URL` is read from
 * `process.env` at runtime because the Node adapter loads no `.env` file — set
 * it in the service's process environment (systemd unit), not at build.
 * `import.meta.env.SSR` is statically `false` in the client bundle, so this
 * branch never ships to the browser. Unset, SSR falls back to the public
 * origin and behaves exactly as before.
 */
const LAN_API_URL = import.meta.env.SSR ? process.env.LAN_API_URL : undefined;

export const API_BASE = LAN_API_URL ?? PUBLIC_API_URL;

/** `apiUrl('/api/products')`. Base carries no trailing slash, path leads with one. */
export function apiUrl(path: string): string {
  return API_BASE + path;
}

/**
 * End-to-end typed client generated from the Hono router. Route paths, params
 * and response shapes are all inferred — no codegen step, no duplicated DTOs.
 */
export const api = hc<AppType>(API_BASE, {
  init: { credentials: 'include' },
});

/**
 * `amount` is the wire's decimal string ("35.00") — exact all the way from
 * PostgreSQL `numeric`. Only Intl display parsing happens here, never
 * arithmetic.
 */
export function formatMoney(amount: string, currency = 'EUR', locale = 'it-IT') {
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
 * The storefront is Italian-only, so the content language is a constant rather
 * than a request value. It is passed explicitly all the same: the label catalog
 * takes a `LanguageCode`, so adding an English storefront later is a matter of
 * threading a value through, not of hunting down hardcoded Italian.
 */
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
  locale = 'it-IT',
  language: LanguageCode = 'it',
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
  locale = 'it-IT',
  language: LanguageCode = 'it',
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
  locale: SiteLocale = 'it',
): { prefix: string; text: string } | null {
  const prefix = pricing.mode === 'rental' ? (locale === 'it' ? 'da' : 'from') : '';
  const intl = locale === 'it' ? 'it-IT' : 'en-GB';
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

/** Localised availability label. The API returns a boolean, not UI copy. */
export function availabilityLabel(inStock: boolean, locale: SiteLocale = 'it'): string {
  if (locale === 'en') return inStock ? 'Available' : 'Unavailable';
  return inStock ? 'Disponibile' : 'Non disponibile';
}
