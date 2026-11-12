/**
 * The one write path for an order's status and payment status: the column, its
 * audit entry, the stock the move takes or returns (stock.ts) and the customer's
 * notification, in one transaction. See /docs/code/orders-status-machine.md.
 */

import type { Database, Transaction } from '@mia/db';
import { eq } from '@mia/db';
import { orderItems, orders, orderStatusEvents } from '@mia/db/schema';

import { emit } from '../notifications/write.ts';
import type { OrderStatus } from './status.ts';
import { applyStockMoves } from './stock.ts';

export interface StatusEventData {
  orderId: string;
  field: 'status' | 'paymentStatus';
  fromValue: string;
  toValue: string;
  note: string | null;
  actorAdminUserId: string | null;
}

/**
 * The status column, its audit entry and the stock it moves commit together or
 * not at all. The transaction lives here rather than in the service because that
 * is where the other multi-statement writes in this codebase keep theirs — and
 * because a status with no explanation is precisely the state the timeline
 * exists to prevent.
 */
export async function applyTransition(db: Database, event: StatusEventData): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ [event.field]: event.toValue })
      .where(eq(orders.id, event.orderId));
    await tx.insert(orderStatusEvents).values(event);
    if (event.field === 'status') {
      const lines = await tx
        .select({
          productId: orderItems.productId,
          productTitle: orderItems.productTitle,
          quantity: orderItems.quantity,
          configuration: orderItems.configuration,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, event.orderId));
      await applyStockMoves(tx, lines, event.fromValue, event.toValue as OrderStatus);
    }
    /* The customer's copy of the same fact, in the same transaction and under
       the same rollback. It reaches nobody until the customer feed ships in
       phase two — the row is written now so the feed opens with history rather
       than with an empty list. */
    await emitOrderStatusChanged(tx, event);
  });
}

/**
 * The customer-facing half of a transition, written only where there is a
 * customer to tell.
 *
 * An unclaimed order has no account id, and `notifications_recipient_check`
 * refuses a customer row without one — correctly: there is nobody to address.
 * Those orders are reachable through the emailed order link instead, which is
 * what the placement mail already provides.
 */
async function emitOrderStatusChanged(tx: Transaction, event: StatusEventData): Promise<void> {
  const [order] = await tx
    .select({ number: orders.number, customerAccountId: orders.customerAccountId })
    .from(orders)
    .where(eq(orders.id, event.orderId))
    .limit(1);

  if (!order?.customerAccountId) return;

  await emit(tx, {
    audience: 'customer',
    customerAccountId: order.customerAccountId,
    type: 'order.status_changed',
    orderId: event.orderId,
    data: {
      orderNumber: order.number,
      field: event.field,
      from: event.fromValue,
      to: event.toValue,
    },
  });
}
