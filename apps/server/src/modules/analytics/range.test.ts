import assert from 'node:assert/strict';
import { test } from 'node:test';

import { SalesRangeError, resolveRange, romeToday, spanDays } from './range.ts';

test('defaults: 30 days ending today in Rome, bucket day', () => {
  // 23:30 UTC on 16 Nov is already 17 Nov in Rome.
  const r = resolveRange({}, new Date('2026-11-16T23:30:00Z'));
  assert.deepEqual(r.range, { from: '2026-10-19', to: '2026-11-17' });
  assert.equal(r.bucket, 'day');
  assert.equal(spanDays(r.range.from, r.range.to), 30);
});

test('previous period is the same number of days right before from', () => {
  const r = resolveRange({ from: '2026-11-01', to: '2026-11-30' });
  assert.deepEqual(r.previous, { from: '2026-10-02', to: '2026-10-31' });
});

test('a single day has a one-day previous period', () => {
  const r = resolveRange({ from: '2026-03-01', to: '2026-03-01' });
  assert.deepEqual(r.previous, { from: '2026-02-28', to: '2026-02-28' });
});

test('rejects from after to, impossible dates and spans over 3660 days', () => {
  assert.throws(() => resolveRange({ from: '2026-11-02', to: '2026-11-01' }), SalesRangeError);
  assert.throws(() => resolveRange({ from: '2026-02-30', to: '2026-03-01' }), SalesRangeError);
  assert.throws(() => resolveRange({ from: '2016-01-01', to: '2026-11-01' }), SalesRangeError);
  assert.doesNotThrow(() => resolveRange({ from: '2016-11-08', to: '2026-11-01' }));
});

test('romeToday follows daylight saving', () => {
  assert.equal(romeToday(new Date('2026-07-01T22:30:00Z')), '2026-07-02');
  assert.equal(romeToday(new Date('2026-01-01T22:30:00Z')), '2026-01-01');
});
