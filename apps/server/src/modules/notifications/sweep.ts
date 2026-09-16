import type { Database } from '@mia/db';
import { and, eq, notInArray, sql } from '@mia/db';
import { contracts, orderItems, orders } from '@mia/db/schema';

import { emit, emitToAdmins } from './write.ts';

/**
 * The events no transaction will ever produce.
 *
 * "The rental ends in three days" is not something that happens — it becomes
 * true while the process sits idle. It needs a clock, and a clock needs a way to
 * not repeat itself. That is `dedupe_key` and the partial unique index behind
 * it: a restart, an overlapping tick and a second API worker all converge on one
 * row, with no watermark, no advisory lock and no decision about which box runs
 * the cron.
 *
 * Same shape as `media/sweep.ts` — run at boot, then hourly, unref'd. An hourly
 * tick is deliberately coarse: these notices are measured in days, and scanning
 * every minute would run the same query sixty times over to move the delivery
 * moment around inside the hour.
 *
 * Both audiences are raised here. The operator gets one operational reminder;
 * the customer gets the countdown, because it is their deadline.
 */

const SWEEP_INTERVAL_MS = 60 * 60 * 1000;

/**
 * One operational reminder, at three days. The operator wants the call to be
 * makeable, not a countdown: T−7 is too early to do anything about and T−1 is
 * too late to arrange a collection.
 */
const ADMIN_RENTAL_THRESHOLD_DAYS = 3;

/**
 * The customer's countdown. Three notices, spaced so each one is actionable: a
 * week out you can still plan around it, three days out you can arrange the
 * collection, the day before is the last useful reminder.
 *
 * `ADMIN_RENTAL_THRESHOLD_DAYS` is one of these on purpose — at T−3 both
 * audiences are told, from one pass over one query, and the dedupe keys keep
 * them separate rows.
 */
const CUSTOMER_RENTAL_THRESHOLD_DAYS = [7, 3, 1] as const;

/** Every threshold the end-of-rental pass looks for, ascending. */
const RENTAL_THRESHOLD_DAYS = [
  ...new Set<number>([...CUSTOMER_RENTAL_THRESHOLD_DAYS, ADMIN_RENTAL_THRESHOLD_DAYS]),
].sort((a, b) => a - b);

/**
 * How long before a rental starts the customer is told.
 *
 * One notice, not a countdown: this exists because somebody has to be at the
 * address when the equipment arrives, and two days is enough warning to move
 * that without being so early that it is forgotten by the time it matters.
 */
const UPCOMING_RENTAL_DAYS = 2;

/**
 * How long an unsigned contract stops being "waiting" and starts being
 * "stalled". The status machine refuses `pending → paid` on a rental order until
 * its newest contract is signed, so past this the order is not slow — it is
 * stuck behind a click nobody is chasing.
 */
const CONTRACT_STALL_HOURS = 48;

const rentalStartDate = sql<string>`${orderItems.configuration}->'rental'->>'startDate'`;
const rentalEndDate = sql<string>`${orderItems.configuration}->'rental'->>'endDate'`;
const pricingMode = sql<string>`${orderItems.configuration}->>'pricingMode'`;

/**
 * Calendar days in Europe/Rome, not 72 hours: an operator told "3 days left" on
 * a rental ending Friday means Tuesday, whatever time the tick fired.
 */
const romeToday = sql`(now() AT TIME ZONE 'Europe/Rome')::date`;

/**
 * Rentals reaching their end date at one of the thresholds.
 *
 * ONE query for every threshold, with the days-left arithmetic done in the
 * SELECT rather than the WHERE, so a customer notice and the operator's copy of
 * the same rental are decided from one row. Two passes would mean two
 * definitions of "three days left" that could drift apart the day someone
 * changed a timezone cast in one of them.
 */
