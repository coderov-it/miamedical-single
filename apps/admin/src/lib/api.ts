import type { AppType } from '@mia/server/types';
import { env } from '$env/dynamic/public';
import { hc } from 'hono/client';

import { uiLang } from '~/lib/ui-lang.svelte';

/**
 * The one place the API origin is named. Absolute on purpose: the admin builds
 * to a static folder that must run from any host without a `/api` routing rule
 * in front of it, so nothing here may assume same-origin.
 *
 * Cookies survive the cross-origin call because SameSite is computed on the
 * *site* (registrable domain + scheme) and ports are not part of a site — dev
 * on :5173 → :8787 is same-site, and so are two subdomains of one domain in
 * production. Only a genuinely different domain needs AUTH_COOKIE_SAMESITE
 * ="none"; either way the origin must be listed in CORS_ORIGINS.
 */
export const API_BASE = env.PUBLIC_API_URL ?? 'http://localhost:8787';

/** `apiUrl('/api/media/upload')`. Base carries no trailing slash, path leads with one. */
export function apiUrl(path: string): string {
  return API_BASE + path;
}

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

/** Same typed RPC client the website uses, pointed at API_BASE. */
export const api = hc<AppType>(API_BASE, {
  init: { credentials: 'include' },
  fetch: localeAwareFetch,
});

// `formatMoney` lives in ./format.ts with the rest of the display helpers.

/** CDN origin for stored media. No trailing slash — stored paths are bare R2 keys. */
export const MEDIA_BASE = env.PUBLIC_MEDIA_BASE_URL ?? '';

/** Prefix a stored media path with the public CDN base. */
export function mediaUrl(path: string): string {
  return `${MEDIA_BASE}/${path}`;
}
