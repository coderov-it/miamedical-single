/**
 * The period rules, on real dates.
 *
 * These exist because the return date is the one figure nobody types: a bug
 * here silently ships a contract for the wrong number of days, and neither the
 * customer nor the operator has anything to compare it against.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { convertDuration, resolvePeriod } from './period.ts';

const dayPackage = (duration: number) => ({ unit: 'day' as const, duration });
const hourPackage = (duration: number) => ({ unit: 'hour' as const, duration });

describe('resolvePeriod', () => {
  it('ends a 3-day package on the third day after the start', () => {
    assert.deepEqual(resolvePeriod('2026-08-10', null, dayPackage(3)), {
      startDate: '2026-08-10',
      startTime: null,
      endDate: '2026-08-13',
      endTime: null,
      duration: 3,
      unit: 'day',
    });
  });

  it('carries a day package across a month boundary', () => {
    assert.equal(resolvePeriod('2026-08-30', null, dayPackage(7))?.endDate, '2026-09-06');
  });

  it('carries a day package across a leap day', () => {
    assert.equal(resolvePeriod('2028-02-27', null, dayPackage(3))?.endDate, '2028-03-01');
  });

  /* Europe/Rome loses an hour on the last Sunday in March. Local-time arithmetic
     would land this at 23:00 on the 6th; the rental is still exactly 7 days. */
  it('keeps a 7-day rental exactly 7 days across the spring DST change', () => {
    assert.equal(resolvePeriod('2026-03-25', null, dayPackage(7))?.endDate, '2026-04-01');
  });

  it('keeps a 7-day rental exactly 7 days across the autumn DST change', () => {
    assert.equal(resolvePeriod('2026-10-22', null, dayPackage(7))?.endDate, '2026-10-29');
  });

  it('ignores a time of day on a day package', () => {
    const period = resolvePeriod('2026-08-10', '14:30', dayPackage(2));
    assert.equal(period?.startTime, null);
    assert.equal(period?.endTime, null);
    assert.equal(period?.endDate, '2026-08-12');
  });

  it('rolls an hour package past midnight', () => {
    assert.deepEqual(resolvePeriod('2026-08-10', '22:00', hourPackage(4)), {
      startDate: '2026-08-10',
      startTime: '22:00',
      endDate: '2026-08-11',
      endTime: '02:00',
      duration: 4,
      unit: 'hour',
    });
  });

  it('keeps an hour package on the same day when it fits', () => {
    const period = resolvePeriod('2026-08-10', '09:15', hourPackage(4));
    assert.equal(period?.endDate, '2026-08-10');
    assert.equal(period?.endTime, '13:15');
  });

  it('refuses an hour package with no time of day', () => {
    assert.equal(resolvePeriod('2026-08-10', null, hourPackage(4)), null);
  });

  it('refuses a malformed or impossible date rather than guessing', () => {
    assert.equal(resolvePeriod('10/08/2026', null, dayPackage(3)), null);
    assert.equal(resolvePeriod('2026-02-31', null, dayPackage(3)), null);
    assert.equal(resolvePeriod('', null, dayPackage(3)), null);
  });

  it('refuses a malformed time rather than guessing', () => {
    assert.equal(resolvePeriod('2026-08-10', '25:00', hourPackage(4)), null);
    assert.equal(resolvePeriod('2026-08-10', '9:15', hourPackage(4)), null);
  });

  it('refuses a duration that is not a whole positive number', () => {
    assert.equal(resolvePeriod('2026-08-10', null, dayPackage(0)), null);
    assert.equal(resolvePeriod('2026-08-10', null, dayPackage(1.5)), null);
  });
});

describe('convertDuration', () => {
  it('leaves a duration alone in its own unit', () => {
    assert.equal(convertDuration(9, 'day', 'day'), 9);
    assert.equal(convertDuration(4, 'hour', 'hour'), 4);
  });

  it('rounds a part-day up to a whole day', () => {
    assert.equal(convertDuration(12, 'hour', 'day'), 1);
    assert.equal(convertDuration(24, 'hour', 'day'), 1);
    assert.equal(convertDuration(25, 'hour', 'day'), 2);
  });

  it('reads days as hours exactly', () => {
    assert.equal(convertDuration(3, 'day', 'hour'), 72);
  });
});
