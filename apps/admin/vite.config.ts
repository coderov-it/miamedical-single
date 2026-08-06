import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit(), tailwindcss()],

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.PUBLIC_API_URL ?? 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },

  build: {
    sourcemap: true,
  },
});
