import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';

const site = process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321';

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

  vite: {
    server: {
      // Keep the API on its own origin in dev so CORS/cookies match production.
      proxy: {
        '/api': {
          target: process.env.PUBLIC_API_URL ?? 'http://localhost:8787',
          changeOrigin: true,
        },
      },
    },
  },
});
