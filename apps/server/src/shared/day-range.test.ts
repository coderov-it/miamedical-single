import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  addDays,
  assertDayRange,
  DayRangeError,
  isRealDay,
  romeToday,
  spanDays,
} from './day-range.ts';

test('romeToday follows daylight saving', () => {
  assert.equal(romeToday(new Date('2026-07-01T22:30:00Z')), '2026-07-02');
  assert.equal(romeToday(new Date('2026-01-01T22:30:00Z')), '2026-01-01');
});

test('day arithmetic is inclusive and calendar-exact', () => {
  assert.equal(spanDays('2026-03-01', '2026-03-01'), 1);
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(isRealDay('2026-02-30'), false);
  assert.equal(isRealDay('2028-02-29'), true);
});

test('assertDayRange names the offending field', () => {
  const field = (from: string, to: string) => {
    try {
      assertDayRange(from, to);
    } catch (error) {
      return error instanceof DayRangeError ? error.field : 'other';
    }
    return null;
  };
  assert.equal(field('2026-05-02', '2026-05-01'), 'from');
  assert.equal(field('2026-02-30', '2026-03-01'), 'from');
  assert.equal(field('2026-01-01', '2026-13-01'), 'to');
  assert.equal(field('2010-01-01', '2026-01-01'), 'from');
  assert.equal(field('2016-11-08', '2026-11-01'), null);
});
