import type { Transaction } from '@mia/db';

import { emit } from '../notifications/write.ts';
import * as repo from './repo.ts';

/**
 * The last step of an extension: its contract was signed, so the order now runs
 * to the extension's end. Called by `contracts/signing.sign` INSIDE the signing
 * transaction, so the signature and the moved end date commit together or not
 * at all. This file imports nothing from contracts, which keeps the dependency
 * one-way.
 *
 * Conditional on the extension still `awaiting_signature`: a contract with no
 * waiting extension behind it (an initial contract, a manual one, or a renewal
 * cancelled a moment earlier) is a no-op.
 */
export async function activateForContract(tx: Transaction, contractId: string): Promise<void> {
  const extension = await repo.activateByContractId(tx, contractId);
  if (!extension) return;

  await repo.extendRentalLines(tx, extension.orderId, extension.toDate);
  await repo.insertEvent(tx, {
    orderId: extension.orderId,
    fromValue: 'awaiting_signature',
    toValue: 'active',
    note: `Rental extended ${extension.fromDate} → ${extension.toDate} (${extension.days} days).`,
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
