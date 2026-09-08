/**
 * The sitemap's URL sets, one entry per piece of content and one path per
 * language it really exists in.
 *
 * Why this app builds its own instead of using `@astrojs/sitemap`: every page
 * here is `prerender = false`, and the integration can only emit routes it sees
 * at build time. It would never have found `/en/*` or `/fr/*` at all — there is
 * no `pages/en/` directory, a prefixed URL is a middleware rewrite onto the
 * source-language route declaration (see `middleware.ts`).
 *
 * The rule every entry follows: **a URL is listed for a locale only when that
 * locale's content actually exists.** A product with no French translation
 * renders at `/fr/produit/<slug>/` — with Italian words in it — so listing that
 * URL would ask Google to index the same text twice. It is the same honesty the
 * header's switcher applies, from the same signal (`availableLocales`).
 *
 * Full reasoning, including the `xhtml:link` shape: docs/code/storefront-languages.md.
 */
import { listBlogPosts } from './blog.ts';
import { type CachePolicy, cached } from './cache.ts';
import { listAllProducts } from './catalog.ts';
import { LOCALES, SOURCE_LANGUAGE, type SiteLocale } from './i18n.ts';
import {
  blogPostPath,
  PRIVATE_ROUTES,
  productPath,
  type RouteKey,
  routePaths,
} from './routes.ts';

/**
 * One piece of content, in every language it exists in.
 *
 * It is a SET rather than a URL because that is what the sitemap has to say:
 * each language version gets its own `<url>` entry carrying the whole set as
 * `xhtml:link` alternates, so a crawler that finds one finds all of them.
 */
export interface LanguageSet {
  paths: Partial<Record<SiteLocale, string>>;
  /** Only ever a real timestamp. A guessed `<lastmod>` is worse than none. */
  lastmod?: string | undefined;
}

/**
 * Route keys that are pages a search engine should hold.
 *
 * `PRIVATE_ROUTES` is the cart, the checkout and the whole customer area — the
 * same list that makes them `noindex`, finally consumed by something. The other
 * two exclusions are not privacy:
 *
 *   • `search` — `/cerca/` is a results page and renders `noindex`.
 *   • `product` — `/prodotto/` is the base path of `[slug].astro`, not a page.
 */
const EXCLUDED_ROUTES = new Set<RouteKey>([...PRIVATE_ROUTES, 'search', 'product']);

/**
 * The static pages, in all three languages.
 *
 * Their chrome is fully translated (`pnpm --filter @mia/website run
 * i18n:coverage` reports 100% per locale), so unlike a product every locale's
 * version is genuinely its own page.
 */
export function staticSets(): LanguageSet[] {
  const keys = (Object.keys(routePaths[SOURCE_LANGUAGE]) as RouteKey[]).filter(
    (key) => !EXCLUDED_ROUTES.has(key),
  );
  return keys.map((key) => ({
    paths: Object.fromEntries(LOCALES.map((locale) => [locale, routePaths[locale][key]])),
  }));
}

/**
 * Every published product, per locale, keyed by product id.
 *
 * The catalogue is walked once per language rather than once in total, because
 * a translated product has its OWN slug — `/fr/produit/<slug-fr>/` is not the
 * Italian path with a prefix. `sort: 'title'` because `newest` orders by
 * `created_at` alone and this catalogue was seeded in bulk, so its pages are
 * not a stable walk (see `listAllProducts`).
 */
async function productSets(): Promise<LanguageSet[]> {
  const sets = new Map<string, LanguageSet>();

  for (const locale of LOCALES) {
    const { items } = await listAllProducts({ sort: 'title' }, locale);
    for (const product of items) {
      if (!product.availableLocales.includes(locale)) continue;
      const set = sets.get(product.id) ?? { paths: {}, lastmod: product.updatedAt };
      set.paths[locale] = productPath(product.slug, {}, locale);
      sets.set(product.id, set);
    }
  }

  return [...sets.values()];
}

