/**
 * Pure date helpers for the sales analytics query. Days are `YYYY-MM-DD`
 * strings throughout — never `Date` objects, so no server time zone leaks in.
 * Worked example: docs/code/sales-analytics.md.
 */

import {
  addDays,
  assertDayRange,
  type DayRange,
  romeToday,
  spanDays,
} from '../../shared/day-range.ts';

export const BUCKETS = ['day', 'week', 'month', 'year'] as const;
export type Bucket = (typeof BUCKETS)[number];

const DEFAULT_SPAN_DAYS = 30;

export interface SalesInput {
  from?: string | undefined;
  to?: string | undefined;
  bucket?: Bucket | undefined;
}

export interface ResolvedRange {
  range: DayRange;
  previous: DayRange;
  bucket: Bucket;
}

export function resolveRange(input: SalesInput, now: Date = new Date()): ResolvedRange {
  const to = input.to ?? romeToday(now);
  const from = input.from ?? addDays(to, 1 - DEFAULT_SPAN_DAYS);
  assertDayRange(from, to);
  const span = spanDays(from, to);
  return {
    range: { from, to },
    previous: { from: addDays(from, -span), to: addDays(from, -1) },
    bucket: input.bucket ?? 'day',
  };
}
