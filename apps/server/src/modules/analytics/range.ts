/**
 * Pure date helpers for the sales analytics query. Days are `YYYY-MM-DD`
 * strings throughout — never `Date` objects, so no server time zone leaks in.
 * Worked example: docs/code/sales-analytics.md.
 */

export const BUCKETS = ['day', 'week', 'month', 'year'] as const;
export type Bucket = (typeof BUCKETS)[number];

export const MAX_SPAN_DAYS = 3660;
const DEFAULT_SPAN_DAYS = 30;
const DAY_MS = 86_400_000;

export interface SalesInput {
  from?: string | undefined;
  to?: string | undefined;
  bucket?: Bucket | undefined;
}

export interface DayRange {
  from: string;
  to: string;
}

export interface ResolvedRange {
  range: DayRange;
  previous: DayRange;
  bucket: Bucket;
}

/** A range the caller got wrong; the route turns it into a 422. */
export class SalesRangeError extends Error {
  field: 'from' | 'to';
  constructor(field: 'from' | 'to', message: string) {
    super(message);
    this.field = field;
  }
}

/** Today's date in Italy, whatever the server's own zone is. */
export function romeToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function toMs(day: string): number {
  return Date.parse(`${day}T00:00:00Z`);
}

export function addDays(day: string, days: number): string {
  return new Date(toMs(day) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Inclusive number of days from `from` to `to`. */
export function spanDays(from: string, to: string): number {
  return Math.round((toMs(to) - toMs(from)) / DAY_MS) + 1;
}

/** `2026-02-30` matches the shape but is not a day; round-tripping catches it. */
export function isRealDay(day: string): boolean {
  const ms = toMs(day);
  return !Number.isNaN(ms) && new Date(ms).toISOString().slice(0, 10) === day;
}

export function resolveRange(input: SalesInput, now: Date = new Date()): ResolvedRange {
  const to = input.to ?? romeToday(now);
  const from = input.from ?? addDays(to, 1 - DEFAULT_SPAN_DAYS);
  if (!isRealDay(to)) throw new SalesRangeError('to', 'Not a real date.');
  if (!isRealDay(from)) throw new SalesRangeError('from', 'Not a real date.');
  if (from > to) throw new SalesRangeError('from', 'Must not be after the end date.');
  const span = spanDays(from, to);
  if (span > MAX_SPAN_DAYS) {
    throw new SalesRangeError('from', `The range is limited to ${MAX_SPAN_DAYS} days.`);
  }
  return {
    range: { from, to },
    previous: { from: addDays(from, -span), to: addDays(from, -1) },
    bucket: input.bucket ?? 'day',
  };
}