async function sweepRentalsEndingSoon(db: Database): Promise<number> {
  const daysLeft = sql<number>`((${rentalEndDate})::date - ${romeToday})`;

  const due = await db
    .selectDistinct({
      orderId: orders.id,
      orderNumber: orders.number,
      customerAccountId: orders.customerAccountId,
      firstName: orders.firstName,
      lastName: orders.lastName,
      endsOn: rentalEndDate,
      daysLeft,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        sql`${pricingMode} = 'rental'`,
        /* Spelled out one placeholder at a time rather than passing the array.
           Drizzle expands a JS array into a COMMA LIST — `($1, $2, $3)` — which
           Postgres reads as a record, so `${RENTAL_THRESHOLD_DAYS}::int[]`
           fails with "cannot cast type record to integer[]". `ARRAY[…]` with
           each element cast is the shape that survives. The `::int` on each is
           load-bearing for the older reason: a bare placeholder arrives as
           `unknown` and Postgres will not guess. */
        sql`${daysLeft} = ANY(ARRAY[${sql.join(
          RENTAL_THRESHOLD_DAYS.map((days) => sql`${days}::int`),
          sql`, `,
        )}])`,
        notInArray(orders.status, ['fulfilled', 'cancelled']),
      ),
    );

  let written = 0;
  for (const rental of due) {
    const data = {
      orderNumber: rental.orderNumber,
      endsOn: rental.endsOn,
      daysLeft: rental.daysLeft,
      customerName: fullName(rental.firstName, rental.lastName),
    };

    /* A guest order has no account to address, and one taken over the phone may
       never gain one. The operator's copy below still fires — the rental is
       ending whether or not anybody can be told about it in an app. */
    if (
      rental.customerAccountId &&
      (CUSTOMER_RENTAL_THRESHOLD_DAYS as readonly number[]).includes(rental.daysLeft)
    ) {
      const accountId = rental.customerAccountId;
      written += await db.transaction(async (tx) => {
        const id = await emit(tx, {
          audience: 'customer',
          customerAccountId: accountId,
          type: 'rental.ending_soon',
          orderId: rental.orderId,
          data,
          dedupeKey: `rental.ending_soon:customer:${rental.orderId}:${rental.daysLeft}d`,
        });
        return id ? 1 : 0;
      });
    }

    if (rental.daysLeft === ADMIN_RENTAL_THRESHOLD_DAYS) {
      written += await db.transaction((tx) =>
        emitToAdmins(tx, {
          type: 'rental.ending_soon',
          orderId: rental.orderId,
          data,
          dedupeKeyBase: `rental.ending_soon:admin:${rental.orderId}:${ADMIN_RENTAL_THRESHOLD_DAYS}d`,
        }),
      );
    }
  }
  return written;
}

/**
 * Rentals about to START — the delivery somebody has to be present for.
 *
 * Customer-only: an operator reading "a rental starts in two days" can do
 * nothing with it that the rentals list does not already show them.
 */
async function sweepUpcomingRentals(db: Database): Promise<number> {
  const daysUntil = sql<number>`((${rentalStartDate})::date - ${romeToday})`;

  const due = await db
    .selectDistinct({
      orderId: orders.id,
      orderNumber: orders.number,
      customerAccountId: orders.customerAccountId,
      startsOn: rentalStartDate,
      daysUntil,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        sql`${pricingMode} = 'rental'`,
        sql`${daysUntil} = ${UPCOMING_RENTAL_DAYS}::int`,
        sql`${orders.customerAccountId} IS NOT NULL`,
        notInArray(orders.status, ['fulfilled', 'cancelled']),
      ),
    );

  let written = 0;
  for (const rental of due) {
    const accountId = rental.customerAccountId;
    if (!accountId) continue;

    written += await db.transaction(async (tx) => {
      const id = await emit(tx, {
        audience: 'customer',
        customerAccountId: accountId,
        type: 'order.upcoming',
        orderId: rental.orderId,
        data: {
          orderNumber: rental.orderNumber,
          startsOn: rental.startsOn,
          daysUntil: rental.daysUntil,
        },
        dedupeKey: `order.upcoming:${rental.orderId}`,
      });
      return id ? 1 : 0;
    });
  }
  return written;
}

