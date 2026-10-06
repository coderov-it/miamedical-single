// Regression: PUB-014 — the PDP stacked the Italian package name over its translated duration ("7 giorni / 7 days")
// Found by /qa on 2026-10-04
// Report: ~/.gstack/projects/coderov-it-miamedical-single/qa-reports/run-20261004T080925Z/

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { rentalPackageName } from './package-name.ts';

describe('rentalPackageName', () => {
  const week = { name: { it: '7 giorni' }, duration: 7, unit: 'day' as const };

  it('keeps the Italian name in Italian', () => {
    assert.equal(rentalPackageName(week, 'it'), '7 giorni');
  });

  it('says the duration in the reader language when the name has no translation', () => {
    assert.equal(rentalPackageName(week, 'en'), '7 days');
    assert.equal(rentalPackageName(week, 'fr'), '7 jours');
    assert.equal(rentalPackageName(week, 'de'), '7 Tage');
  });

  it('prefers a translated name', () => {
    const named = { name: { it: 'Weekend', en: 'Weekend break' }, duration: 2, unit: 'day' as const };
    assert.equal(rentalPackageName(named, 'en'), 'Weekend break');
  });

  it('treats a blank translation as missing', () => {
    const blank = { name: { it: '7 giorni', en: '  ' }, duration: 7, unit: 'day' as const };
    assert.equal(rentalPackageName(blank, 'en'), '7 days');
  });
});
