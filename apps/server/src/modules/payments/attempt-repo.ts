/**
 * `payment_attempts` reads and writes. Plain records, no gateway calls.
 * Walk-through: docs/code/online-payments.md.
 */

import type { Database, DatabaseWriter } from '@mia/db';
import { and, count, eq, lt } from '@mia/db';
import { orders, orderStatusEvents, paymentAttempts } from '@mia/db/schema';

export type AttemptRow = typeof paymentAttempts.$inferSelect;
export type AttemptStatus = AttemptRow['status'];
export type FinalStatus = Exclude<AttemptStatus, 'pending'>;

export interface NewAttempt {
  orderId: string;
  rentalExtensionId: string | null;
  provider: string;
  providerReference: string;
  accessToken: string;
  amount: string;
  currency: string;
}

export async function insert(db: DatabaseWriter, data: NewAttempt): Promise<AttemptRow> {
  const [row] = await db.insert(paymentAttempts).values(data).returning();
  if (!row) throw new Error('Payment attempt insert returned no row.');
  return row;
}

/** The gateway's secret arrives after the row exists — the row is written first. */
export async function setSecret(db: Database, id: string, secret: string | null): Promise<void> {
  await db
    .update(paymentAttempts)
    .set({ providerSecret: secret })
    .where(eq(paymentAttempts.id, id));
}

export async function findByToken(db: Database, token: string): Promise<AttemptRow | undefined> {
  return db.query.paymentAttempts.findFirst({ where: eq(paymentAttempts.accessToken, token) });
}

export async function findByReference(
  db: Database,
  provider: string,
  reference: string,
): Promise<AttemptRow | undefined> {
  return db.query.paymentAttempts.findFirst({
    where: and(
      eq(paymentAttempts.provider, provider),
      eq(paymentAttempts.providerReference, reference),
    ),
  });
}

/** How many attempts the order has had — the next reference's suffix. */
export async function countForOrder(db: DatabaseWriter, orderId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(paymentAttempts)
    .where(eq(paymentAttempts.orderId, orderId));
  return row?.value ?? 0;
}

/**
 * Moves a pending attempt to its final status, or does nothing when another
 * path (the notification, the result page, the sweep) settled it first. The
 * boolean is who won: only the winner applies the money to the order.
 */
export async function finish(
  db: DatabaseWriter,
  id: string,
  status: FinalStatus,
  details: { result: string | null; operationId: string | null; circuit: string | null },
): Promise<boolean> {
  const rows = await db
    .update(paymentAttempts)
    .set({
      status,
      providerResult: details.result,
      providerOperationId: details.operationId,
      paymentCircuit: details.circuit,
      completedAt: new Date(),
    })
    .where(and(eq(paymentAttempts.id, id), eq(paymentAttempts.status, 'pending')))
    .returning({ id: paymentAttempts.id });
  return rows.length > 0;
}

/** Pending attempts started before `before` — the gateway page has long closed. */
export async function findStale(db: Database, before: Date): Promise<AttemptRow[]> {
  return db
    .select()
    .from(paymentAttempts)
    .where(and(eq(paymentAttempts.status, 'pending'), lt(paymentAttempts.createdAt, before)));
}

export async function hasPending(db: Database, orderId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: paymentAttempts.id })
    .from(paymentAttempts)
    .where(and(eq(paymentAttempts.orderId, orderId), eq(paymentAttempts.status, 'pending')))
    .limit(1);
  return Boolean(row);
}

/** Unpaid storefront orders whose deadline has passed. */
export async function findOverdueOrders(db: Database, now: Date) {
  return db
    .select({ id: orders.id, number: orders.number })
    .from(orders)
    .where(
      and(
        eq(orders.status, 'pending'),
        eq(orders.paymentStatus, 'unpaid'),
        /* A manual order has no deadline; the filter keeps it out even if one were set. */
        eq(orders.source, 'online'),
        lt(orders.paymentDueAt, now),
      ),
    );
}

/**
 * A payment fact that moves no status — a second charge on a paid order. Written
 * as a same-to-same `paymentStatus` event so it sits on the order's timeline.
 */
export async function noteOnTimeline(
  db: Database,
  orderId: string,
  paymentStatus: string,
  note: string,
): Promise<void> {
  await db.insert(orderStatusEvents).values({
    orderId,
    field: 'paymentStatus',
    fromValue: paymentStatus,
    toValue: paymentStatus,
    note,
    actorAdminUserId: null,
  });
}
