import { fileURLToPath } from 'node:url';

import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';

const site = process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321';

/**
 * The one `.env` lives at the monorepo root; this app has none of its own.
 * Without this, `import.meta.env.PUBLIC_*` is empty and `mediaUrl()` silently
 * falls back to a same-origin path, so every stored image 404s.
 */
const envDir = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig({
  site,

  /**
   * `static` is the default: every page is prerendered at build time unless it
   * opts out with `export const prerender = false`. Marketing pages (home,
   * assistenza) are static; anything that reads live catalogue state, search
   * params or a request configuration (catalogue, product, cerca, carrello,
   * legal documents) renders on demand.
   */
  output: 'static',
  adapter: node({ mode: 'standalone' }),

  /**
   * Svelte stays available for islands. The storefront currently ships none:
   * the whole design is server-rendered HTML plus two small inline scripts
   * (the search suggestions panel and the quantity stepper).
   */
  integrations: [svelte(), sitemap()],

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },

  image: {
    // Product media is served from object storage / CDN.
    domains: [],
    remotePatterns: [{ protocol: 'https' }],
  },

  // No dev proxy: `api.ts` calls PUBLIC_API_URL absolutely, in the browser
  // and during SSR alike, so dev and production resolve the API identically.
  vite: {
    envDir,
  },
});
