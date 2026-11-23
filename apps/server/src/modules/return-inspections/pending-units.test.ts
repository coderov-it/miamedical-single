import assert from 'node:assert/strict';
import { test } from 'node:test';

import { type PendingLine, pendingUnits } from './pending-units.ts';
import { cityOf, customerName, latestPerOrder, unitNumbers } from './unit-details.ts';

const line = (over: Partial<PendingLine>): PendingLine => ({
  orderId: 'o1',
  orderNumber: 'MM-0001',
  customerName: 'Anna Rossi',
  customerEmail: 'anna@example.it',
  customerPhone: null,
  customerCity: null,
  productImage: null,
  rentalStartDate: null,
  rentalEndDate: null,
  receivedByName: null,
  orderItemId: 'i1',
  productId: 'p1',
  productTitle: 'Letto',
  quantity: 2,
  decided: 0,
  receivedAt: new Date('2026-11-20T10:00:00Z'),
  ...over,
});

test('numbering continues after the decided units', () => {
  const units = pendingUnits([line({ decided: 1 })]);
  assert.deepEqual(
    units.map((unit) => unit.unitNumber),
    [2],
  );
});

test('a fully decided line yields nothing', () => {
  assert.equal(pendingUnits([line({ decided: 2 })]).length, 0);
});

test('customer name is trimmed, falling back to the email', () => {
  assert.equal(customerName({ firstName: ' Anna ', lastName: null, email: 'a@b.it' }), 'Anna');
  assert.equal(customerName({ firstName: ' ', lastName: '', email: 'a@b.it' }), 'a@b.it');
});

test('oldest received first, then order number, then unit number', () => {
  const older = line({
    orderId: 'o2',
    orderNumber: 'MM-0009',
    receivedAt: new Date('2026-11-19T10:00:00Z'),
  });
  const sameTimeLowerNumber = line({ orderId: 'o3', orderNumber: 'MM-0002', quantity: 1 });
  const units = pendingUnits([line({}), sameTimeLowerNumber, older]);
  assert.deepEqual(
    units.map((unit) => `${unit.orderNumber}#${unit.unitNumber}`),
    ['MM-0009#1', 'MM-0009#2', 'MM-0001#1', 'MM-0001#2', 'MM-0002#1'],
  );
});

test('the shipping city is read defensively', () => {
  assert.equal(cityOf({ city: ' Roma ' }), 'Roma');
  assert.equal(cityOf({ city: 4 }), null);
  assert.equal(cityOf(null), null);
});

test('the first receipt seen per order wins', () => {
  const at = (day: number) => new Date(`2026-11-${day}T10:00:00Z`);
  const latest = latestPerOrder([
    { orderId: 'o1', at: at(21), byName: 'Luca' },
    { orderId: 'o1', at: at(20), byName: 'Anna' },
  ]);
  assert.equal(latest.get('o1')?.byName, 'Luca');
});

test('unit numbers count per line in the given order', () => {
  const numbers = unitNumbers([
    { id: 'r1', orderItemId: 'a' },
    { id: 'r2', orderItemId: 'b' },
    { id: 'r3', orderItemId: 'a' },
  ]);
  assert.deepEqual([numbers.get('r1'), numbers.get('r2'), numbers.get('r3')], [1, 1, 2]);
});
