/**
 * The order-level discount of a manual order. Docs: docs/code/manual-orders.md.
 *
 * ```
 * subtotal 180.00, shipping 0.00, discount 0.00 → set 20.00 "cliente storico" → total 160.00
 * contract signed, or a payment attempt open    → 409, the amount is already agreed
 * discount 180.00 on a 180.00 order             → 422, the gateway cannot charge nothing
 * ```
 */

import type { Database } from '@mia/db';
import { eq } from '@mia/db';
import { orders } from '@mia/db/schema';

import type { SessionUser } from '../../../shared/http/context.ts';
import * as contractsRepo from '../../contracts/repo.ts';
import * as attemptRepo from '../../payments/attempt-repo.ts';
import * as repo from '../repo.ts';
import { getById } from '../service.ts';
import type { AdminOrderAggregate } from '../types.ts';
import { assertDiscountEditable, type DiscountInput, priceDiscount } from './pricing.ts';
import * as manualRepo from './repo.ts';

/**
 * Sets or replaces the discount of a pending manual order and writes the `discount`
 * timeline event. Locked once the customer signed the contract (it states the amount)
 * or a payment attempt is open (the gateway holds the amount).
 */
export async function setDiscount(
  db: Database,
  orderId: string,
  input: DiscountInput,
  actor: SessionUser,
): Promise<AdminOrderAggregate> {
  const order = await getById(db, orderId);
  const contract = await contractsRepo.findLatestActiveByOrderId(db, orderId);
  assertDiscountEditable({
    source: order.source,
    status: order.status,
    contractStatus: contract?.status ?? null,
    hasPendingAttempt: await attemptRepo.hasPending(db, orderId),
  });

  const priced = priceDiscount(order, input);
  await db.transaction(async (tx) => {
    /* Row lock: two agents editing at once cannot both pass the checks above on stale data. */
    await tx.select({ id: orders.id }).from(orders).where(eq(orders.id, orderId)).for('update');
    await repo.update(tx, orderId, priced);
    await manualRepo.insertDiscountEvent(tx, {
      orderId,
      fromValue: order.discountTotal,
      toValue: priced.discountTotal,
      reason: priced.discountReason,
      actorAdminUserId: actor.id,
    });
  });
  return getById(db, orderId);
}
