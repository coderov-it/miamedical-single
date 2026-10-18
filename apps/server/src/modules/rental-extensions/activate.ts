import type { Transaction } from '@mia/db';

import { emit } from '../notifications/write.ts';
import * as repo from './repo.ts';
import type { ExtensionStatus } from './types.ts';

/**
 * The last step of an extension: it is both paid and signed, so the order now
 * runs to the extension's end. Which of the two comes last decides the caller:
 *
 *   operator-raised   paid → contract emailed → signed   `activateForContract`
 *   account renewal   signed in the modal → paid         `service.recordPayment`
 *
 * This file imports nothing from contracts, which keeps the dependency one-way.
 */

/**
 * Called by `contracts/signing.sign` INSIDE the signing transaction, so the
 * signature and the moved end date commit together or not at all.
 *
 * Conditional on the extension still `awaiting_signature`: a contract with no
 * waiting extension behind it (an initial contract, a manual one, or a renewal
 * cancelled a moment earlier) is a no-op.
 */
export async function activateForContract(tx: Transaction, contractId: string): Promise<void> {
  const extension = await repo.activateByContractId(tx, contractId);
  if (!extension) return;
  await applyExtension(tx, extension, 'awaiting_signature');
}

/**
 * Moves every rental line's end to the extension's, writes the timeline row and
 * tells the customer. The caller has already moved the extension to `active`,
 * guarded on `from`, in the same transaction. `paidNote` and the operator are
 * set when the payment is what activated it, so the one timeline row says both.
 */
export async function applyExtension(
  tx: Transaction,
  extension: { orderId: string; fromDate: string; toDate: string; days: number },
  from: ExtensionStatus,
  payment: { paidNote: string; actorAdminUserId: string } | null = null,
): Promise<void> {
  await repo.extendRentalLines(tx, extension.orderId, extension.toDate);
  const extended = `Rental extended ${extension.fromDate} → ${extension.toDate} (${extension.days} days).`;
  await repo.insertEvent(tx, {
    orderId: extension.orderId,
    fromValue: from,
    toValue: 'active',
    note: payment ? `${payment.paidNote} ${extended}` : extended,
    actorAdminUserId: payment?.actorAdminUserId ?? null,
  });

  const order = await tx.query.orders.findFirst({
    where: (orders, { eq }) => eq(orders.id, extension.orderId),
    columns: { number: true, customerAccountId: true },
  });
  if (!order?.customerAccountId) return;
  await emit(tx, {
    audience: 'customer',
    customerAccountId: order.customerAccountId,
    type: 'rental.renewed',
    orderId: extension.orderId,
    data: { orderNumber: order.number, from: extension.fromDate, to: extension.toDate },
  });
}
