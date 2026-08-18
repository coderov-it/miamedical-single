/**
 * Starts the built website under the project's own variable names.
 *
 * The Node adapter reads only `PORT`/`HOST` and that is not configurable, so
 * this launcher translates `WEB_PORT`/`WEB_HOST` before the entry module loads
 * — the server binds during import, so the mapping must happen first.
 *
 * Both are required: a website that silently comes up on the adapter's default
 * port is a misconfiguration nothing would flag until the proxy 502s.
 */
const missing = ['WEB_PORT', 'WEB_HOST'].filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Refusing to start: ${missing.join(' and ')} not set. Set them in .env.`);
  process.exit(1);
}

process.env.PORT = process.env.WEB_PORT;
process.env.HOST = process.env.WEB_HOST;

await import('../apps/website/dist/server/entry.mjs');
