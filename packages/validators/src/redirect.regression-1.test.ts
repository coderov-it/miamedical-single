// Regression: QA-001 — the post-sign-in `next` guard let `/\host` and `/<tab>/host` through (open redirect)
// Found by /qa on 2026-10-04
// Report: ~/.gstack/projects/coderov-it-miamedical-single/qa-reports/run-20261004T080925Z/

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { safeRedirectPath } from './redirect.ts';

const FALLBACK = '/area-clienti/';

describe('safeRedirectPath', () => {
  it('keeps a same-site path with its query and hash', () => {
    assert.equal(
      safeRedirectPath('/area-clienti/ordini/?page=2#top', FALLBACK),
      '/area-clienti/ordini/?page=2#top',
    );
  });

  it('falls back when there is no next', () => {
    assert.equal(safeRedirectPath(null, FALLBACK), FALLBACK);
    assert.equal(safeRedirectPath('', FALLBACK), FALLBACK);
  });

  /* Each of these is what a browser resolves to http://evil.example/ — most of
     them while still starting with a single slash. */
  for (const raw of [
    '//evil.example',
    '/\\evil.example',
    '/\t/evil.example',
    '/\n/evil.example',
    'https://evil.example/area-clienti/',
    'javascript:alert(1)',
  ]) {
    it(`refuses ${JSON.stringify(raw)}`, () => {
      assert.equal(safeRedirectPath(raw, FALLBACK), FALLBACK);
    });
  }
});
