/**
 * The pricing rules, on real amounts.
 *
 * This is the arithmetic behind `orders.total`, and the storefront runs the same
 * function to show the figure the customer confirms. Every case below is one of
 * the owner's rules stated as a number.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { priceRequest, resolveUnitRate } from './request.ts';

const PKG_9_DAY = { unit: 'day' as const, duration: 9, price: '80.00' };
const PKG_3_DAY = { unit: 'day' as const, duration: 3, price: '25.00' };
const PKG_4_HOUR = { unit: 'hour' as const, duration: 4, price: '15.00' };

describe('a fixed product', () => {
  it('prices at its base price, which is the whole of it', () => {
    const priced = priceRequest({
      mode: 'fixed',
      basePrice: '289.00',
      quantity: 1,
    });
    assert.equal(priced.total, '289.00');
    assert.equal(priced.unitRate, '289.00');
    assert.equal(priced.incomplete, false);
  });

  it('adds a fixed add-on on top of the base', () => {
    const priced = priceRequest({
      mode: 'fixed',
      basePrice: '289.00',
      addons: [{ mode: 'fixed', price: '26.00', rentalUnit: null, quantity: 1 }],
      quantity: 1,
    });
    assert.equal(priced.total, '315.00');
    // The rate the order line records is the product's own, before extras.
    assert.equal(priced.unitRate, '289.00');
  });
});

describe('a rental product', () => {
  it('is priced by its package, not by any rate', () => {
    const priced = priceRequest({
      mode: 'rental',
      basePrice: null,
      rentalPackage: PKG_3_DAY,
      quantity: 1,
    });
    assert.equal(priced.total, '25.00');
    assert.equal(priced.units, 3);
  });

  it('multiplies a rental add-on by the package duration and its quantity', () => {
    const priced = priceRequest({
      mode: 'rental',
      basePrice: null,
      rentalPackage: PKG_9_DAY,
      addons: [{ mode: 'rental', price: '3.00', rentalUnit: 'day', quantity: 2 }],
      quantity: 1,
    });
    // 80.00 package + 3.00 × 2 × 9 days.
    assert.equal(priced.total, '134.00');
    assert.equal(priced.unitRate, '80.00');
  });

  it('charges a fixed-mode add-on once, whatever the duration', () => {
    const priced = priceRequest({
      mode: 'rental',
      basePrice: null,
      rentalPackage: PKG_9_DAY,
      addons: [{ mode: 'fixed', price: '60.00', rentalUnit: null, quantity: 1 }],
      quantity: 1,
    });
    assert.equal(priced.total, '140.00');
  });

  it('bills a per-day add-on on an hour package as one whole day', () => {
    const priced = priceRequest({
      mode: 'rental',
      basePrice: null,
      rentalPackage: PKG_4_HOUR,
      addons: [{ mode: 'rental', price: '5.00', rentalUnit: 'day', quantity: 1 }],
      quantity: 1,
    });
    assert.equal(priced.total, '20.00');
  });

  it('shows a zero-price add-on as included rather than charging nothing twice', () => {
    const priced = priceRequest({
      mode: 'rental',
      basePrice: null,
      rentalPackage: PKG_3_DAY,
      addons: [{ mode: 'rental', price: '0.00', rentalUnit: 'day', quantity: 1 }],
      quantity: 1,
    });
    assert.equal(priced.total, '25.00');
    const line = priced.lines.find((entry) => entry.kind === 'addon');
    assert.equal(line?.kind === 'addon' && line.included, true);
  });

  it('multiplies the whole line by the line quantity, add-ons included', () => {
    const priced = priceRequest({
      mode: 'rental',
      basePrice: null,
      rentalPackage: PKG_3_DAY,
      addons: [{ mode: 'rental', price: '2.00', rentalUnit: 'day', quantity: 1 }],
      quantity: 2,
    });
    // (25.00 + 2.00 × 3) × 2
    assert.equal(priced.total, '62.00');
  });

  it('has no price at all with no package picked', () => {
    const priced = priceRequest({
      mode: 'rental',
      basePrice: null,
      rentalPackage: null,
      addons: [{ mode: 'fixed', price: '60.00', rentalUnit: null, quantity: 1 }],
      quantity: 3,
    });
    assert.equal(priced.incomplete, true);
    assert.equal(priced.total, '0.00');
    assert.equal(priced.units, null);
    assert.deepEqual(priced.lines, []);
  });
});

describe('resolveUnitRate', () => {
  it('is the figure an order line records, and is not total ÷ quantity', () => {
    const input = {
      mode: 'rental' as const,
      basePrice: null,
      rentalPackage: PKG_9_DAY,
      addons: [{ mode: 'rental' as const, price: '3.00', rentalUnit: 'day' as const, quantity: 2 }],
      quantity: 2,
    };
    const priced = priceRequest(input);
    assert.equal(resolveUnitRate(input), '80.00');
    assert.equal(priced.total, '268.00');
    assert.notEqual(priced.unitRate, '134.00');
  });
});
