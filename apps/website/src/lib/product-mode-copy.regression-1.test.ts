// Regression: PUB-015 — sale product pages promised "Ritiro a fine noleggio"
// Found by /qa on 2026-10-04
// Report: ~/.gstack/projects/coderov-it-miamedical-single/qa-reports/run-20261004T080925Z/

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { productModeCopy } from './product-mode-copy.ts';

const it_ = JSON.parse(readFileSync(new URL('../i18n/it.json', import.meta.url), 'utf8')) as Record<
  string,
  string
>;

describe('productModeCopy', () => {
  it('lists the end-of-rental collection on a rental', () => {
    assert.ok(productModeCopy('rental').includes.includes('pdp.includes.collection'));
  });

  it('never promises a collection or a sanitised device on a sale', () => {
    const sale = productModeCopy('fixed');
    assert.ok(!sale.includes.includes('pdp.includes.collection'));
    assert.ok(!sale.hygiene.includes('pdp.hygiene.sanitised'));
    assert.notEqual(sale.termsIntro, productModeCopy('rental').termsIntro);
  });

  it('names only keys the catalogue has', () => {
    for (const mode of ['rental', 'fixed']) {
      const copy = productModeCopy(mode);
      const keys = [copy.tab, copy.includedHeading, copy.hygieneHeading, copy.termsIntro, ...copy.includes, ...copy.hygiene];
      for (const key of keys) assert.ok(key in it_, `${mode}: ${key} missing from it.json`);
    }
  });
});
