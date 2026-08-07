import type { AppType } from '@mia/server/types';
import { env } from '$env/dynamic/public';
import { hc } from 'hono/client';

// Deliberately NOT PUBLIC_API_URL — that is where the API lives, and the dev
// proxy in vite.config.ts already points at it. The browser wants a *relative*
// base so /api stays same-origin and the lax session cookie is actually sent.
// Only set this when the admin is served from a different origin than the API,
// which also needs AUTH_COOKIE_SAMESITE="none" and an entry in CORS_ORIGINS.
const baseUrl = env.PUBLIC_ADMIN_API_URL ?? '';

/** Same typed RPC client the website uses. Empty base URL → Vite proxies /api. */
export const api = hc<AppType>(baseUrl, {
  init: { credentials: 'include' },
});

/**
 * `amount` is the wire's decimal string ("35.00") — never parse it into a
 * number for arithmetic; this only hands it to Intl for display.
 */
export function formatMoney(amount: string, currency = 'EUR', locale = 'it-IT') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(amount));
}

/** Prefix a stored media path with the public CDN base. */
export function mediaUrl(path: string): string {
  const base = env.PUBLIC_MEDIA_BASE_URL ?? '';
  return base ? `${base.replace(/\/$/, '')}/${path}` : `/${path}`;
}
