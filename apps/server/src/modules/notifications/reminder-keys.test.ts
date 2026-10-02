import assert from 'node:assert/strict';
import { test } from 'node:test';

import { endingSoonKey, extendOfferKey, upcomingKey } from './reminder-keys.ts';

const ORDER = '0b6f2c1e-0000-4000-8000-000000000042';

test('an extended rental gets a second three-day reminder', () => {
  // Oct 1 → Oct 8, then extended to Oct 15: the two T−3 notices must not collide.
  const first = endingSoonKey('customer', ORDER, '2026-10-08', 3);
  const second = endingSoonKey('customer', ORDER, '2026-10-15', 3);
  assert.equal(first, `rental.ending_soon:customer:${ORDER}:2026-10-08:3d`);
  assert.notEqual(first, second);
});

test('the same span and threshold keeps one key, per audience', () => {
  assert.equal(
    endingSoonKey('admin', ORDER, '2026-10-08', 3),
    endingSoonKey('admin', ORDER, '2026-10-08', 3),
  );
  assert.notEqual(
    endingSoonKey('admin', ORDER, '2026-10-08', 3),
    endingSoonKey('customer', ORDER, '2026-10-08', 3),
  );
});

test('the extend offer and the upcoming notice are keyed on their date', () => {
  assert.notEqual(extendOfferKey(ORDER, '2026-10-08'), extendOfferKey(ORDER, '2026-10-15'));
  assert.equal(upcomingKey(ORDER, '2026-10-10'), `order.upcoming:${ORDER}:2026-10-10`);
});
