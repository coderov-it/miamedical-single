import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CLOSED_RENTAL_ORDER_STATUSES,
  isClosedRentalOrderStatus,
  romeToday,
} from './rental-calendar.ts';

test('romeToday is the Rome date, not the UTC date, just after midnight', () => {
  // 00:30 in Rome (CEST, UTC+2) is still the previous day in UTC.
  assert.equal(romeToday(new Date('2026-10-12T22:30:00Z')), '2026-10-13');
  assert.equal(romeToday(new Date('2026-10-12T21:59:00Z')), '2026-10-12');
});

test('romeToday follows winter time (CET, UTC+1)', () => {
  assert.equal(romeToday(new Date('2026-12-31T23:30:00Z')), '2027-01-01');
  assert.equal(romeToday(new Date('2026-12-31T22:59:00Z')), '2026-12-31');
});

test('fulfilled, cancelled and refunded orders are closed; pending and paid are not', () => {
  assert.deepEqual([...CLOSED_RENTAL_ORDER_STATUSES], ['fulfilled', 'cancelled', 'refunded']);
  assert.equal(isClosedRentalOrderStatus('refunded'), true);
  assert.equal(isClosedRentalOrderStatus('pending'), false);
  assert.equal(isClosedRentalOrderStatus('paid'), false);
});
