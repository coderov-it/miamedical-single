import assert from 'node:assert/strict';
import { test } from 'node:test';

import { integerTicks } from './ticks.ts';

test('integerTicks are integers from 0 covering the maximum', () => {
  assert.deepEqual(integerTicks(0), [0, 1]);
  assert.deepEqual(integerTicks(3), [0, 1, 2, 3]);
  assert.deepEqual(integerTicks(12), [0, 3, 6, 9, 12]);
  assert.deepEqual(integerTicks(11), [0, 3, 6, 9, 12]);
  assert.ok(integerTicks(1000).every(Number.isInteger));
});
