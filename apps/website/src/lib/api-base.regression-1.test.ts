// Regression: production checkout and payment-result pages called http://localhost:8787
// Found on 2026-11-17: `data-api-base={API_BASE}` was rendered during SSR, where
// API_BASE is LAN_API_URL, so visitors' browsers were handed the server's LAN origin.
//
// Rule: an `.astro` file may use `API_BASE` / `apiUrl()` only inside a client
// `<script>` (bundled for the browser, where it is the public origin). Anything the
// server writes into HTML uses `PUBLIC_API_URL`.

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const SRC = new URL('../', import.meta.url).pathname;

function astroFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return astroFiles(full);
    return entry.name.endsWith('.astro') ? [full] : [];
  });
}

/** The file with every client `<script>` block removed — what SSR renders. */
function serverPart(source: string): string {
  return source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
}

describe('API origin in server-rendered HTML', () => {
  it('no .astro file hands API_BASE / apiUrl() to the browser outside a <script>', () => {
    const offenders = astroFiles(SRC).filter((file) =>
      /\bAPI_BASE\b|\bapiUrl\(/.test(serverPart(readFileSync(file, 'utf8'))),
    );
    assert.deepEqual(
      offenders,
      [],
      `use PUBLIC_API_URL for browser-visible values in: ${offenders.join(', ')}`,
    );
  });
});
