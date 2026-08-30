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
import { localeForRequest, publicPathForRequest, renderWithLocale } from '~/lib/i18n';
import { routePaths, type RouteKey } from '~/lib/routes';

const ENGLISH_STATIC_PATHS = new Map<string, string>(
  (Object.keys(routePaths.en) as RouteKey[]).map((key) => [routePaths.en[key], routePaths.it[key]]),
);

const ITALIAN_STATIC_PATHS = new Set<string>(Object.values(routePaths.it));

/**
 * English slugs stripped of their prefix — `/en/search/` leaves `/search/`.
 * Requesting one of these unprefixed is a mistake, not a route, and gets a 404.
 *
 * MINUS the Italian routes, and that subtraction is the whole point. Four paths
 * are spelled identically in both languages — `/checkout/`, `/blog/`,
 * `/privacy-policy/`, `/cookie-policy/` — so stripping `/en/` from the English
 * ones produced the real Italian routes, and this set 404'd them on the Italian
 * storefront. The checkout among them: the cart's own "vai alla conferma" led
 * to a 404 (owner, 2026-08-30).
 */
const UNPREFIXED_ENGLISH_PATHS = new Set(
  [...ENGLISH_STATIC_PATHS.keys()]
    .filter((path) => path !== '/en/')
    .map((path) => path.replace(/^\/en/, ''))
    .filter((path) => !ITALIAN_STATIC_PATHS.has(path)),
);

function notFound(): Response {
  return new Response(null, { status: 404 });
}

/**
 * The locale lives in the URL, never in a cookie or the browser preference.
 *
 * English routes are rewritten internally to the existing Italian Astro route
 * declarations. `locals` retains the public English path and the selected
 * locale, so pages render English data and canonical English URLs without
 * duplicating every page file. A route that is not explicitly mapped is a 404.
 */
function sourcePathForEnglish(pathname: string): string | null {
  const staticPath = ENGLISH_STATIC_PATHS.get(pathname);
  if (staticPath) return staticPath;

  const product = /^\/en\/product\/([^/]+)\/$/.exec(pathname);
  if (product) return `/prodotto/${product[1]}/`;

  const post = /^\/en\/blog\/([^/]+)\/$/.exec(pathname);
  if (post) return `/blog/${post[1]}/`;

  /* Published legal documents are data-driven. Their English slug is verified
     by the document page itself before it renders. */
  const terms = /^\/en\/([^/]+)\/$/.exec(pathname);
  if (terms) {
    const italianCandidate = `/${terms[1]}/`;
    if (!ITALIAN_STATIC_PATHS.has(italianCandidate)) return italianCandidate;
  }

  return null;
}

export const onRequest = defineMiddleware(async (context, next) => {
  let rewriteTarget: string | undefined;

  if (!context.locals.locale) {
    const inheritedPath = publicPathForRequest();
    if (inheritedPath) {
      context.locals.locale = localeForRequest();
      context.locals.publicPath = inheritedPath;
    }
  }

  if (!context.locals.locale) {
    const { pathname, search } = context.url;

    if (pathname === '/it/' || pathname.startsWith('/it/')) return notFound();

    if (pathname === '/en/' || pathname.startsWith('/en/')) {
      const sourcePath = sourcePathForEnglish(pathname);
      if (!sourcePath) return notFound();

      context.locals.locale = 'en';
      context.locals.publicPath = pathname;
      rewriteTarget = `${sourcePath}${search}`;
    } else {
      /* A translated English slug without its `/en/` prefix is never an Italian
         route, even when it looks like a legal-document slug. */
      if (UNPREFIXED_ENGLISH_PATHS.has(pathname)) return notFound();

      context.locals.locale = 'it';
      context.locals.publicPath = pathname;
    }
  }

  return renderWithLocale(
    context.locals.locale,
    context.locals.publicPath ?? context.url.pathname,
    async () => {
      const response = rewriteTarget ? await next(rewriteTarget) : await next();
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
    },
  );
});
