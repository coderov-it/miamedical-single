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
  it('prices at its base plus its modifiers', () => {
    const priced = priceRequest({
      mode: 'fixed',
      basePrice: '289.00',
      modifiers: [{ amount: '11.00', affectsSku: false }],
      quantity: 1,
    });
    assert.equal(priced.total, '300.00');
    assert.equal(priced.unitRate, '300.00');
    assert.equal(priced.incomplete, false);
  });

  it('lets a matched SKU price replace the base and its sku-affecting modifiers', () => {
    const priced = priceRequest({
      mode: 'fixed',
      basePrice: '289.00',
      skuPrice: '310.00',
      modifiers: [
        { amount: '21.00', affectsSku: true },
        { amount: '5.00', affectsSku: false },
      ],
      quantity: 1,
    });
    assert.equal(priced.total, '315.00');
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

  it('adds variant modifiers FLAT, never multiplied by the duration', () => {
    const priced = priceRequest({
      mode: 'rental',
      basePrice: null,
      rentalPackage: PKG_9_DAY,
      modifiers: [{ amount: '5.00', affectsSku: true }],
      quantity: 1,
    });
    // 80.00 + 5.00, NOT 80.00 + 5.00 × 9.
    assert.equal(priced.total, '85.00');
    assert.equal(priced.unitRate, '85.00');
  });

  it('ignores a matched SKU price, which has nothing to override', () => {
    const priced = priceRequest({
      mode: 'rental',
      basePrice: null,
      skuPrice: '999.00',
      rentalPackage: PKG_3_DAY,
      modifiers: [{ amount: '2.00', affectsSku: true }],
      quantity: 1,
    });
    assert.equal(priced.total, '27.00');
  });

  it('multiplies a rental add-on by the package duration and its quantity', () => {
    const priced = priceRequest({
      mode: 'rental',
      basePrice: null,
      rentalPackage: PKG_9_DAY,
      modifiers: [{ amount: '5.00', affectsSku: true }],
      addons: [{ mode: 'rental', price: '3.00', rentalUnit: 'day', quantity: 2 }],
      quantity: 1,
    });
    // 80.00 package + 5.00 flat variant + 3.00 × 2 × 9 days.
    assert.equal(priced.total, '139.00');
    assert.equal(priced.unitRate, '85.00');
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
      modifiers: [{ amount: '5.00', affectsSku: true }],
      addons: [{ mode: 'fixed', price: '60.00', rentalUnit: null, quantity: 1 }],
      quantity: 3,
    });
    assert.equal(priced.incomplete, true);
    assert.equal(priced.total, '0.00');
    assert.equal(priced.units, null);
    assert.deepEqual(priced.lines, []);
  });

  it('handles a negative modifier without going below the package by more than it', () => {
    const priced = priceRequest({
      mode: 'rental',
      basePrice: null,
      rentalPackage: PKG_3_DAY,
      modifiers: [{ amount: '-4.00', affectsSku: true }],
      quantity: 1,
    });
    assert.equal(priced.total, '21.00');
  });
});

describe('resolveUnitRate', () => {
  it('is the figure an order line records, and is not total ÷ quantity', () => {
    const input = {
      mode: 'rental' as const,
      basePrice: null,
      rentalPackage: PKG_9_DAY,
      modifiers: [{ amount: '5.00', affectsSku: true }],
      addons: [{ mode: 'rental' as const, price: '3.00', rentalUnit: 'day' as const, quantity: 2 }],
      quantity: 2,
    };
    const priced = priceRequest(input);
    assert.equal(resolveUnitRate(input), '85.00');
    assert.equal(priced.total, '278.00');
    assert.notEqual(priced.unitRate, '139.00');
  });
});
