import { perUnitLabel } from '@mia/i18n';
import type { AppType } from '@mia/server/types';
import type { LanguageCode } from '@mia/validators';
import { hc } from 'hono/client';

/** The one place the API origin is named. Same variable the admin reads. */
export const API_BASE = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:8787';

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
  price: string;
}

/**
 * The storefront is Italian-only, so the content language is a constant rather
 * than a request value. It is passed explicitly all the same: the label catalog
 * takes a `LanguageCode`, so adding an English storefront later is a matter of
 * threading a value through, not of hunting down hardcoded Italian.
 */
const LOCALE: LanguageCode = 'it';

/** "35,00 € al giorno" or "35,00 €" — the flat pricing envelope, rendered. */
export function formatPricing(pricing: Pricing, locale = 'it-IT'): string {
  const amount = formatMoney(pricing.price, pricing.currency, locale);
  if (pricing.mode !== 'rental') return amount;
  const unit = perUnitLabel(pricing.rentalUnit, LOCALE);
  return unit ? `${amount} ${unit}` : amount;
}

/**
 * The price line for a card or a hero badge.
 *
 * Rentals read "da 35,00 € al giorno" — the amount is a starting rate, because
 * variants and add-ons can raise it. A fixed-price product shows its price with
 * no qualifier, where "da" would be wrong.
 */
export function cardPrice(pricing: Pricing): { prefix: string; text: string } | null {
  if (!pricing?.price) return null;
  return {
    prefix: pricing.mode === 'rental' ? 'da' : '',
    text: formatPricing(pricing),
  };
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
export function availabilityLabel(inStock: boolean): string {
  return inStock ? 'Disponibile' : 'Non disponibile';
}
