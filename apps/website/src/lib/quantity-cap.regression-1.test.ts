// Regression: CART-001 / PUB-011 — a quantity above 10 was cut to 10 without a word
// Found by /qa on 2026-10-04
// Report: ~/.gstack/projects/coderov-it-miamedical-single/qa-reports/run-20261004T080925Z/

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { requestQuantity } from './quantity-cap.ts';

describe('requestQuantity', () => {
  it('passes a quantity under the cap untouched', () => {
    assert.deepEqual(requestQuantity(4, 10), { quantity: 4, capped: false });
    assert.deepEqual(requestQuantity(10, 10), { quantity: 10, capped: false });
  });

  it('flags "+" pressed at the cap', () => {
    assert.deepEqual(requestQuantity(11, 10), { quantity: 10, capped: true });
  });

  it('flags a typed quantity over the cap', () => {
    assert.deepEqual(requestQuantity('15', 10), { quantity: 10, capped: true });
    assert.deepEqual(requestQuantity(999, 10), { quantity: 10, capped: true });
  });

  it('floors nonsense to 1 without flagging the cap', () => {
    assert.deepEqual(requestQuantity(0, 10), { quantity: 1, capped: false });
    assert.deepEqual(requestQuantity('abc', 10), { quantity: 1, capped: false });
    assert.deepEqual(requestQuantity(2.7, 10), { quantity: 2, capped: false });
  });
});
