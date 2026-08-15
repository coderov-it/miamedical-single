/**
 * When a rental starts and when it comes back.
 *
 * The customer picks a package and a start. They never pick an end — the
 * package's duration decides it, so there is exactly one return date and
 * nobody has to agree on it. Three days from 10 August ends 13 August.
 *
 * It lives beside `request.ts` for the same reason that file gives: the
 * storefront paints this period and the server stores it, and two
 * implementations of "when does it come back" is one too many.
 *
 * All arithmetic runs on UTC epoch milliseconds. The shop is in Europe/Rome,
 * where two days a year are 23 and 25 hours long, and a seven-day rental that
 * crosses one of them is still seven days — local-time arithmetic would land it
 * an hour out and, at the wrong hour, a whole day out.
 */

import type { RentalUnit } from './request.ts';

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{2}):(\d{2})$/;

/** What a package needs to place a period. The rest of it does not matter here. */
export interface PeriodPackage {
  unit: RentalUnit;
  duration: number;
}

export interface RentalPeriod {
  /** ISO `YYYY-MM-DD`. */
  startDate: string;
  /** `HH:MM`, and only on an hour package — a day package has no time of day. */
  startTime: string | null;
  endDate: string;
  endTime: string | null;
  duration: number;
  unit: RentalUnit;
}

/** `2026-08-10` → epoch ms at UTC midnight, or `null` if it is not a real date. */
function parseDate(value: string): number | null {
  const match = DATE_RE.exec(value);
  if (!match) return null;

  const [, year, month, day] = match as unknown as [string, string, string, string];
  const stamp = Date.UTC(Number(year), Number(month) - 1, Number(day));
  // `Date.UTC` rolls 31 February over to 3 March rather than refusing it, so the
  // only way to reject an impossible date is to read the result back.
  return new Date(stamp).toISOString().slice(0, 10) === value ? stamp : null;
}

/** `14:30` → milliseconds past midnight, or `null` if it is not a real time. */
function parseTime(value: string): number | null {
  const match = TIME_RE.exec(value);
  if (!match) return null;

  const [, hours, minutes] = match as unknown as [string, string, string];
  const hour = Number(hours);
  const minute = Number(minutes);
  if (hour > 23 || minute > 59) return null;

  return hour * HOUR_MS + minute * 60_000;
}

/**
 * The period a package and a start date describe, or `null` when they do not
 * describe one: a malformed date, a duration that is not a whole positive
 * number, or an hour package with no time of day.
 *
 * `null` is a refusal, never a guess. The storefront shows nothing rather than
 * a return date it invented, and the server rejects the line.
 */
export function resolvePeriod(
  startDate: string,
  startTime: string | null,
  pkg: PeriodPackage,
): RentalPeriod | null {
  const day = parseDate(startDate);
  if (day === null) return null;
  if (!Number.isInteger(pkg.duration) || pkg.duration < 1) return null;

  if (pkg.unit === 'day') {
    const end = new Date(day + pkg.duration * DAY_MS);
    return {
      startDate,
      startTime: null,
      endDate: end.toISOString().slice(0, 10),
      endTime: null,
      duration: pkg.duration,
      unit: 'day',
    };
  }

  if (startTime === null) return null;
  const offset = parseTime(startTime);
  if (offset === null) return null;

  const end = new Date(day + offset + pkg.duration * HOUR_MS);
  const iso = end.toISOString();
  return {
    startDate,
    startTime,
    endDate: iso.slice(0, 10),
    endTime: iso.slice(11, 16),
    duration: pkg.duration,
    unit: 'hour',
  };
}

/**
 * A package duration read in another unit, rounded UP to a whole one.
 *
 * It exists for add-ons, which carry their own unit: a 3,00 €/giorno insurance
 * on a 12-hour package bills one day, because half a day of cover is still a
 * day of cover, and half of a price the back office typed is a figure nobody
 * agreed to.
 */
export function convertDuration(duration: number, from: RentalUnit, to: RentalUnit): number {
  if (from === to) return duration;
  if (from === 'hour') return Math.ceil(duration / 24);
  return duration * 24;
}
