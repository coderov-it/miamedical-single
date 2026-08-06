import { isAbsolute } from 'node:path';
import { defineConfig } from 'rolldown';

/** `src/modules/products/service.ts` → chunk `products` */
const moduleChunk = (id: string) => /[\\/]src[\\/]modules[\\/]([^\\/]+)[\\/]/.exec(id)?.[1] ?? null;

/** `packages/db/src/client.ts` → chunk `@mia/db` */
const workspaceChunk = (id: string) => {
  const pkg = /[\\/]packages[\\/]([^\\/]+)[\\/]src[\\/]/.exec(id)?.[1];
  return pkg ? `@mia/${pkg}` : null;
};

export default defineConfig({
  input: ['src/index.ts'],
  platform: 'node',

  output: {
    dir: 'dist',
    format: 'esm',
    sourcemap: true,
    entryFileNames: '[name].js',
    chunkFileNames: '[name].js',
    // One chunk per business module, one per workspace package; the rest
    // (app, config, infra, shared) stays in the entry chunk. The workspace
    // group needs the higher priority, or modules claim `@mia/*` first as a
    // transitive dependency and inline a copy into every module chunk.
    codeSplitting: {
      minSize: 0,
      groups: [
        { name: workspaceChunk, priority: 10 },
        { name: moduleChunk, priority: 0 },
      ],
    },
  },

  /**
   * Bundle our own TypeScript — this app's `src/` and the `@mia/*` workspace
   * packages — and nothing else. Third-party imports stay as real bare imports
   * that Node resolves from node_modules at runtime.
   *
   * Corollary: because workspace source is inlined, its runtime dependencies
   * become direct imports of this bundle and must appear in this package's own
   * `dependencies` — hence `drizzle-orm` and `postgres`, which no file under
   * `src/` imports by name. `start` fails loudly if one is missing.
   */
  external(id) {
    if (id.startsWith('node:')) return true;
    if (id.startsWith('.') || isAbsolute(id)) return false;
    return !id.startsWith('@mia/');
  },

  treeshake: true,
});
