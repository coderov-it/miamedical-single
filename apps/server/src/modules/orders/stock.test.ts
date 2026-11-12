import assert from 'node:assert/strict';
import { test } from 'node:test';

import { type StockLine, stockDeltas, stockDirection } from './stock.ts';

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

test('paying an order takes stock for rentals and sales alike', () => {
  assert.equal(stockDirection('pending', 'paid', 'rental'), -1);
  assert.equal(stockDirection('pending', 'paid', 'sale'), -1);
});

test('a returned rental comes back; a fulfilled sale does not', () => {
  assert.equal(stockDirection('paid', 'fulfilled', 'rental'), 1);
  assert.equal(stockDirection('paid', 'fulfilled', 'sale'), 0);
});

test('unwinding a paid order returns its stock', () => {
  assert.equal(stockDirection('paid', 'cancelled', 'sale'), 1);
  assert.equal(stockDirection('paid', 'refunded', 'rental'), 1);
});

test('stock never moved, or already back, is not moved again', () => {
  assert.equal(stockDirection('pending', 'cancelled', 'rental'), 0);
  assert.equal(stockDirection('fulfilled', 'refunded', 'rental'), 0);
  assert.equal(stockDirection('fulfilled', 'refunded', 'sale'), 0);
});

test('deltas sum per product and skip deleted products', () => {
  const lines = [rental(BED, 2), rental(BED, 1), sale(CHAIR, 1), rental(null, 4)];
  const paid = stockDeltas(lines, 'pending', 'paid');
  assert.equal(paid.get(BED)?.delta, -3);
  assert.equal(paid.get(CHAIR)?.delta, -1);
  assert.equal(paid.size, 2);

  const returned = stockDeltas(lines, 'paid', 'fulfilled');
  assert.equal(returned.get(BED)?.delta, 3);
  assert.equal(returned.has(CHAIR), false);
});
