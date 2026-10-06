// Regression: PUB-003 — the review score was a preformatted "4,9" on every locale
// Found by /qa on 2026-10-04
// Report: ~/.gstack/projects/coderov-it-miamedical-single/qa-reports/run-20261004T080925Z/

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatRating } from './rating.ts';

describe('formatRating', () => {
  it('writes a decimal comma for Italian, French and German', () => {
    assert.equal(formatRating(4.9, 'it-IT'), '4,9');
    assert.equal(formatRating(4.9, 'fr-FR'), '4,9');
    assert.equal(formatRating(4.9, 'de-DE'), '4,9');
  });

  it('writes a decimal point for English', () => {
    assert.equal(formatRating(4.9, 'en-GB'), '4.9');
  });

  it('keeps one decimal on a whole score', () => {
    assert.equal(formatRating(5, 'en-GB'), '5.0');
  });
});
