/**
 * HTTP cache semantics for on-demand pages — what the *shared* caches in front
 * of the website (Cloudflare, or an nginx `proxy_cache` if one is ever added)
 * are allowed to do with a rendered page.
 *
 * Deliberately split from `cache.ts`: that one caches data inside this process,
 * this one describes the response. See docs/code/storefront-caching.md.
 */
import { createHash } from 'node:crypto';

export interface HtmlCachePolicy {
  /** Seconds a shared cache may serve the page without asking us again. */
  sMaxAge: number;
  /** Seconds past `sMaxAge` it may serve the stale copy while it refetches behind. */
  staleWhileRevalidate: number;
  /** Seconds it may keep serving the stale copy while we are erroring or down. */
  staleIfError: number;
}

/**
 * A page whose HTML is the same for every visitor. `max-age=0` keeps browsers
 * revalidating — they get a 304 from `entityTag()` below, which is cheap — while
 * `s-maxage` is the only number a shared cache reads.
 *
 * `sMaxAge` is the tail of the 5-minute staleness budget that `CATALOG_POLICY`
 * in `cache.ts` spends the rest of: 240 s there plus 60 s here. Raising one
 * means lowering the other.
 */
export const PUBLIC_PAGE: HtmlCachePolicy = {
  sMaxAge: 60,
  staleWhileRevalidate: 300,
  staleIfError: 86400,
};

export function cacheHtml(headers: Headers, policy: HtmlCachePolicy = PUBLIC_PAGE): void {
  headers.set(
    'cache-control',
    [
      'public',
      'max-age=0',
      'must-revalidate',
      `s-maxage=${policy.sMaxAge}`,
      `stale-while-revalidate=${policy.staleWhileRevalidate}`,
      `stale-if-error=${policy.staleIfError}`,
    ].join(', '),
  );
}

/**
 * Which responses the ETag middleware may touch.
 *
 * `public` in the Cache-Control is the gate, and it is set by `cacheHtml()`
 * alone — so a page that says `no-store` (cart, checkout, customer area) is
 * never buffered, never hashed, and keeps streaming.
 */
export function isPublicHtml(request: Request, response: Response): boolean {
  if (request.method !== 'GET') return false;
  if (response.status !== 200) return false;
  if (response.headers.get('content-type')?.includes('text/html') !== true) return false;
  return response.headers.get('cache-control')?.includes('public') === true;
}

/** A strong entity tag over the exact bytes we are about to send. */
export function entityTag(html: string): string {
  return `"${createHash('sha1').update(html).digest('base64url')}"`;
}

/**
 * `If-None-Match` is a comma-separated list, and any cache that re-encodes the
 * body downgrades a strong tag to `W/"…"`. Compare on the opaque part so a
 * gzipping proxy in front of us does not silently cost every visitor a 200.
 */
export function matchesEntityTag(header: string | null, etag: string): boolean {
  if (header === null) return false;
  const opaque = (tag: string) => tag.trim().replace(/^W\//, '');
  return header.split(',').some((candidate) => opaque(candidate) === opaque(etag));
}
