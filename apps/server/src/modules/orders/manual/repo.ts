/** Writes only manual orders need. The shared order writes stay in `orders/repo.ts`. */

import type { DatabaseWriter } from '@mia/db';
import { orderStatusEvents } from '@mia/db/schema';

/** A change of the order-level discount, on the timeline as `discount`. */
export async function insertDiscountEvent(
  db: DatabaseWriter,
  event: {
    orderId: string;
    fromValue: string;
    toValue: string;
    reason: string | null;
    actorAdminUserId: string;
  },
): Promise<void> {
  await db.insert(orderStatusEvents).values({
    orderId: event.orderId,
    field: 'discount',
    fromValue: event.fromValue,
    toValue: event.toValue,
    note: event.reason,
    actorAdminUserId: event.actorAdminUserId,
    actorCustomerAccountId: null,
  });
}
