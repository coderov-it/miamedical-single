import assert from 'node:assert/strict';
import { test } from 'node:test';

import { OrderStatusSchema } from '@mia/validators';

import {
  canMoveOrder,
  canMovePayment,
  manualPaymentStatuses,
  nextOrderStatuses,
  orderFlow,
  ORDER_STAGES,
  PAID_ONWARD_STATUSES,
  type OrderFlow,
  type OrderStatus,
} from './status.ts';

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

test('the flow is rental as soon as one line is rented', () => {
  assert.equal(orderFlow([{ configuration: { pricingMode: 'fixed' } }]), 'sale');
  assert.equal(orderFlow([{ configuration: null }]), 'sale');
  assert.equal(
    orderFlow([{ configuration: null }, { configuration: { pricingMode: 'rental' } }]),
    'rental',
  );
});

const TABLE: Array<[OrderStatus, OrderFlow, OrderStatus[]]> = [
  ['pending', 'sale', ['paid', 'cancelled']],
  ['paid', 'rental', ['out_for_delivery', 'cancelled', 'refunded']],
  ['out_for_delivery', 'sale', ['delivered', 'delivery_missed']],
  ['delivery_missed', 'rental', ['out_for_delivery', 'cancelled']],
  ['delivered', 'sale', ['fulfilled']],
  ['delivered', 'rental', ['out_for_pickup']],
  ['out_for_pickup', 'rental', ['received', 'pickup_missed']],
  ['pickup_missed', 'rental', ['out_for_pickup']],
  ['received', 'rental', []],
  ['fulfilled', 'rental', ['refunded']],
  ['fulfilled', 'sale', ['refunded']],
  ['cancelled', 'sale', []],
  ['refunded', 'rental', []],
];

test('the transition table, per flow, forward step first', () => {
  for (const [from, flow, next] of TABLE) {
    assert.deepEqual([...nextOrderStatuses(from, flow)], next, `${from} (${flow})`);
  }
});

test('flow decides what follows delivered; paid no longer fulfils', () => {
  assert.equal(canMoveOrder('delivered', 'fulfilled', 'sale'), true);
  assert.equal(canMoveOrder('delivered', 'fulfilled', 'rental'), false);
  assert.equal(canMoveOrder('delivered', 'out_for_pickup', 'sale'), false);
  assert.equal(canMoveOrder('paid', 'fulfilled', 'sale'), false);
  assert.equal(canMoveOrder('received', 'fulfilled', 'rental'), false);
});

test('money is taken from paid onward, never at pending or cancelled', () => {
  assert.equal(PAID_ONWARD_STATUSES.includes('pending'), false);
  assert.equal(PAID_ONWARD_STATUSES.includes('cancelled'), false);
  assert.equal(PAID_ONWARD_STATUSES.length, 9);
});

test('every order status belongs to exactly one stage', () => {
  const all = OrderStatusSchema.options as readonly OrderStatus[];
  const staged = Object.values(ORDER_STAGES).flat() as OrderStatus[];
  assert.equal(new Set(staged).size, staged.length, 'no status in two stages');
  assert.deepEqual([...staged].sort(), [...all].sort());
});
