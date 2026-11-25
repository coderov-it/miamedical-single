import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resolveDeliveryFee } from './delivery.ts';

describe('resolveDeliveryFee', () => {
  it('takes the highest line, a line without a fee using the fallback', () => {
    assert.equal(resolveDeliveryFee('homeDelivery', ['25.00', null], '15.00'), '25.00');
  });

  it('lets the fallback win when it is higher than every own fee', () => {
    assert.equal(resolveDeliveryFee('homeDelivery', ['9.00', null], '15.00'), '15.00');
  });

  it('is unpriced when no line has a fee and there is no fallback', () => {
    assert.equal(resolveDeliveryFee('homeDelivery', [null, null], null), null);
  });

  it('prices a mixed cart by the lines that have a fee', () => {
    assert.equal(resolveDeliveryFee('homeDelivery', ['25.00', null], null), '25.00');
  });

  it('uses the fallback when only the fallback exists', () => {
    assert.equal(resolveDeliveryFee('homeDelivery', [null, null], '15.00'), '15.00');
  });

  it('compares amounts, not strings', () => {
    assert.equal(resolveDeliveryFee('homeDelivery', ['100.00', '9.00'], null), '100.00');
  });

  it('is free for collection whatever the products carry', () => {
    assert.equal(resolveDeliveryFee('storePickup', ['25.00'], '15.00'), '0.00');
  });

  it('returns the fallback when there are no lines', () => {
    assert.equal(resolveDeliveryFee('homeDelivery', [], '15.00'), '15.00');
    assert.equal(resolveDeliveryFee('homeDelivery', [], null), null);
  });
});
