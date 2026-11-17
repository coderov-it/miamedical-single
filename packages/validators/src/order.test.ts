import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as v from 'valibot';

import { CheckoutDeliverySchema } from './order.ts';

test('a pick-up names one of the company branches', () => {
  const ok = v.safeParse(CheckoutDeliverySchema, { method: 'storePickup', pickupCity: 'Firenze' });
  assert.equal(ok.success, true);
});

test('a pick-up at a branch the company does not have is refused', () => {
  const bad = v.safeParse(CheckoutDeliverySchema, { method: 'storePickup', pickupCity: 'Napoli' });
  assert.equal(bad.success, false);
});
