/**
 * Static SPA, top to bottom.
 *
 * `ssr = false` keeps everything in the browser, which is what lets the auth
 * conditionals read the client-side `session` singleton directly.
 * `prerender = false` stops the adapter crawling routes; the
 * `fallback: 'index.html'` in svelte.config.js is the whole output.
 *
 * No `load` here on purpose — access control is a plain conditional in the
 * layout and page components, not a load-time hook.
 */
export const ssr = false;
export const prerender = false;
