import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { startingPrice } from './starting-price.ts';

const packages = (...prices: string[]) => prices.map((price) => ({ price }));

describe('startingPrice', () => {
  it('is the base price of a fixed product', () => {
    assert.equal(startingPrice('289.00', []), '289.00');
  });

  it('is the cheapest package of a rental, whatever order the packages are in', () => {
    assert.equal(startingPrice(null, packages('180.00', '89.00', '320.00')), '89.00');
  });

  it('compares amounts, not strings', () => {
    assert.equal(startingPrice(null, packages('100.00', '9.00')), '9.00');
  });

  it('restores the scale of a price that lost it', () => {
    assert.equal(startingPrice(null, packages('25')), '25.00');
  });

  it('is null with no base price and no package', () => {
    assert.equal(startingPrice(null, []), null);
  });
});
