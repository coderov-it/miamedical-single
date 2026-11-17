/** The customer's copy of a status change. Split out so refunds can reuse it without an import cycle. */

import type { Transaction } from '@mia/db';
import { eq } from '@mia/db';
import { orders } from '@mia/db/schema';

import { emit } from '../notifications/write.ts';

export interface StatusNoticeData {
  orderId: string;
  field: 'status' | 'paymentStatus';
  fromValue: string;
  toValue: string;
}

/**
 * Written only where there is a customer to tell.
 *
 * An unclaimed order has no account id, and `notifications_recipient_check`
 * refuses a customer row without one — correctly: there is nobody to address.
 * Those orders are reachable through the emailed order link instead.
 */
export async function emitOrderStatusChanged(
  tx: Transaction,
  event: StatusNoticeData,
): Promise<void> {
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
