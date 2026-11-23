import assert from 'node:assert/strict';
import { test } from 'node:test';

import { localToday, moveLabelKey, primaryMove } from './order-actions.ts';

test('the lead button is the first move that is not an exit or a miss', () => {
  assert.equal(primaryMove(['delivered', 'delivery_missed']), 'delivered');
  assert.equal(primaryMove(['paid', 'cancelled']), 'paid');
  assert.equal(primaryMove(['cancelled', 'refunded']), undefined);
});

test('retries are named as retries', () => {
  assert.equal(moveLabelKey('delivery_missed', 'out_for_delivery'), 'orders.actionsRetryDelivery');
  assert.equal(moveLabelKey('pickup_missed', 'out_for_pickup'), 'orders.actionsRetryPickup');
  assert.equal(moveLabelKey('paid', 'out_for_delivery'), 'orders.actionsMarkAs');
});

test('today is the local calendar day', () => {
  assert.equal(localToday(new Date(2026, 10, 5, 23, 59)), '2026-11-05');
});
