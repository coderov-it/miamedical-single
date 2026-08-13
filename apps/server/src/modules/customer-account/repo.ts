import type { Database } from '@mia/db';
import { and, count, desc, eq, ne } from '@mia/db';
import { orderItems, orders } from '@mia/db/schema';

import type { OrderAggregate, OrderSummaryRecord } from '../orders/types.ts';

/**
 * Reads of a customer's OWN orders. Every query is scoped by
 * `customerAccountId` in its WHERE clause rather than filtered afterwards, so
 * there is no code path here that can return somebody else's order.
 *
 * Rejected links are excluded throughout: rejecting nulls the account id, so those
 * rows fall out of the scope automatically — the `ne` below is belt and braces for
 * a row that somehow kept both.
 */

const notRejected = ne(orders.customerLinkStatus, 'rejected');

export async function listOrders(
  db: Database,
  customerAccountId: string,
  page: number,
  perPage: number,
): Promise<{ rows: OrderSummaryRecord[]; total: number }> {
  const where = and(eq(orders.customerAccountId, customerAccountId), notRejected);

  const [rows, totals] = await Promise.all([
    db
      .select({ order: orders, itemCount: count(orderItems.id) })
      .from(orders)
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(where)
      .groupBy(orders.id)
      .orderBy(desc(orders.placedAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ value: count() }).from(orders).where(where),
  ]);

  return {
    rows: rows.map((row) => ({ ...row.order, itemCount: row.itemCount })),
    total: totals[0]?.value ?? 0,
  };
}

/**
 * One of their orders, by its human-facing number.
 *
 * By number rather than id because that is what the customer has — it is on the
 * confirmation page and in the email. It is unique, and the account scope means
 * knowing somebody else's number still reveals nothing.
 */
export async function findOrderByNumber(
  db: Database,
  customerAccountId: string,
  number: string,
): Promise<OrderAggregate | undefined> {
  const order = await db.query.orders.findFirst({
    where: and(
      eq(orders.number, number),
      eq(orders.customerAccountId, customerAccountId),
      notRejected,
    ),
    with: { items: true },
  });

  if (!order) return undefined;

  // The timeline is deliberately absent: it carries operator notes and internal
  // status reasoning, which is back-office context, not the customer's.
  return { ...order, events: [] };
}

/** Just the id, for the confirm/reject routes, which take a number too. */
export async function findOrderIdByNumber(
  db: Database,
  customerAccountId: string,
  number: string,
): Promise<string | undefined> {
  const [row] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.number, number), eq(orders.customerAccountId, customerAccountId)))
    .limit(1);

  return row?.id;
}
