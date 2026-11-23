import assert from 'node:assert/strict';
import { test } from 'node:test';

import { expiredDays, manualTarget, nextSlotStart, scheduledTarget, slotStart } from './naming.ts';

const NOW = new Date('2026-11-23T06:30:00Z');

test('slotStart floors to the 4h UTC slot', () => {
  assert.equal(slotStart(NOW).toISOString(), '2026-11-23T04:00:00.000Z');
  assert.equal(
    slotStart(new Date('2026-11-23T23:59:59Z')).toISOString(),
    '2026-11-23T20:00:00.000Z',
  );
  assert.equal(
    slotStart(new Date('2026-11-23T00:00:00Z')).toISOString(),
    '2026-11-23T00:00:00.000Z',
  );
});

test('scheduledTarget carries the slot time', () => {
  const target = scheduledTarget({ localDir: '/b', folder: 'miamedical-prod' }, slotStart(NOW));
  const name = 'miamedical-prod_2026-11-23_04-00Z.dump';
  assert.deepEqual(target, {
    fileName: name,
    localPath: `/b/miamedical-prod/2026-11-23/${name}`,
    r2Key: `miamedical-prod/2026-11-23/${name}`,
  });
});

test('manualTarget goes to the manual_ day folder with the minute', () => {
  const now = new Date('2026-11-23T14:32:10Z');
  const name = 'before-price-update_2026-11-23_14-32Z.dump';
  assert.deepEqual(
    manualTarget({ localDir: '/b', folder: 'miamedical-prod' }, 'before-price-update', now),
    {
      fileName: name,
      localPath: `/b/miamedical-prod/manual_2026-11-23/${name}`,
      r2Key: `miamedical-prod/manual_2026-11-23/${name}`,
    },
  );
});

test('expiredDays keeps today and 9 previous days', () => {
  assert.deepEqual(expiredDays(['2026-11-14', '2026-11-13', '2026-11-23'], NOW), ['2026-11-13']);
});

test('expiredDays ignores anything that is not a YYYY-MM-DD name', () => {
  assert.deepEqual(expiredDays(['.lock', 'foo', '2026-1-1'], NOW), []);
});

test('expiredDays never expires a manual_ folder', () => {
  assert.deepEqual(expiredDays(['manual_2026-11-01', '2026-11-01'], NOW), ['2026-11-01']);
});

test('nextSlotStart is the start of the following 4-hour slot', () => {
  assert.equal(
    nextSlotStart(new Date('2026-11-23T06:30:00Z')).toISOString(),
    '2026-11-23T08:00:00.000Z',
  );
  assert.equal(
    nextSlotStart(new Date('2026-11-23T23:10:00Z')).toISOString(),
    '2026-11-24T00:00:00.000Z',
  );
  assert.equal(
    nextSlotStart(new Date('2026-11-23T08:00:00Z')).toISOString(),
    '2026-11-23T12:00:00.000Z',
  );
});
