import { fileURLToPath } from 'node:url';

import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * The admin is a static SPA: no server rendering, no server routes, no Node
 * process at runtime. `ssr = false` lives in `src/routes/+layout.ts`; this file
 * only decides what the build emits.
 *
 * @type {import('@sveltejs/kit').Config}
 */
export default {
  preprocess: vitePreprocess(),

  kit: {
    // `fallback` is what makes it an SPA — every unmatched path is served
    // index.html and the client router takes over. `dist` rather than the
    // default `build` keeps turbo.json's "outputs": ["dist/**"] accurate.
    adapter: adapter({ pages: 'dist', assets: 'dist', fallback: 'index.html' }),

    // SvelteKit 2 warns on tsconfig `paths`, so `~` is declared here and
    // code-generated into .svelte-kit/tsconfig.json for both Vite and tsc.
    alias: { '~': 'src' },

    // The one `.env` lives at the monorepo root; this app has none of its own.
    // Kit reads env through `kit.env.dir` (default `process.cwd()`) and ignores
    // Vite's `envDir` entirely — so this, not vite.config.ts, is the knob.
    // Without it `$env/dynamic/public` is empty, `mediaUrl()` falls back to a
    // same-origin path, and every uploaded image 404s.
    env: { dir: fileURLToPath(new URL('../../', import.meta.url)) },
  },
};
