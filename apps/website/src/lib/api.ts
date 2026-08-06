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

export function formatMoney(cents: number, currency = 'USD', locale = 'en-US') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}
