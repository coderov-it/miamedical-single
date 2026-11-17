import assert from 'node:assert/strict';
import { test } from 'node:test';

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

test('placing an order takes stock for rentals and sales alike', () => {
  assert.equal(stockDirection(null, 'pending', 'rental', false), -1);
  assert.equal(stockDirection(null, 'pending', 'sale', false), -1);
});

test('paying an order that already holds its stock takes nothing more', () => {
  assert.equal(stockDirection('pending', 'paid', 'rental', true), 0);
  assert.equal(stockDirection('pending', 'paid', 'sale', true), 0);
});

test('an order placed before the rule takes its stock when paid', () => {
  assert.equal(stockDirection('pending', 'paid', 'rental', false), -1);
});

test('cancelling an unpaid order gives back only what it holds', () => {
  assert.equal(stockDirection('pending', 'cancelled', 'rental', true), 1);
  assert.equal(stockDirection('pending', 'cancelled', 'sale', false), 0);
});

test('a returned rental comes back; a fulfilled sale does not', () => {
  assert.equal(stockDirection('paid', 'fulfilled', 'rental', true), 1);
  assert.equal(stockDirection('paid', 'fulfilled', 'sale', true), 0);
});

test('unwinding a paid order returns its stock', () => {
  assert.equal(stockDirection('paid', 'cancelled', 'sale', true), 1);
  assert.equal(stockDirection('paid', 'refunded', 'rental', true), 1);
});

test('stock already back is not moved again', () => {
  assert.equal(stockDirection('fulfilled', 'refunded', 'rental', true), 0);
  assert.equal(stockDirection('fulfilled', 'refunded', 'sale', true), 0);
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

  const returned = stockDeltas(lines, 'paid', 'fulfilled', true);
  assert.equal(returned.get(BED)?.delta, 3);
  assert.equal(returned.has(CHAIR), false);
});

test('stockReason names the move for the history', async () => {
  const { stockReason } = await import('./stock.ts');
  assert.equal(stockReason(null, 'pending'), 'order_placed');
  assert.equal(stockReason('pending', 'paid'), 'order_paid');
  assert.equal(stockReason('pending', 'cancelled'), 'order_cancelled');
  assert.equal(stockReason('paid', 'cancelled'), 'order_cancelled');
  assert.equal(stockReason('paid', 'refunded'), 'order_refunded');
  assert.equal(stockReason('paid', 'fulfilled'), 'rental_returned');
});
