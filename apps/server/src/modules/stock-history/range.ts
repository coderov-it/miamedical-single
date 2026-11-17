/** The stock history's date range: the shared day rules, with a 90-day default. */

import { addDays, assertDayRange, type DayRange, romeToday } from '../../shared/day-range.ts';

export const DEFAULT_SPAN_DAYS = 90;

/** Defaults to the last 90 days ending today (Rome). */
export function resolveRange(
  input: { from?: string | undefined; to?: string | undefined },
  now: Date = new Date(),
): DayRange {
  const to = input.to ?? romeToday(now);
  const from = input.from ?? addDays(to, 1 - DEFAULT_SPAN_DAYS);
  assertDayRange(from, to);
  return { from, to };
}
