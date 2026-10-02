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
 * The equipment is back (`fulfilled`) or the order never ran or was unwound
 * (`cancelled`, `refunded`). No countdown, no extension, listed as completed.
 */
export const CLOSED_RENTAL_ORDER_STATUSES = [
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
 * Today's calendar date in Rome, `YYYY-MM-DD`. Not `toISOString()`, which is
 * the UTC date: between 00:00 and 02:00 in Rome it is still yesterday there.
 *
 *   2026-10-12T22:30:00Z  → toISOString "2026-10-12"   romeToday "2026-10-13"
 */
export function romeToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: RENTAL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** SQL: the same date, from the database clock. */
export const romeTodaySql = sql`(now() AT TIME ZONE 'Europe/Rome')::date`;

/** The booked period, read from an order line's configuration snapshot. */
export const rentalStartDate = sql<string>`${orderItems.configuration}->'rental'->>'startDate'`;
export const rentalEndDate = sql<string>`${orderItems.configuration}->'rental'->>'endDate'`;
export const isRentalLine = sql`${orderItems.configuration}->>'pricingMode' = 'rental'`;

/**
 * SQL: the rental has started. There is no "delivered" status; the booked start
 * date is the delivery day, so from that day the equipment is with the customer.
 * An extension keeps the original start date, so this stays true through it.
 */
export const rentalStartedSql = sql`(${rentalStartDate})::date <= ${romeTodaySql}`;
