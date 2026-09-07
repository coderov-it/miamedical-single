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
import {
  isLanguageCode,
  localeForRequest,
  LOCALES,
  publicPathForRequest,
  renderWithLocale,
  type SiteLocale,
  SOURCE_LANGUAGE,
} from '~/lib/i18n';
import { routePaths, type RouteKey } from '~/lib/routes';

/**
 * Prefixed path → the source-language Astro route it renders.
 *
 * One table per non-source locale, built from `routePaths`. There is no
 * `pages/en/` or `pages/fr/` directory: a prefixed request is rewritten onto the
 * Italian route declarations, and `locals` keeps the public path so canonical
 * URLs and hreflang stay in the requested language.
 *
 * This used to be a single `ENGLISH_STATIC_PATHS` map with `/en/` written into
 * four separate places. Each one was a language-shaped hole.
 */
const PREFIXED_PATHS = new Map<SiteLocale, Map<string, string>>(
  LOCALES.filter((locale) => locale !== SOURCE_LANGUAGE).map((locale) => [
    locale,
    new Map(
      (Object.keys(routePaths[SOURCE_LANGUAGE]) as RouteKey[]).map((key) => [
        routePaths[locale][key],
        routePaths[SOURCE_LANGUAGE][key],
      ]),
    ),
  ]),
);

const SOURCE_STATIC_PATHS = new Set<string>(Object.values(routePaths[SOURCE_LANGUAGE]));

/**
 * Translated slugs stripped of their prefix — `/en/search/` leaves `/search/`.
 * Requesting one of these unprefixed is a mistake, not a route, and gets a 404.
 *
 * MINUS the source-language routes, and that subtraction is the whole point.
 * Several paths are spelled identically in more than one language —
 * `/checkout/`, `/blog/`, `/privacy-policy/`, `/cookie-policy/` — so stripping
 * the prefix off the translated ones produced the real Italian routes, and this
 * set 404'd them on the Italian storefront. The checkout among them: the cart's
 * own "vai alla conferma" led to a 404 (owner, 2026-08-30).
 *
 * ⚠️ With three languages it must be the UNION across every non-source locale,
 * not a pairwise difference. A French slug that happens to match an Italian one
 * would otherwise slip through the same hole the English ones fell into.
 */
const UNPREFIXED_TRANSLATED_PATHS = new Set(
  [...PREFIXED_PATHS.values()]
    .flatMap((paths) => [...paths.keys()])
    .map((path) => path.replace(/^\/[a-z]{2}(?=\/)/, ''))
    .filter((path) => path !== '' && path !== '/' && !SOURCE_STATIC_PATHS.has(path)),
);

/** `/fr/produit/x/` → `fr`. The source language has no prefix, so it never matches. */
function localeFromPrefix(pathname: string): SiteLocale | undefined {
  const segment = /^\/([a-z]{2})(?:\/|$)/.exec(pathname)?.[1];
  if (!segment || !isLanguageCode(segment)) return undefined;
  return segment === SOURCE_LANGUAGE ? undefined : segment;
}

function notFound(): Response {
  return new Response(null, { status: 404 });
}

/**
 * The locale lives in the URL, never in a cookie or the browser preference.
 *
 * A prefixed route is rewritten internally to the existing source-language
 * Astro route declaration. A route that is not explicitly mapped is a 404 —
 * every language's URL space is closed, so a typo cannot render a page.
 */
function sourcePathFor(locale: SiteLocale, pathname: string): string | null {
  const table = PREFIXED_PATHS.get(locale);
  const staticPath = table?.get(pathname);
  if (staticPath) return staticPath;

  const prefix = `/${locale}`;
  const productBase = routePaths[locale].product;
  const product = pathname.startsWith(productBase)
    ? pathname.slice(productBase.length).replace(/\/$/, '')
    : null;
  if (product && !product.includes('/')) {
    return `${routePaths[SOURCE_LANGUAGE].product}${product}/`;
  }

  const blogBase = routePaths[locale].blog;
  const post = pathname.startsWith(blogBase)
    ? pathname.slice(blogBase.length).replace(/\/$/, '')
    : null;
  if (post && !post.includes('/')) {
    return `${routePaths[SOURCE_LANGUAGE].blog}${post}/`;
  }

  /* Published legal documents are data-driven. Their translated slug is
     verified by the document page itself before it renders. */
  const terms = new RegExp(`^${prefix}/([^/]+)/$`).exec(pathname);
  if (terms) {
    const sourceCandidate = `/${terms[1]}/`;
    if (!SOURCE_STATIC_PATHS.has(sourceCandidate)) return sourceCandidate;
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

    /* The source language is served unprefixed, so its own prefix is not a
       route — `/it/` must not become a second copy of the whole site. */
    if (pathname === `/${SOURCE_LANGUAGE}/` || pathname.startsWith(`/${SOURCE_LANGUAGE}/`)) {
      return notFound();
    }

    const prefixed = localeFromPrefix(pathname);
    if (prefixed) {
      const sourcePath = sourcePathFor(prefixed, pathname);
      if (!sourcePath) return notFound();

      context.locals.locale = prefixed;
      context.locals.publicPath = pathname;
      rewriteTarget = `${sourcePath}${search}`;
    } else {
      /* A translated slug without its prefix is never a source-language route,
         even when it looks like a legal-document slug. */
      if (UNPREFIXED_TRANSLATED_PATHS.has(pathname)) return notFound();

      context.locals.locale = SOURCE_LANGUAGE;
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
