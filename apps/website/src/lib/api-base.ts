/**
 * The API origin, and nothing else.
 *
 * THIS MODULE IMPORTS NOTHING, and it must stay that way — it is the
 * `cart-store.ts` of the API origin. `api.ts` is its neighbour and is not
 * shippable: its module scope calls `hc<AppType>()` and it imports
 * `@mia/i18n` and `~/lib/i18n`, which reaches `node:async_hooks` and the four
 * locale catalogues. Any client module that wanted `API_BASE` used to import
 * it from there and dragged all of that into the browser with it — 5.6 KB of
 * server graph on every account page, invisible because the grep in
 * docs/code/storefront-cart.md looks for `hono`, a name minification erases.
 *
 * `api.ts` re-exports both of these, so nothing that already imported them
 * from there had to change.
 */

/** The one place the API origin is named. Same variable the admin reads. */
const PUBLIC_API_URL = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:8787';

/**
 * During SSR the backend can be reached over the LAN instead of its public
 * origin, skipping DNS, TLS and the reverse proxy. `LAN_API_URL` is read from
 * `process.env` at runtime because the Node adapter loads no `.env` file — set
 * it in the service's process environment (systemd unit), not at build.
 * `import.meta.env.SSR` is statically `false` in the client bundle, so Vite
 * replaces this whole expression with `undefined` and `process` never ships.
 * Unset, SSR falls back to the public origin.
 */
const LAN_API_URL = import.meta.env.SSR ? process.env.LAN_API_URL : undefined;

export const API_BASE = LAN_API_URL ?? PUBLIC_API_URL;

/** `apiUrl('/api/products')`. Base carries no trailing slash, path leads with one. */
export function apiUrl(path: string): string {
  return API_BASE + path;
}
