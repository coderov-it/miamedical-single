/**
 * Date math for the sales analytics page. Pure and locale-free except where a
 * `locale` is passed in, so it runs under node:test. Days are plain
 * `YYYY-MM-DD` strings (Europe/Rome calendar days, as the server buckets them);
 * they are only turned into `Date`s at UTC midnight for arithmetic, which keeps
 * DST out of every calculation.
 */

export type Bucket = 'day' | 'week' | 'month' | 'year';
export type PresetId = 'last7' | 'last30' | 'last90' | 'thisMonth' | 'thisYear' | 'lastYear';
export interface DayRange {
  from: string;
  to: string;
}

export const BUCKETS: readonly Bucket[] = ['day', 'week', 'month', 'year'];
export const PRESETS: readonly PresetId[] = [
  'last7',
  'last30',
  'last90',
  'thisMonth',
  'thisYear',
  'lastYear',
];
export const DEFAULT_PRESET: PresetId = 'last30';

const DAY_MS = 86_400_000;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function parse(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isDay(value: string): boolean {
  return ISO_DAY.test(value) && iso(parse(value)) === value;
}

export function isBucket(value: string): value is Bucket {
  return (BUCKETS as readonly string[]).includes(value);
}

/** Today's calendar day in Europe/Rome, whatever the browser's own zone is. */
export function todayRome(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function addDays(day: string, days: number): string {
  return iso(new Date(parse(day).getTime() + days * DAY_MS));
}

/** Inclusive number of days in the range. */
export function daySpan(range: DayRange): number {
  return Math.round((parse(range.to).getTime() - parse(range.from).getTime()) / DAY_MS) + 1;
}

export function presetRange(id: PresetId, today: string): DayRange {
  const year = Number(today.slice(0, 4));
  switch (id) {
    case 'last7':
      return { from: addDays(today, -6), to: today };
    case 'last30':
      return { from: addDays(today, -29), to: today };
    case 'last90':
      return { from: addDays(today, -89), to: today };
    case 'thisMonth':
      return { from: `${today.slice(0, 7)}-01`, to: today };
    case 'thisYear':
      return { from: `${year}-01-01`, to: today };
    case 'lastYear':
      return { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` };
  }
}

/** The preset a range equals exactly, so the toolbar can highlight it. */
export function matchPreset(range: DayRange, today: string): PresetId | null {
  return (
    PRESETS.find((id) => {
      const candidate = presetRange(id, today);
      return candidate.from === range.from && candidate.to === range.to;
    }) ?? null
  );
}

export function autoBucket(range: DayRange): Bucket {
  const span = daySpan(range);
  if (span <= 31) return 'day';
  if (span <= 180) return 'week';
  if (span <= 1100) return 'month';
  return 'year';
}

export const MAX_SPAN_DAYS = 3660;
export type RangeProblem = 'incomplete' | 'order' | 'tooLong';

/** Why a range cannot be sent, or `null` when it can. The server rejects spans over 3660 days. */
export function rangeProblem(range: DayRange): RangeProblem | null {
  if (!isDay(range.from) || !isDay(range.to)) return 'incomplete';
  if (range.from > range.to) return 'order';
  if (daySpan(range) > MAX_SPAN_DAYS) return 'tooLong';
  return null;
}

/** A range the page can send. */
export function isValidRange(range: DayRange): boolean {
  return rangeProblem(range) === null;
}

/**
 * What the URL says, resolved: a valid `from`/`to` pair wins, otherwise the
 * default preset; a missing or unknown bucket falls back to the auto choice.
 */
export function resolveQuery(
  query: { from: string; to: string; bucket: string },
  today: string,
): { range: DayRange; bucket: Bucket } {
  const asked = { from: query.from, to: query.to };
  const range = isValidRange(asked) ? asked : presetRange(DEFAULT_PRESET, today);
  const bucket = isBucket(query.bucket) ? query.bucket : autoBucket(range);
  return { range, bucket };
}

/** Percentage change, or `null` when there is no previous value to compare. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

// --- labels ------------------------------------------------------------------

function fmt(day: string, locale: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...options }).format(parse(day));
}

/** Axis label for a bucket: `17 nov`, `W47`, `nov 2026`, `2026`. */
export function bucketLabel(key: string, start: string, bucket: Bucket, locale: string): string {
  if (bucket === 'day') return fmt(start, locale, { day: 'numeric', month: 'short' });
  if (bucket === 'week') return `W${key.split('-W')[1] ?? ''}`;
  if (bucket === 'month') return fmt(start, locale, { month: 'short', year: 'numeric' });
  return key;
}

/** Tooltip title: a week spells out its span, `16–22 nov 2026`; others reuse the axis label. */
export function bucketTitle(key: string, start: string, bucket: Bucket, locale: string): string {
  if (bucket === 'day')
    return fmt(start, locale, { day: 'numeric', month: 'short', year: 'numeric' });
  if (bucket !== 'week') return bucketLabel(key, start, bucket, locale);

  const end = addDays(start, 6);
  const endText = fmt(end, locale, { day: 'numeric', month: 'short', year: 'numeric' });
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  const startText = fmt(
    start,
    locale,
    sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'short' },
  );
  return `${startText}–${endText}`;
}
