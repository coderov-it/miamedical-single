/**
 * The one write path for an order's status and payment status: the column, its
 * audit entry, the stock the move takes or returns (stock.ts) and the customer's
 * notification, in one transaction. A move to `delivered` also shifts each rental
 * line's dates to the delivery day (delivery-dates.ts). See /docs/code/orders-status-machine.md.
 */

import type { Database, Transaction } from '@mia/db';
import { eq } from '@mia/db';
import { orderItems, orders, orderStatusEvents } from '@mia/db/schema';

import { refundRemainingInTx } from '../order-refunds/write.ts';
import { shiftRentalToDelivery, type RentalPeriod } from './delivery-dates.ts';
import type { OrderStatus } from './status.ts';
import { emitOrderStatusChanged } from './status-notice.ts';
import { applyStockMoves, takenAfter } from './stock.ts';

export interface StatusEventData {
  orderId: string;
  field: 'status' | 'paymentStatus';
  fromValue: string;
  toValue: string;
  note: string | null;
  actorAdminUserId: string | null;
}

export interface TransitionOptions {
  /** `YYYY-MM-DD`, read only on a move to `delivered`: the day the rental starts. */
  deliveredOn?: string | undefined;
}

/**
 * Moves each rental line's period to the delivery day, in the move's own
 * transaction. The booked dates are kept on the line (`bookedStartDate`/`bookedEndDate`).
 */
async function shiftRentalDates(tx: Transaction, orderId: string, deliveredOn: string) {
  const lines = await tx
    .select({ id: orderItems.id, configuration: orderItems.configuration })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));
  for (const line of lines) {
    const configuration = line.configuration;
    if (configuration?.pricingMode !== 'rental') continue;
    const shifted = shiftRentalToDelivery(
      (configuration.rental ?? {}) as RentalPeriod,
      deliveredOn,
    );
    if (!shifted) continue;
    await tx
      .update(orderItems)
      .set({ configuration: { ...configuration, rental: shifted } })
      .where(eq(orderItems.id, line.id));
  }
}

/**
 * The status column, its audit entry and the stock it moves commit together or
 * not at all. This is the body; `applyTransition` wraps it in its own transaction,
 * and other modules (return inspections) call it inside theirs so the move and
 * their own writes stay atomic.
 */
export async function applyTransitionInTx(
  tx: Transaction,
  event: StatusEventData,
  options: TransitionOptions = {},
): Promise<void> {
  /* `refunded` means net 0: give back what is left, in this same transaction,
     before the status itself moves. */
  if (event.field === 'status' && event.toValue === 'refunded') {
    await refundRemainingInTx(tx, event.orderId, event.note, event.actorAdminUserId);
  }
  await tx
    .update(orders)
    .set({ [event.field]: event.toValue })
    .where(eq(orders.id, event.orderId));
  await tx.insert(orderStatusEvents).values(event);
  if (event.field === 'status' && event.toValue === 'delivered' && options.deliveredOn) {
    await shiftRentalDates(tx, event.orderId, options.deliveredOn);
  }
  if (event.field === 'status') {
    const from = event.fromValue as OrderStatus;
    const to = event.toValue as OrderStatus;
    const [order] = await tx
      .select({ stockTaken: orders.stockTaken })
      .from(orders)
      .where(eq(orders.id, event.orderId))
      .limit(1);
    const taken = order?.stockTaken ?? false;
    const lines = await tx
      .select({
        productId: orderItems.productId,
        productTitle: orderItems.productTitle,
        quantity: orderItems.quantity,
        configuration: orderItems.configuration,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, event.orderId));
    await applyStockMoves(tx, lines, from, to, taken, {
      orderId: event.orderId,
      actorAdminUserId: event.actorAdminUserId,
    });
    const next = takenAfter(to, from, taken);
    if (next !== taken) {
      await tx.update(orders).set({ stockTaken: next }).where(eq(orders.id, event.orderId));
    }
  }
  /* The customer's copy of the same fact, in the same transaction and under
     the same rollback. It reaches nobody until the customer feed ships in
     phase two — the row is written now so the feed opens with history rather
     than with an empty list. */
  await emitOrderStatusChanged(tx, event);
}

/**
 * The status column, its audit entry and the stock it moves commit together or
 * not at all. The transaction lives here rather than in the service because that
 * is where the other multi-statement writes in this codebase keep theirs.
 */
export async function applyTransition(
  db: Database,
  event: StatusEventData,
  options: TransitionOptions = {},
): Promise<void> {
  await db.transaction((tx) => applyTransitionInTx(tx, event, options));
}
