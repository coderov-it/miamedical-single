import type { Database } from '@mia/db';
import { and, eq } from '@mia/db';
import { orderStatusEvents, orders } from '@mia/db/schema';

/**
 * Confirming and rejecting the account link on an order.
 *
 * Its own file, and not part of `modules/orders`, because both callers are on the
 * customer side: `customer-auth` confirms when an order email's link is clicked,
 * and `customer-account` confirms or rejects from the account pages. Putting it in
 * the orders module would mean orders → customer-auth → orders, a cycle, since
 * order placement already calls into customer-auth to resolve the account.
 *
 * Both operations move the column and write the timeline entry in one transaction.
 * A link that changed hands with no record of who changed it is precisely what the
 * timeline exists to prevent — and here the "who" is a customer, which is why
 * `order_status_events` carries a second actor column.
 */

const FIELD = 'customerLink';

/**
 * The customer vouches for the match. Scoped to their own account id, so this can
 * never confirm a link on somebody else's order.
 */
export async function confirmLink(
  db: Database,
  orderId: string,
  customerAccountId: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(orders)
      .set({ customerLinkStatus: 'confirmed' })
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.customerAccountId, customerAccountId),
          eq(orders.customerLinkStatus, 'unverified'),
        ),
      )
      .returning({ id: orders.id });

    // Already confirmed, already rejected, or not theirs: nothing to record.
    if (!updated) return;

    await tx.insert(orderStatusEvents).values({
      orderId,
      field: FIELD,
      fromValue: 'unverified',
      toValue: 'confirmed',
      note: 'Confirmed by the customer from their account.',
      actorAdminUserId: null,
      actorCustomerAccountId: customerAccountId,
    });
  });
}

/**
 * "This is not my order."
 *
 * Clears `customer_account_id` and marks the link rejected. The order itself is
 * untouched — it is a real order somebody placed, and a fiscal record either way;
 * only the claim that it belongs to this account goes away.
 *
 * The actor id is still written to the event, so the panel can see who disowned it
 * even though the order no longer points at them.
 */
export async function rejectLink(
  db: Database,
  orderId: string,
  customerAccountId: string,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    /*
      Read the current status before overwriting it. A customer can reject an order
      they confirmed earlier — they clicked through an email months ago, then a
      statement arrives and they look again — so the timeline must record what the
      link actually moved from, not an assumed `unverified`.
    */
    const [before] = await tx
      .select({ status: orders.customerLinkStatus })
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.customerAccountId, customerAccountId)))
      .limit(1);

    if (!before) return false;

    const [updated] = await tx
      .update(orders)
      .set({ customerAccountId: null, customerLinkStatus: 'rejected' })
      .where(and(eq(orders.id, orderId), eq(orders.customerAccountId, customerAccountId)))
      .returning({ id: orders.id });

    if (!updated) return false;

    await tx.insert(orderStatusEvents).values({
      orderId,
      field: FIELD,
      fromValue: before.status,
      toValue: 'rejected',
      note: 'The customer states they did not place this order.',
      actorAdminUserId: null,
      actorCustomerAccountId: customerAccountId,
    });

    return true;
  });
}
