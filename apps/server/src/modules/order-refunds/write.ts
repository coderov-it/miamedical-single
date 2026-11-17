/**
 * The one place a refund is written: lock the order, check the amount, insert
 * the row (the database trigger updates the totals), move the payment status and
 * write the timeline. Always inside a caller's transaction. See
 * /docs/code/order-money.md.
 */

import type { Transaction } from '@mia/db';
import { and, eq, isNotNull } from '@mia/db';
import { orderRefunds, orders, orderStatusEvents, rentalExtensions } from '@mia/db/schema';

import { conflict, httpError, notFound } from '../../shared/http/errors.ts';
import { canMovePayment, type PaymentStatus } from '../orders/status.ts';
import { emitOrderStatusChanged } from '../orders/status-notice.ts';
import {
  decideRefund,
  isMoneyCheckViolation,
  isRefundablePayment,
  paymentStatusAfterRefund,
  refundNote,
  toCents,
} from './decision.ts';

export interface RefundInput {
  orderId: string;
  amount: string;
  reason: string;
  rentalExtensionId?: string | undefined;
  actorAdminUserId: string | null;
}

const fieldError = (field: string, message: string) =>
  httpError(422, message, 'validation_failed', { fields: { [field]: message } });

/** Locks the order row so two refunds (or a refund and a payment) are serialised. */
async function lockOrder(tx: Transaction, orderId: string) {
  const [order] = await tx
    .select({
      netTotal: orders.netTotal,
      paymentStatus: orders.paymentStatus,
      currency: orders.currency,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .for('update');
  if (!order) throw notFound('Order');
  return { ...order, netTotal: order.netTotal ?? '0.00' };
}

async function assertPaidExtensionOf(tx: Transaction, orderId: string, extensionId: string) {
  const [row] = await tx
    .select({ id: rentalExtensions.id })
    .from(rentalExtensions)
    .where(
      and(
        eq(rentalExtensions.id, extensionId),
        eq(rentalExtensions.orderId, orderId),
        isNotNull(rentalExtensions.paidAt),
      ),
    );
  if (!row) {
    throw fieldError('rentalExtensionId', 'Choose a paid extension of this order.');
  }
}

export async function recordRefundInTx(tx: Transaction, input: RefundInput): Promise<void> {
  const order = await lockOrder(tx, input.orderId);

  if (!isRefundablePayment(order.paymentStatus)) {
    throw conflict('Only an order whose payment was received can be refunded.');
  }
  const decision = decideRefund({ netTotal: order.netTotal, amount: input.amount });
  if (!decision.ok) throw fieldError('amount', decision.message);
  if (input.rentalExtensionId) {
    await assertPaidExtensionOf(tx, input.orderId, input.rentalExtensionId);
  }

  try {
    await tx.insert(orderRefunds).values({
      orderId: input.orderId,
      amount: input.amount,
      reason: input.reason,
      rentalExtensionId: input.rentalExtensionId ?? null,
      actorAdminUserId: input.actorAdminUserId,
    });
  } catch (error) {
    if (isMoneyCheckViolation(error)) {
      throw conflict('This order changed a moment ago. Reload it.');
    }
    throw error;
  }

  /* The trigger has recomputed the totals; the status follows what is left. */
  const target = paymentStatusAfterRefund(decision.netAfter);
  const from = order.paymentStatus;
  const moves = from !== target && canMovePayment(from, target);
  if (moves)
    await tx.update(orders).set({ paymentStatus: target }).where(eq(orders.id, input.orderId));

  const to: PaymentStatus = moves ? target : from;
  await tx.insert(orderStatusEvents).values({
    orderId: input.orderId,
    field: 'paymentStatus',
    fromValue: from,
    toValue: to,
    note: refundNote(input.amount, order.currency, input.reason),
    actorAdminUserId: input.actorAdminUserId,
  });
  if (moves) {
    await emitOrderStatusChanged(tx, {
      orderId: input.orderId,
      field: 'paymentStatus',
      fromValue: from,
      toValue: to,
    });
  }
}

/**
 * Moving the ORDER to `refunded` gives back whatever is left, so that status
 * always means net 0 at that moment. A no-op when nothing is left.
 */
export async function refundRemainingInTx(
  tx: Transaction,
  orderId: string,
  reason: string | null,
  actorAdminUserId: string | null,
): Promise<void> {
  const order = await lockOrder(tx, orderId);
  const remaining = order.netTotal;
  if (toCents(remaining) <= 0) return;
  await recordRefundInTx(tx, {
    orderId,
    amount: remaining,
    reason: reason && reason.length >= 3 ? reason : 'Order marked as refunded.',
    actorAdminUserId,
  });
}
