import assert from 'node:assert/strict';
import { test } from 'node:test';

import { canMovePayment, manualPaymentStatuses } from './status.ts';

test('a second partial refund is a legal loop; going back is not', () => {
  assert.equal(canMovePayment('paid', 'partially_refunded'), true);
  assert.equal(canMovePayment('partially_refunded', 'partially_refunded'), true);
  assert.equal(canMovePayment('partially_refunded', 'refunded'), true);
  assert.equal(canMovePayment('refunded', 'paid'), false);
});

test('manual moves never offer a refund status', () => {
  assert.deepEqual(manualPaymentStatuses('paid'), []);
  assert.deepEqual(manualPaymentStatuses('failed'), ['unpaid', 'authorized', 'paid']);
});
