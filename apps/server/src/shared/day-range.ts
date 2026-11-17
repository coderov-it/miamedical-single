/**
 * Calendar-day helpers shared by every date-range query (sales analytics, stock
 * history). Days are `YYYY-MM-DD` strings throughout — never `Date` objects, so
 * no server time zone leaks in. Each module keeps its own default span.
 */

export const MAX_SPAN_DAYS = 3660;
const DAY_MS = 86_400_000;

export interface DayRange {
  from: string;
  to: string;
}

/** A range the caller got wrong; the route turns it into a 422 on `field`. */
export class DayRangeError extends Error {
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

/** Throws a `DayRangeError` unless both are real days, ordered, and at most 3660 days apart. */
export function assertDayRange(from: string, to: string): void {
  if (!isRealDay(to)) throw new DayRangeError('to', 'Not a real date.');
  if (!isRealDay(from)) throw new DayRangeError('from', 'Not a real date.');
  if (from > to) throw new DayRangeError('from', 'Must not be after the end date.');
  if (spanDays(from, to) > MAX_SPAN_DAYS) {
    throw new DayRangeError('from', `The range is limited to ${MAX_SPAN_DAYS} days.`);
  }
}
