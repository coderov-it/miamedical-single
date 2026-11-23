import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { OrderStatus } from './status.ts';
import { type StockLine, stockDeltas, stockDirection, takenAfter } from './stock.ts';

const BED = '00000000-0000-4000-8000-00000000000a';
const CHAIR = '00000000-0000-4000-8000-00000000000b';

const rental = (productId: string | null, quantity: number): StockLine => ({
  productId,
  productTitle: 'Letto',
  quantity,
  configuration: { pricingMode: 'rental' },
});
const sale = (productId: string | null, quantity: number): StockLine => ({
  productId,
  productTitle: 'Sedia',
  quantity,
  configuration: { pricingMode: 'fixed' },
});

test('placing an order takes stock', () => {
  assert.equal(stockDirection(null, 'pending', false), -1);
});

test('paying takes stock only when the order does not hold it yet', () => {
  assert.equal(stockDirection('pending', 'paid', true), 0);
  assert.equal(stockDirection('pending', 'paid', false), -1);
});

test('cancelling an unpaid order gives back only what it holds', () => {
  assert.equal(stockDirection('pending', 'cancelled', true), 1);
  assert.equal(stockDirection('pending', 'cancelled', false), 0);
});

test('unwinding before delivery returns stock', () => {
  const cases: Array<[OrderStatus, OrderStatus]> = [
    ['paid', 'cancelled'],
    ['paid', 'refunded'],
    ['delivery_missed', 'cancelled'],
  ];
  for (const [from, to] of cases) assert.equal(stockDirection(from, to, true), 1, `${from}→${to}`);
});

test('every delivery, pickup and closing move leaves stock alone', () => {
  const cases: Array<[OrderStatus, OrderStatus]> = [
    ['paid', 'out_for_delivery'],
    ['out_for_delivery', 'delivered'],
    ['out_for_delivery', 'delivery_missed'],
    ['delivery_missed', 'out_for_delivery'],
    ['delivered', 'fulfilled'],
    ['delivered', 'out_for_pickup'],
    ['out_for_pickup', 'received'],
    ['out_for_pickup', 'pickup_missed'],
    ['pickup_missed', 'out_for_pickup'],
    ['received', 'fulfilled'],
    ['fulfilled', 'refunded'],
  ];
  for (const [from, to] of cases) assert.equal(stockDirection(from, to, true), 0, `${from}→${to}`);
});

test('the taken flag follows the units', () => {
  assert.equal(takenAfter('paid', 'pending', false), true);
  assert.equal(takenAfter('cancelled', 'pending', true), false);
  assert.equal(takenAfter('fulfilled', 'paid', true), true);
});

test('deltas sum per product and skip deleted products', () => {
  const lines = [rental(BED, 2), rental(BED, 1), sale(CHAIR, 1), rental(null, 4)];
  const placed = stockDeltas(lines, null, 'pending', false);
  assert.equal(placed.get(BED)?.delta, -3);
  assert.equal(placed.get(CHAIR)?.delta, -1);
  assert.equal(placed.size, 2);

  const unwound = stockDeltas(lines, 'paid', 'cancelled', true);
  assert.equal(unwound.get(BED)?.delta, 3);
  assert.equal(unwound.get(CHAIR)?.delta, 1);

  assert.equal(stockDeltas(lines, 'received', 'fulfilled', true).size, 0);
});

test('stockReason names the move for the history', async () => {
  const { stockReason } = await import('./stock.ts');
  assert.equal(stockReason(null, 'pending'), 'order_placed');
  assert.equal(stockReason('pending', 'paid'), 'order_paid');
  assert.equal(stockReason('pending', 'cancelled'), 'order_cancelled');
  assert.equal(stockReason('paid', 'cancelled'), 'order_cancelled');
  assert.equal(stockReason('paid', 'refunded'), 'order_refunded');
});
