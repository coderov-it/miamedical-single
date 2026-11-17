/** Orchestration for recording a refund: one transaction, then the refreshed order. */

import type { Database } from '@mia/db';

import type { SessionUser } from '../../shared/http/context.ts';
import * as orders from '../orders/service.ts';
import type { AdminOrderAggregate } from '../orders/types.ts';
import type { RecordRefundInput } from './validators.ts';
import { recordRefundInTx } from './write.ts';

export async function recordRefund(
  db: Database,
  orderId: string,
  input: RecordRefundInput,
  actor: SessionUser | null,
): Promise<AdminOrderAggregate> {
  await db.transaction((tx) =>
    recordRefundInTx(tx, {
      orderId,
      amount: input.amount,
      reason: input.reason,
      rentalExtensionId: input.rentalExtensionId,
      actorAdminUserId: actor?.id ?? null,
    }),
  );
  return orders.getById(db, orderId);
}