/** Every published post, per locale. Same rule, same reason as products. */
async function blogSets(): Promise<LanguageSet[]> {
  const sets = new Map<string, LanguageSet>();

  for (const locale of LOCALES) {
    for (let page = 1; ; page += 1) {
      const { data, meta } = await listBlogPosts({ page, perPage: 100 }, locale);
      for (const post of data) {
        if (!post.availableLocales.includes(locale)) continue;
        const set = sets.get(post.id) ?? { paths: {}, lastmod: post.publishedAt ?? undefined };
        set.paths[locale] = blogPostPath(post.slug, locale);
        sets.set(post.id, set);
      }
      if (page >= meta.pageCount) break;
    }
  }

  return [...sets.values()];
}

/**
 * An hour fresh, six more served stale while a refresh runs behind it.
 *
 * A sitemap is read by crawlers, not customers, and it costs a full catalogue
 * walk per language — so it is the one read in this app that must not happen
 * per request. Longer than `CATALOG_POLICY` for the same reason: nobody is
 * waiting on it, and a product published five minutes ago is found through the
 * catalogue page long before a crawler re-reads this.
 */
const SITEMAP_POLICY: CachePolicy = { fresh: 3600, stale: 21600 };

/**
 * What is NOT in here, and why it is not a bug:
 *
 * A legal document published from the admin under its own slug — `[terms].astro`
 * serves any of them — cannot be enumerated, because the public API has no list
 * endpoint for terms, only `GET /api/terms/:slug`. The three the footer links
 * unconditionally (privacy, cookie, terms) are route keys, so they are already
 * in `staticSets()`. A fourth document would need `GET /api/terms` first.
 */
export function sitemapSets(origin: string): Promise<LanguageSet[]> {
  return cached(
    `sitemap:${origin}`,
    async () => {
      const [products, posts] = await Promise.all([productSets(), blogSets()]);
      return [...staticSets(), ...products, ...posts];
    },
    SITEMAP_POLICY,
  );
}

// --- XML ---------------------------------------------------------------------

const escapeXml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;',
    };
    return entities[character] ?? character;
  });

/**
 * One `<url>` per language version, each carrying the COMPLETE alternate set
 * including itself — that self-reference is what Google's i18n sitemap format
 * requires, and a set that omits it is ignored rather than half-read.
 *
 * `hreflang` is the registry `code` (`fr`), never the `tag` (`fr-FR`), for the
 * reason `BaseLayout` gives: a region subtag targets a country. `x-default` is
 * the source language — what a visitor who reads none of ours should get.
 *
 * No `<changefreq>` and no `<priority>`: Google ignores both, and a number
 * nobody reads is a number nobody maintains.
 */
export function renderSitemap(sets: readonly LanguageSet[], origin: string): string {
  const absolute = (path: string): string => new URL(path, origin).href;
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' +
      ' xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ];

  for (const set of sets) {
    const present = LOCALES.filter((locale) => set.paths[locale] !== undefined);
    const alternates = present.length > 1 ? present : [];

    for (const locale of present) {
      lines.push('  <url>');
      lines.push(`    <loc>${escapeXml(absolute(set.paths[locale] as string))}</loc>`);
      if (set.lastmod) lines.push(`    <lastmod>${escapeXml(set.lastmod)}</lastmod>`);
      for (const alternate of alternates) {
        const href = escapeXml(absolute(set.paths[alternate] as string));
        lines.push(`    <xhtml:link rel="alternate" hreflang="${alternate}" href="${href}" />`);
      }
      if (alternates.includes(SOURCE_LANGUAGE)) {
        const href = escapeXml(absolute(set.paths[SOURCE_LANGUAGE] as string));
        lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${href}" />`);
      }
      lines.push('  </url>');
    }
  }

  lines.push('</urlset>');
  return lines.join('\n');
}
