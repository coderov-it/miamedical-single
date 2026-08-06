import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

const site = process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321';

export default defineConfig({
  site,

  /**
   * `static` is the default: every page is prerendered at build time unless it
   * opts out with `export const prerender = false`. That gives static-fast
   * marketing/PDP pages and on-demand SSR for cart, search and account — the
   * "SuperFast SSR" split, without an extra output mode.
   */
  output: 'static',
  adapter: node({ mode: 'standalone' }),

  integrations: [svelte(), sitemap()],

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },

  image: {
    // Allow remote product images from your CDN / object storage.
    domains: [],
    remotePatterns: [{ protocol: 'https' }],
  },

  vite: {
    plugins: [tailwindcss()],
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
