/** Read for the "to check" list: rental lines of received orders. */

import type { Database } from '@mia/db';
import { and, eq, inArray, sql } from '@mia/db';
import { orderItems, orders, products, returnInspections } from '@mia/db/schema';

import type { PendingLine } from './pending-units.ts';
import { findReceived, unitColumns } from './unit-context.ts';
import { toUnitDetails } from './unit-details.ts';

/**
 * Rental lines of `received` orders with how many units are already decided
 * and when, and by whom, the order was received.
 */
export async function findPendingLines(db: Database): Promise<PendingLine[]> {
  const lines = await db
    .select({
      orderId: orders.id,
      orderNumber: orders.number,
      orderItemId: orderItems.id,
      productTitle: orderItems.productTitle,
      ...unitColumns,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(
      and(
        eq(orders.status, 'received'),
        sql`${orderItems.configuration}->>'pricingMode' = 'rental'`,
      ),
    );
  if (lines.length === 0) return [];

  const orderIds = [...new Set(lines.map((line) => line.orderId))];
  const decided = await db
    .select({ orderItemId: returnInspections.orderItemId, n: sql<number>`count(*)::int` })
    .from(returnInspections)
    .where(inArray(returnInspections.orderId, orderIds))
    .groupBy(returnInspections.orderItemId);
  const received = await findReceived(db, orderIds);
  const decidedByItem = new Map(decided.map((row) => [row.orderItemId, row.n]));

  return lines.map((line) => {
    const details = toUnitDetails(line, received.get(line.orderId));
    return {
      orderId: line.orderId,
      orderNumber: line.orderNumber,
      orderItemId: line.orderItemId,
      productTitle: line.productTitle,
      ...details,
      decided: decidedByItem.get(line.orderItemId) ?? 0,
      // A received order always has its event; the epoch only keeps hand-seeded data from crashing.
      receivedAt: details.receivedAt ?? new Date(0),
    };
  });
}
