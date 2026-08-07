import type { AppType } from '@mia/server/types';
import { hc } from 'hono/client';

const baseUrl = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:8787';

/**
 * End-to-end typed client generated from the Hono router. Route paths, params
 * and response shapes are all inferred — no codegen step, no duplicated DTOs.
 */
export const api = hc<AppType>(baseUrl, {
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

/** "35.00 €" or "35.00 € / giorno" — the flat pricing envelope, rendered. */
export function formatPricing(
  pricing: { mode: string; rentalUnit: string | null; currency: string; price: string },
  locale = 'it-IT',
): string {
  const amount = formatMoney(pricing.price, pricing.currency, locale);
  if (pricing.mode !== 'rental' || !pricing.rentalUnit) return amount;
  const unit =
    locale === 'it-IT'
      ? pricing.rentalUnit === 'day'
        ? 'giorno'
        : 'ora'
      : pricing.rentalUnit;
  return `${amount} / ${unit}`;
}

/** Media paths are bare R2 keys — the client prepends the CDN base. */
export function mediaUrl(path: string): string {
  const base = import.meta.env.PUBLIC_MEDIA_BASE_URL ?? '';
  return base ? `${base.replace(/\/$/, '')}/${path}` : `/${path}`;
}
