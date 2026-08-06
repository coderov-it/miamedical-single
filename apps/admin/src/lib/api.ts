import type { AppType } from '@mia/server/types';
import { hc } from 'hono/client';

const baseUrl = import.meta.env.VITE_API_URL ?? '';

/** Same typed RPC client the website uses. Empty base URL → Vite proxies /api. */
export const api = hc<AppType>(baseUrl, {
  init: { credentials: 'include' },
});

export function formatMoney(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}
