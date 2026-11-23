import assert from 'node:assert/strict';
import { test } from 'node:test';

import { shiftRentalToDelivery } from './delivery-dates.ts';

const booked = { startDate: '2026-11-10', endDate: '2026-11-20', unit: 'day' };

test('a late delivery moves the whole period later', () => {
  const out = shiftRentalToDelivery(booked, '2026-11-11');
  assert.equal(out?.startDate, '2026-11-11');
  assert.equal(out?.endDate, '2026-11-21');
  assert.equal(out?.bookedStartDate, '2026-11-10');
  assert.equal(out?.bookedEndDate, '2026-11-20');
  assert.equal(out?.unit, 'day');
});

test('an early delivery moves it earlier', () => {
  const out = shiftRentalToDelivery(booked, '2026-11-09');
  assert.equal(out?.startDate, '2026-11-09');
  assert.equal(out?.endDate, '2026-11-19');
});

test('a second delivery measures from the booked dates, not the shifted ones', () => {
  const first = shiftRentalToDelivery(booked, '2026-11-11')!;
  const again = shiftRentalToDelivery(first, '2026-11-12');
  assert.equal(again?.startDate, '2026-11-12');
  assert.equal(again?.endDate, '2026-11-22');
  assert.equal(again?.bookedStartDate, '2026-11-10');
});

test('an open-ended rental keeps a null end; no start means no shift', () => {
  const open = shiftRentalToDelivery({ startDate: '2026-11-10', endDate: null }, '2026-11-12');
  assert.equal(open?.startDate, '2026-11-12');
  assert.equal(open?.endDate, null);
  assert.equal(shiftRentalToDelivery({}, '2026-11-12'), null);
});

test('month and year ends carry over', () => {
  const out = shiftRentalToDelivery(
    { startDate: '2026-12-20', endDate: '2027-01-02' },
    '2026-12-28',
  );
  assert.equal(out?.endDate, '2027-01-10');
});
