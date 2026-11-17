import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DayRangeError, spanDays } from '../../shared/day-range.ts';
import { resolveRange } from './range.ts';

const NOW = new Date('2026-11-17T23:30:00Z'); // already 18 Nov in Rome

test('defaults to the last 90 Rome days ending today', () => {
  const range = resolveRange({}, NOW);
  assert.equal(range.to, '2026-11-18');
  assert.equal(spanDays(range.from, range.to), 90);
});

test('an explicit range is kept, a single day is fine', () => {
  assert.deepEqual(resolveRange({ from: '2026-01-01', to: '2026-01-01' }, NOW), {
    from: '2026-01-01',
    to: '2026-01-01',
  });
});

test('bad ranges name the field', () => {
  const field = (input: { from?: string; to?: string }) => {
    try {
      resolveRange(input, NOW);
    } catch (error) {
      return error instanceof DayRangeError ? error.field : 'other';
    }
    return null;
  };
  assert.equal(field({ from: '2026-05-02', to: '2026-05-01' }), 'from');
  assert.equal(field({ from: '2026-02-30', to: '2026-03-01' }), 'from');
  assert.equal(field({ from: '2026-01-01', to: '2026-13-01' }), 'to');
  assert.equal(field({ from: '2010-01-01', to: '2026-01-01' }), 'from');
  assert.equal(field({ from: '2016-01-01', to: '2026-01-01' }), null);
});
