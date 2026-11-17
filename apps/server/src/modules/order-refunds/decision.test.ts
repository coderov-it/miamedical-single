import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  decideRefund,
  formatMoney,
  fromCents,
  isMoneyCheckViolation,
  isRefundablePayment,
  isRefundAmountMissing,
  paymentStatusAfterRefund,
  refundNote,
  toCents,
} from './decision.ts';

test('cents round-trip without float drift', () => {
  for (const amount of ['0.01', '0.10', '12.50', '19.99', '1234567.89', '100.00']) {
    assert.equal(fromCents(toCents(amount)), amount);
  }
  assert.equal(toCents('0.10') + toCents('0.20'), toCents('0.30'));
});

test('a partial refund leaves the rest', () => {
  assert.deepEqual(decideRefund({ netTotal: '100.00', amount: '12.50' }), {
    ok: true,
    netAfter: '87.50',
  });
});

test('refunding exactly what is left is allowed and leaves zero', () => {
  assert.deepEqual(decideRefund({ netTotal: '50.00', amount: '50.00' }), {
    ok: true,
    netAfter: '0.00',
  });
});

test('one cent over is refused with the figure that is still available', () => {
  assert.deepEqual(decideRefund({ netTotal: '50.00', amount: '50.01' }), {
    ok: false,
    message: 'At most 50.00 can still be refunded.',
  });
});

test('nothing left means nothing can be refunded', () => {
  const result = decideRefund({ netTotal: '0.00', amount: '0.01' });
  assert.equal(result.ok, false);
});

test('payment status follows what is left', () => {
  assert.equal(paymentStatusAfterRefund('0.00'), 'refunded');
  assert.equal(paymentStatusAfterRefund('0.01'), 'partially_refunded');
});

test('only received payments are refundable', () => {
  assert.equal(isRefundablePayment('paid'), true);
  assert.equal(isRefundablePayment('partially_refunded'), true);
  for (const status of ['unpaid', 'authorized', 'failed'] as const) {
    assert.equal(isRefundablePayment(status), false);
  }
});

test('timeline wording', () => {
  assert.equal(formatMoney('12.50', 'EUR'), '12,50 €');
  assert.equal(formatMoney('1234.5', 'EUR'), '1.234,50 €');
  assert.equal(
    refundNote('12.50', 'EUR', 'Apparecchio difettoso'),
    'Refund 12,50 € — Apparecchio difettoso',
  );
});

test('a partial refund with no amount is flagged', () => {
  assert.equal(isRefundAmountMissing('partially_refunded', '0.00'), true);
  assert.equal(isRefundAmountMissing('partially_refunded', '5.00'), false);
  assert.equal(isRefundAmountMissing('paid', '0.00'), false);
});

test('the money check is recognised, wrapped or not', () => {
  const raw = { code: '23514', constraint_name: 'orders_money_check' };
  assert.equal(isMoneyCheckViolation(raw), true);
  assert.equal(isMoneyCheckViolation(new Error('x', { cause: raw })), true);
  assert.equal(isMoneyCheckViolation({ code: '23514', constraint_name: 'other' }), false);
  assert.equal(isMoneyCheckViolation(new Error('boom')), false);
  assert.equal(isMoneyCheckViolation(null), false);
});
