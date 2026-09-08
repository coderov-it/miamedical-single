/**
 * `/sitemap.xml` — every indexable URL, in every language it exists in.
 *
 * A route declaration only. What goes in it and why lives in `lib/sitemap.ts`.
 */
import type { APIRoute } from 'astro';

import { renderSitemap, sitemapSets } from '~/lib/sitemap';

export const prerender = false;

export const GET: APIRoute = async ({ site, url }) => {
  const origin = (site ?? new URL(url.origin)).href;
  const xml = renderSitemap(await sitemapSets(origin), origin);

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      /* Matches SITEMAP_POLICY: an hour fresh, then served stale while the walk
         behind it refreshes. Nothing here is per-visitor. */
      'cache-control': 'public, max-age=3600, stale-while-revalidate=21600',
    },
  });
};
