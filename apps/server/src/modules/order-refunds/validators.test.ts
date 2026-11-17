import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as v from 'valibot';

import { RecordRefundSchema } from './validators.ts';

const parse = (input: unknown) => v.safeParse(RecordRefundSchema, input);
const base = { amount: '12.50', reason: 'Apparecchio difettoso' };

test('a valid refund passes and the amount is normalised to two decimals', () => {
  assert.equal(parse(base).success, true);
  const loose = parse({ ...base, amount: ' 12.5 ' });
  assert.equal(loose.success && loose.output.amount, '12.50');
  const whole = parse({ ...base, amount: '7' });
  assert.equal(whole.success && whole.output.amount, '7.00');
});

test('amounts that are zero, negative, over-precise or not numbers fail', () => {
  for (const amount of [
    '0',
    '0.00',
    '-1.00',
    '1.234',
    '1,50',
    'abc',
    '',
    '1e3',
    '12345678901.00',
  ]) {
    assert.equal(parse({ ...base, amount }).success, false, amount);
  }
  assert.equal(parse({ reason: base.reason }).success, false);
});

test('the reason is trimmed and bounded to 3-500 characters', () => {
  assert.equal(parse({ ...base, reason: '  ab  ' }).success, false);
  assert.equal(parse({ ...base, reason: '   ' }).success, false);
  const trimmed = parse({ ...base, reason: '  abc  ' });
  assert.equal(trimmed.success && trimmed.output.reason, 'abc');
  assert.equal(parse({ ...base, reason: 'a'.repeat(500) }).success, true);
  assert.equal(parse({ ...base, reason: 'a'.repeat(501) }).success, false);
});

test('the extension id must be a uuid when present', () => {
  assert.equal(parse({ ...base, rentalExtensionId: 'nope' }).success, false);
  assert.equal(
    parse({ ...base, rentalExtensionId: '3f2b8c1e-5d44-4b7a-9c1a-0a1b2c3d4e5f' }).success,
    true,
  );
});
