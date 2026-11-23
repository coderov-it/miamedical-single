/**
 * The rental period after a delivery. A rental starts when its order is marked
 * `delivered`: the booked start is only the plan, and the booked LENGTH is kept.
 *
 *   booked 2026-11-10 → 2026-11-20, delivered 2026-11-11  →  2026-11-11 → 2026-11-21
 *   booked 2026-11-10 → 2026-11-20, delivered 2026-11-09  →  2026-11-09 → 2026-11-19
 *
 * The first delivery copies the original dates into `bookedStartDate` /
 * `bookedEndDate` (the plan stays readable); a later one reads them back, so the
 * length never drifts. Time of day and duration are untouched. Contracts already
 * signed are not re-rendered; those generated afterwards read the shifted dates.
 * See /docs/code/order-delivery-and-return.md.
 */

import { addDays, spanDays } from '../../shared/day-range.ts';

export interface RentalPeriod {
  startDate?: unknown;
  endDate?: unknown;
  bookedStartDate?: unknown;
  bookedEndDate?: unknown;
  [key: string]: unknown;
}

const isDay = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

/** The rental object with its dates moved to `deliveredOn`, or null when it has no start. */
export function shiftRentalToDelivery(
  rental: RentalPeriod,
  deliveredOn: string,
): RentalPeriod | null {
  const hasBooked = isDay(rental.bookedStartDate);
  const bookedStart = hasBooked ? rental.bookedStartDate : rental.startDate;
  const bookedEnd = hasBooked ? rental.bookedEndDate : rental.endDate;
  if (!isDay(bookedStart)) return null;

  const shifted: RentalPeriod = {
    ...rental,
    bookedStartDate: bookedStart,
    bookedEndDate: bookedEnd ?? null,
    startDate: deliveredOn,
  };
  if (isDay(bookedEnd))
    shifted.endDate = addDays(deliveredOn, spanDays(bookedStart, bookedEnd) - 1);
  return shifted;
}
