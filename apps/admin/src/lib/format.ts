/**
 * Display formatting. Every helper here answers one question the same way:
 * what do we render when we do not have the value?
 *
 * The em-dash rule: `—` means "there is nothing here", and only absence is
 * allowed to produce it. A value we *do* have but cannot parse is a bug, and
 * rendering it as `—` disguises the bug as a deliberate blank — those return
 * the raw input so it shows up. Nothing here ever renders `NaN` or
 * `Invalid Date`.
 */

export const EM_DASH = '—';

/**
 * Dates render as `en-GB`: day-first and 24-hour, matching how an Italian
 * back office reads a date, but with English month names so they do not clash
 * with the (English) UI chrome. Money is deliberately different — see
 * `formatMoney`.
 */
const DATE_LOCALE = 'en-GB';

/** What the customer's invoice says, so the admin and the storefront agree. */
const MONEY_LOCALE = 'it-IT';

export type DateInput = string | number | Date | null | undefined;

/** `null` for absent *and* for unparseable, so callers can tell them apart. */
function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function format(value: DateInput, options: Intl.DateTimeFormatOptions): string {
  const date = toDate(value);
  if (date) return new Intl.DateTimeFormat(DATE_LOCALE, options).format(date);
  // Absent → the em dash. Present but unparseable → show what we were given.
  return value === null || value === undefined || value === '' ? EM_DASH : String(value);
}

/** `7 Aug 2026` */
export function formatDate(value: DateInput): string {
  return format(value, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** `7 Aug 2026, 14:53` */
export function formatDateTime(value: DateInput): string {
  return format(value, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** `14:53` — for grouping several events inside one day. */
export function formatTime(value: DateInput): string {
  return format(value, { hour: '2-digit', minute: '2-digit' });
}

const DIVISIONS = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
] as const satisfies readonly { amount: number; unit: Intl.RelativeTimeFormatUnit }[];

/**
 * `3 hours ago`. Pass `now` to keep a list of rows consistent with each other —
 * formatting each row against its own `new Date()` can render two events a
 * millisecond apart as "1 minute ago" and "2 minutes ago".
 */
export function relativeTime(value: DateInput, now: Date = new Date()): string {
  const date = toDate(value);
  if (!date) return value === null || value === undefined || value === '' ? EM_DASH : String(value);

  const formatter = new Intl.RelativeTimeFormat(DATE_LOCALE, { numeric: 'auto' });
  let duration = (date.getTime() - now.getTime()) / 1000;

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return formatDate(date);
}

/**
 * `amount` is the wire's decimal string ("35.00"). It is only ever a string:
 * money is `numeric(12,2)` in Postgres and stays exact across the wire, so
 * this hands it to `Intl` for display and nothing else does arithmetic on it.
 */
export function formatMoney(
  amount: string | null | undefined,
  currency = 'EUR',
  locale = MONEY_LOCALE,
): string {
  if (amount === null || amount === undefined || amount === '') return EM_DASH;
  const value = Number(amount);
  if (Number.isNaN(value)) return String(amount);
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

/** `1,204` — thousands separators for counts and quantities. */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return EM_DASH;
  return new Intl.NumberFormat(DATE_LOCALE).format(value);
}

/** Anything empty becomes the em dash; whitespace-only counts as empty. */
export function orDash(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return EM_DASH;
  const text = String(value);
  return text.trim() === '' ? EM_DASH : text;
}

/** `1 product` / `3 products`. Irregular plurals pass their own. */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}

/** `1.4 MB`. Used by the media tiles, which deal in bytes from the File API. */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes)) return EM_DASH;
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}
