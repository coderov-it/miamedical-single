import type { AppType } from '@mia/server/types';
import { env } from '$env/dynamic/public';
import { hc } from 'hono/client';

import { uiLang } from '~/lib/ui-lang.svelte';

// Deliberately NOT PUBLIC_API_URL — that is where the API lives, and the dev
// proxy in vite.config.ts already points at it. The browser wants a *relative*
// base so /api stays same-origin and the lax session cookie is actually sent.
// Only set this when the admin is served from a different origin than the API,
// which also needs AUTH_COOKIE_SAMESITE="none" and an entry in CORS_ORIGINS.
const baseUrl = env.PUBLIC_ADMIN_API_URL ?? '';

/**
 * Reads follow the interface language: every admin GET carries
 * `?locale=<uiLang>` so endpoints that resolve display strings (list titles,
 * search scope) answer in the language the operator is browsing in. Endpoints
 * that return raw bilingual shapes ignore it. Writes are untouched — which
 * language a form *edits* is that form's own state, never a global.
 */
const localeAwareFetch: typeof fetch = (input, init) => {
  const request = new Request(input, init);
  if (request.method !== 'GET') return fetch(request);

  const url = new URL(request.url);
  if (!url.pathname.includes('/api/admin/') || url.searchParams.has('locale')) {
    return fetch(request);
  }

  url.searchParams.set('locale', uiLang.current);
  return fetch(new Request(url, request));
};

/** Same typed RPC client the website uses. Empty base URL → Vite proxies /api. */
export const api = hc<AppType>(baseUrl, {
  init: { credentials: 'include' },
  fetch: localeAwareFetch,
});

// `formatMoney` lives in ./format.ts with the rest of the display helpers.

/** Prefix a stored media path with the public CDN base. */
export function mediaUrl(path: string): string {
  const base = env.PUBLIC_MEDIA_BASE_URL ?? '';
  return base ? `${base.replace(/\/$/, '')}/${path}` : `/${path}`;
}
