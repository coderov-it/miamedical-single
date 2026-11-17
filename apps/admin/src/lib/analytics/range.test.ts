import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  addDays,
  autoBucket,
  bucketLabel,
  bucketTitle,
  daySpan,
  matchPreset,
  percentChange,
  presetRange,
  rangeProblem,
  resolveQuery,
  todayRome,
} from './range.ts';

const TODAY = '2026-11-17';

test('todayRome uses the Rome calendar day, not UTC', () => {
  assert.equal(todayRome(new Date('2026-11-17T23:30:00Z')), '2026-11-18');
  assert.equal(todayRome(new Date('2026-07-17T21:59:00Z')), '2026-07-17');
});

test('addDays crosses month, year and leap boundaries', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2028-03-01', -1), '2028-02-29');
});

test('presets resolve against today', () => {
  assert.deepEqual(presetRange('last7', TODAY), { from: '2026-11-11', to: TODAY });
  assert.deepEqual(presetRange('last30', TODAY), { from: '2026-10-19', to: TODAY });
  assert.deepEqual(presetRange('last90', TODAY), { from: '2026-08-20', to: TODAY });
  assert.deepEqual(presetRange('thisMonth', TODAY), { from: '2026-11-01', to: TODAY });
  assert.deepEqual(presetRange('thisYear', TODAY), { from: '2026-01-01', to: TODAY });
  assert.deepEqual(presetRange('lastYear', TODAY), { from: '2025-01-01', to: '2025-12-31' });
});

test('matchPreset finds an exact preset only', () => {
  assert.equal(matchPreset(presetRange('last90', TODAY), TODAY), 'last90');
  assert.equal(matchPreset({ from: '2026-11-02', to: TODAY }, TODAY), null);
});

test('autoBucket thresholds', () => {
  assert.equal(autoBucket({ from: '2026-10-18', to: TODAY }), 'day'); // 31 days
  assert.equal(autoBucket({ from: '2026-10-17', to: TODAY }), 'week'); // 32 days
  assert.equal(autoBucket(presetRange('last90', TODAY)), 'week');
  assert.equal(autoBucket({ from: '2026-05-21', to: TODAY }), 'month'); // 181 days
  assert.equal(autoBucket({ from: '2026-05-22', to: TODAY }), 'week'); // 180 days
  assert.equal(autoBucket({ from: '2024-01-01', to: TODAY }), 'month');
  assert.equal(autoBucket({ from: '2015-01-01', to: TODAY }), 'year');
  assert.equal(daySpan({ from: TODAY, to: TODAY }), 1);
});

test('resolveQuery falls back to last 30 days and the auto bucket', () => {
  assert.deepEqual(resolveQuery({ from: '', to: '', bucket: '' }, TODAY), {
    range: { from: '2026-10-19', to: TODAY },
    bucket: 'day',
  });
  assert.deepEqual(
    resolveQuery({ from: '2026-12-01', to: '2026-01-01', bucket: 'x' }, TODAY).range,
    {
      from: '2026-10-19',
      to: TODAY,
    },
  );
  assert.deepEqual(resolveQuery({ from: '2026-01-01', to: '2026-06-30', bucket: 'month' }, TODAY), {
    range: { from: '2026-01-01', to: '2026-06-30' },
    bucket: 'month',
  });
});

test('percentChange is null without a previous value', () => {
  assert.equal(percentChange(5, 0), null);
  assert.equal(percentChange(150, 100), 50);
  assert.equal(percentChange(50, 100), -50);
});

test('bucket labels', () => {
  assert.equal(bucketLabel('2026-11-17', '2026-11-17', 'day', 'en-GB'), '17 Nov');
  assert.equal(bucketLabel('2026-W47', '2026-11-16', 'week', 'en-GB'), 'W47');
  assert.equal(bucketLabel('2026', '2026-01-01', 'year', 'en-GB'), '2026');
  assert.equal(bucketTitle('2026-W47', '2026-11-16', 'week', 'en-GB'), '16–22 Nov 2026');
  assert.equal(bucketTitle('2026-W48', '2026-11-30', 'week', 'en-GB'), '30 Nov–6 Dec 2026');
});

test('rangeProblem names why a range is unusable', () => {
  assert.equal(rangeProblem({ from: '2026-01-01', to: '2026-02-01' }), null);
  assert.equal(rangeProblem({ from: '', to: '2026-02-01' }), 'incomplete');
  assert.equal(rangeProblem({ from: '2026-03-01', to: '2026-02-01' }), 'order');
  assert.equal(rangeProblem({ from: '2016-01-01', to: '2026-11-17' }), 'tooLong');
  assert.equal(rangeProblem({ from: '2016-11-19', to: '2026-11-17' }), null);
});