/**
 * Rental orders sitting in `pending` behind an unsigned contract.
 *
 * Only the newest non-voided contract counts, matching
 * `findLatestActiveByOrderId` and the rentals list — a voided renewal must fall
 * back to the contract it replaced rather than mask it, or this would alert on
 * paper that is already dead.
 */
async function sweepStalledContracts(db: Database): Promise<number> {
  const newestActive = sql`(
    SELECT c2.id FROM contracts c2
    WHERE c2.order_id = ${orders.id} AND c2.status <> 'voided'
    ORDER BY c2.created_at DESC LIMIT 1
  )`;

  const stalled = await db
    .select({
      contractId: contracts.id,
      contractNumber: contracts.number,
      sentAt: contracts.sentAt,
      orderId: orders.id,
      orderNumber: orders.number,
    })
    .from(contracts)
    .innerJoin(orders, eq(contracts.orderId, orders.id))
    .where(
      and(
        eq(orders.status, 'pending'),
        notInArray(contracts.status, ['signed', 'voided', 'draft']),
        sql`${contracts.sentAt} IS NOT NULL`,
        sql`${contracts.sentAt} < now() - make_interval(hours => ${CONTRACT_STALL_HOURS}::int)`,
        sql`${contracts.id} = ${newestActive}`,
      ),
    );

  let written = 0;
  for (const contract of stalled) {
    const sentAt = contract.sentAt;
    if (!sentAt) continue;

    written += await db.transaction((tx) =>
      emitToAdmins(tx, {
        type: 'contract.unsigned_blocking',
        orderId: contract.orderId,
        data: {
          contractNumber: contract.contractNumber,
          orderNumber: contract.orderNumber,
          sentOn: sentAt.toISOString().slice(0, 10),
          hoursWaiting: Math.floor((Date.now() - sentAt.getTime()) / 3_600_000),
        },
        /* Keyed on the contract alone, so this fires once per stalled contract
           and not once an hour for as long as it stays stalled. It is an alert,
           not a nag; a voided-and-reissued contract is a new id and alerts
           again, which is correct. */
        dedupeKeyBase: `contract.unsigned_blocking:${contract.contractId}`,
      }),
    );
  }
  return written;
}

/**
 * An em dash rather than a word, when an order carries no name: the payload is
 * rendered in four languages and a placeholder written here would be stuck in
 * one of them. An order raised by the seed or taken over the phone legitimately
 * has neither name column set.
 */
function fullName(firstName: string | null, lastName: string | null): string {
  return `${firstName ?? ''} ${lastName ?? ''}`.trim() || '—';
}

/** Every pass, in order. Returns how many rows were actually written. */
export async function runNotificationSweep(db: Database): Promise<number> {
  const ending = await sweepRentalsEndingSoon(db);
  const upcoming = await sweepUpcomingRentals(db);
  const stalls = await sweepStalledContracts(db);
  return ending + upcoming + stalls;
}

/** Fire-and-forget scheduling; `unref` so the timer never blocks shutdown. */
export function startNotificationSweep(db: Database): void {
  const run = async () => {
    try {
      const written = await runNotificationSweep(db);
      if (written > 0) console.log(`[notifications] sweep raised ${written} notification(s)`);
    } catch (error) {
      // One quiet line, no crash: the next tick is an hour away and the rows
      // this failed to write are still derivable from the same query. The whole
      // error, not just its message — Drizzle's wrapper puts the reason
      // Postgres gave on `cause`, and that is the only useful half.
      console.warn('[notifications] sweep failed', error);
    }
  };
  void run();
  setInterval(run, SWEEP_INTERVAL_MS).unref();
}
