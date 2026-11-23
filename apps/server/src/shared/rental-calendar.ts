import { inArray, notInArray, sql } from '@mia/db';
import { orderItems, orders } from '@mia/db/schema';

import type { OrderStatus } from '../modules/orders/status.ts';

/**
 * What every rental reader agrees on: which orders are over, what day it is,
 * and whether the rental has begun. The rentals list, the notification sweeps
 * and rental extensions all read these, so "closed" and "today" cannot come to
 * mean different things in different screens. See
 * docs/code/notifications-live.md, "The sweep".
 */

/**
 * The equipment is back (`received`, then `fulfilled` once every unit is
 * inspected) or the order never ran or was unwound (`cancelled`, `refunded`).
 * No countdown, no extension, listed as completed.
 */
export const CLOSED_RENTAL_ORDER_STATUSES = [
  'received',
  'fulfilled',
  'cancelled',
  'refunded',
] as const satisfies readonly OrderStatus[];

export function isClosedRentalOrderStatus(status: string): boolean {
  return (CLOSED_RENTAL_ORDER_STATUSES as readonly string[]).includes(status);
}

/** SQL: the order is still running (or yet to run). */
export function rentalOrderOpen() {
  return notInArray(orders.status, [...CLOSED_RENTAL_ORDER_STATUSES]);
}

/** SQL: the order is over — the rentals list's "completed" filter. */
export function rentalOrderClosed() {
  return inArray(orders.status, [...CLOSED_RENTAL_ORDER_STATUSES]);
}

export const RENTAL_TIME_ZONE = 'Europe/Rome';

/**
 * Today's calendar date in Rome, `YYYY-MM-DD` (not the UTC date `toISOString()`
 * gives): `2026-10-12T22:30:00Z` is "2026-10-13" here. One implementation, in
 * day-range.ts; re-exported so rental call sites do not change.
 */
export { romeToday } from './day-range.ts';

/** SQL: the same date, from the database clock. */
export const romeTodaySql = sql`(now() AT TIME ZONE 'Europe/Rome')::date`;

/** The booked period, read from an order line's configuration snapshot. */
export const rentalStartDate = sql<string>`${orderItems.configuration}->'rental'->>'startDate'`;
export const rentalEndDate = sql<string>`${orderItems.configuration}->'rental'->>'endDate'`;
export const isRentalLine = sql`${orderItems.configuration}->>'pricingMode' = 'rental'`;

/** The statuses in which the equipment is with the customer. */
export const RENTAL_RUNNING_STATUSES = [
  'delivered',
  'out_for_pickup',
  'pickup_missed',
] as const satisfies readonly OrderStatus[];

/**
 * SQL: the rental has started. A rental starts when its order is marked
 * `delivered` (the line's start and end dates were shifted to the delivery day
 * in that same move, see orders/delivery-dates.ts), and stays started through
 * the pickup statuses. An extension keeps the original start date, so this stays
 * true through it.
 */
export const rentalStartedSql = sql`${orders.status} IN (${sql.join(
  RENTAL_RUNNING_STATUSES.map((status) => sql`${status}`),
  sql`, `,
)})`;
