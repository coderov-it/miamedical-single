/**
 * `/robots.txt` — the sitemap pointer, and nothing a `noindex` already says.
 *
 * ⚠️ The private routes are deliberately NOT disallowed. Every one of them
 * already answers `noindex, follow` (see `PRIVATE_ROUTES` and `BaseLayout`), and
 * a crawler cannot read that header on a page it was forbidden to fetch — so
 * `Disallow` would leave a URL indexable from any inbound link while hiding the
 * one instruction that says otherwise. Pick one mechanism per URL; for these,
 * `noindex` is the right one.
 *
 * `/api/` is disallowed on the other grounds: it is not a page, it renders no
 * HTML, and there is nothing there for a crawler to keep.
 */
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = ({ site, url }) => {
  const origin = (site ?? new URL(url.origin)).href;
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    '',
    `Sitemap: ${new URL('/sitemap.xml', origin).href}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=86400',
    },
  });
};
