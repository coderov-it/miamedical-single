// Regression: CART-014 — a sale-only cart and checkout spoke of collection and return
// Found by /qa on 2026-10-04
// Report: ~/.gstack/projects/coderov-it-miamedical-single/qa-reports/run-20261004T080925Z/

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { requestCopyKey } from './product-mode-copy.ts';

const RENTAL_WORDS: Record<string, RegExp> = {
  it: /riconsegn/i,
  en: /\breturn/i,
  fr: /restitu/i,
  de: /rückgabe/i,
};

const SALE_KEYS = [
  'collectedAtBranchSale',
  'cartDueTodayNoteSale',
  'homeDeliverySale',
  'homeDeliveryDetailSale',
  'storePickupDetailSale',
  'choosePickupPointSale',
];

describe('requestCopyKey', () => {
  it('keeps the rental wording when a line is rented', () => {
    assert.equal(requestCopyKey('collectedAtBranch', true), 'collectedAtBranch');
  });

  it('picks the sale sibling when nothing is rented', () => {
    assert.equal(requestCopyKey('collectedAtBranch', false), 'collectedAtBranchSale');
  });

  for (const [lang, words] of Object.entries(RENTAL_WORDS)) {
    it(`${lang}: every sale sibling exists and never mentions a return`, () => {
      const messages = JSON.parse(
        readFileSync(new URL(`../i18n/${lang}.json`, import.meta.url), 'utf8'),
      ) as Record<string, string>;
      for (const key of [...SALE_KEYS, 'termsLink']) {
        assert.ok(messages[key], `${key} missing`);
        assert.doesNotMatch(messages[key], words, `${key}: ${messages[key]}`);
      }
    });
  }
});
