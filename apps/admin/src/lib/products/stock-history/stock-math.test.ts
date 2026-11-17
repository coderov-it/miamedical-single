import assert from 'node:assert/strict';
import { test } from 'node:test';

import { signedDelta, stockTicks } from './stock-math.ts';

test('signedDelta carries the sign as text', () => {
  assert.equal(signedDelta(2), '+2');
  assert.equal(signedDelta(-1), '−1');
  assert.equal(signedDelta(0), '0');
});

test('stockTicks are integers from 0 covering the maximum', () => {
  assert.deepEqual(stockTicks(0), [0, 1]);
  assert.deepEqual(stockTicks(3), [0, 1, 2, 3]);
  assert.deepEqual(stockTicks(12), [0, 3, 6, 9, 12]);
  assert.deepEqual(stockTicks(11), [0, 3, 6, 9, 12]);
  assert.ok(stockTicks(1000).every(Number.isInteger));
});
