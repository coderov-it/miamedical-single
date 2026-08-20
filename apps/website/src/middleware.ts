/**
 * Conditional requests for on-demand pages.
 *
 * Prerendering used to give this away: a page served off disk carries an ETag
 * and a Last-Modified from the file itself, so a returning visitor got a 304
 * and no body. An SSR response has neither, and the home page is 53 KB — so
 * without this, every revalidation re-sends all of it.
 *
 * Only pages that opted into `cacheHtml()` are touched. Everything else —
 * cart, checkout, the customer area, every API route — passes straight through
 * and keeps streaming, because buffering a response to hash it is exactly what
 * you do not want on a page built from one person's request.
 */
import { defineMiddleware } from 'astro:middleware';

import { entityTag, isPublicHtml, matchesEntityTag } from '~/lib/http-cache';

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  if (!isPublicHtml(context.request, response)) return response;

  const html = await response.text();
  const etag = entityTag(html);
  response.headers.set('etag', etag);

  if (matchesEntityTag(context.request.headers.get('if-none-match'), etag)) {
    // A 304 carries the validators and the caching rules but no body, so the
    // length and encoding of the body it replaces must not travel with it.
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    headers.delete('content-encoding');
    return new Response(null, { status: 304, headers });
  }

  // The body is already buffered, so its length is free to state — and a
  // declared length beats chunked transfer for a cache storing the page.
  response.headers.set('content-length', String(Buffer.byteLength(html)));
  return new Response(html, { status: response.status, headers: response.headers });
});
