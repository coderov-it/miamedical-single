import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit(), tailwindcss()],

  // No dev proxy. The admin builds to a static folder that has to run from any
  // host, so `API_BASE` in src/lib/api.ts is absolute and dev calls the API the
  // same way the deployed build does — nothing here to diverge from.
  server: {
    port: 5173,
  },

  build: {
    sourcemap: true,
  },
});
