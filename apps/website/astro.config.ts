import { fileURLToPath } from 'node:url';

import node from '@astrojs/node';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
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
   * Every locale is rendered on the server. The strict English route map
   * rewrites only the route declaration, while its locale and public path stay
   * in middleware locals for the page render.
   */
  output: 'server',
  adapter: node({ mode: 'standalone' }),

  /**
   * Svelte is here for the islands. Two of them: the cart
   * (`components/cart/`, docs/code/storefront-cart.md) and the customer area
   * (`components/account/`, docs/code/storefront-account-island.md). Every
   * other page is server-rendered HTML plus small inline scripts.
   *
   * No `@astrojs/sitemap` either: it can only list routes it sees at build
   * time, and every page here is `prerender = false` — so it emitted nothing,
   * and could never have found `/en/*` or `/fr/*`, which exist as middleware
   * rewrites rather than as page files. `pages/sitemap.xml.ts` replaces it.
   */
  integrations: [svelte()],

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

    /**
     * Tailwind v4 has no config file: the whole design system lives in
     * `src/styles/app.css` as `@theme` tokens. See
     * docs/code/storefront-design-system.md.
     */
    plugins: [tailwindcss()],
  },

  server: {
    port: parseInt((process.env.WEB_PORT as string) || '4321'),
    host: (process.env.WEB_HOST as string) || '0.0.0.0',
  },
});
