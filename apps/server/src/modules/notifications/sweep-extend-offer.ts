import type { Database } from '@mia/db';
import { and, eq, sql } from '@mia/db';
import { orderItems, orders } from '@mia/db/schema';

import {
  isRentalLine,
  rentalEndDate,
  rentalOrderOpen,
  rentalStartDate,
  rentalStartedSql,
  romeTodaySql,
} from '../../shared/rental-calendar.ts';
import * as links from './links.ts';
import * as mail from './mail.ts';
import { extendOfferKey } from './reminder-keys.ts';
import { emit } from './write.ts';

/**
 * The "extend your rental?" offer, sent once per end date when a fifth of the
 * current span is left. The span restarts with each extension, so an extended
 * rental is offered again before its new end:
 *
 *   1. Oct 1 → Oct 8   (7 days)    20% = 1.4 → 2 days left   → offer on Oct 6
 *   2. Oct 8 → Oct 15  (extended)  span 7 again              → offer on Oct 13
 *   3. Oct 1 → Oct 31  (30 days)   20% = 6 days left         → offer on Oct 25
 *   4. Oct 1 → Oct 2   (1 day)     floor of 1 day left       → offer on Oct 1
 *
 * The window is "at most N days left", not "exactly N", so a sweep that missed
 * the day (server down) still sends it while the rental is running. It never
 * fires past the end date: by then the operator's overdue process owns it.
 * Nor before the delivery day (the booked start date): a rental not yet with
 * the customer is not offered an extension. The dedupe key carries the end
 * date, so step 2's offer is a new row, not a repeat of step 1's.
 * Customers with an account only — the offer is a button on their order page.
 */

const OFFER_SHARE = 0.2;

/** Where the current span starts: the newest active extension, else the rental itself. */
const spanStart = sql<string>`COALESCE(
  (SELECT re.from_date FROM rental_extensions re
   WHERE re.order_id = ${orders.id} AND re.status = 'active'
   ORDER BY re.to_date DESC LIMIT 1),
  (${rentalStartDate})::date
)`;

export async function sweepExtendOffers(db: Database): Promise<number> {
  const daysLeft = sql<number>`((${rentalEndDate})::date - ${romeTodaySql})`;
  const spanDays = sql<number>`((${rentalEndDate})::date - ${spanStart})`;

  const due = await db
    .selectDistinct({
      orderId: orders.id,
      orderNumber: orders.number,
      customerAccountId: orders.customerAccountId,
      email: orders.email,
      firstName: orders.firstName,
      lastName: orders.lastName,
      productTitle: orderItems.productTitle,
      endsOn: rentalEndDate,
      daysLeft,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        isRentalLine,
        sql`COALESCE(${orderItems.configuration}->'rental'->>'unit', 'day') = 'day'`,
        sql`${orders.customerAccountId} IS NOT NULL`,
        rentalOrderOpen(),
        rentalStartedSql,
        sql`${daysLeft} >= 0`,
        sql`${daysLeft} <= GREATEST(1, CEIL(${spanDays} * ${OFFER_SHARE}::numeric))`,
        sql`NOT EXISTS (
          SELECT 1 FROM rental_extensions re
          WHERE re.order_id = ${orders.id}
          AND re.status IN ('renew_pending', 'awaiting_signature')
        )`,
      ),
    );

  /* A multi-line order yields a row per line; one offer per order and end date. */
  const seen = new Set<string>();
  let written = 0;
  for (const rental of due) {
    const accountId = rental.customerAccountId;
    const key = extendOfferKey(rental.orderId, rental.endsOn);
    if (!accountId || seen.has(key)) continue;
    seen.add(key);

    const id = await db.transaction((tx) =>
      emit(tx, {
        audience: 'customer',
        customerAccountId: accountId,
        type: 'rental.extend_offer',
        orderId: rental.orderId,
        data: { orderNumber: rental.orderNumber, endsOn: rental.endsOn, daysLeft: rental.daysLeft },
        dedupeKey: key,
      }),
    );
    if (!id) continue;
    written += 1;

    /* The email goes only with a NEW row — the dedupe key is what stops a
       restart from mailing the same offer twice. */
    await mail.sendRentalReminder(
      {
        email: rental.email,
        customerName: `${rental.firstName ?? ''} ${rental.lastName ?? ''}`.trim(),
        orderNumber: rental.orderNumber,
        productTitle: rental.productTitle,
        rentalEndDate: rental.endsOn,
        extendUrl: links.accountOrderUrl(rental.orderNumber),
      },
      { db, orderId: rental.orderId },
    );
  }
  return written;
}
