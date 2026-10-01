import type { Database } from '@mia/db';

import { emit } from '../notifications/write.ts';
import * as repo from './repo.ts';

/**
 * The last step of an extension: its contract was signed, so the order now runs
 * to the extension's end. Called by `contracts/service.sign` — this file imports
 * nothing from contracts, which keeps the dependency one-way.
 *
 * A contract with no waiting extension behind it (an initial contract, a
 * manual one) is a no-op.
 */
export async function activateForContract(db: Database, contractId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const extension = await repo.findOpenByContractId(tx, contractId);
    if (!extension) return;

    await repo.extendRentalLines(tx, extension.orderId, extension.toDate);
    await repo.update(tx, extension.id, { status: 'active', activatedAt: new Date() });
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
  });
}
