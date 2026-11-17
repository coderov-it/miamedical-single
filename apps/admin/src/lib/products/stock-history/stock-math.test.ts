import assert from 'node:assert/strict';
import { test } from 'node:test';

import { signedDelta } from './stock-math.ts';

test('signedDelta carries the sign as text', () => {
  assert.equal(signedDelta(2), '+2');
  assert.equal(signedDelta(-1), '−1');
  assert.equal(signedDelta(0), '0');
});
