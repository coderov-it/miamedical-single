/** Reads and in-transaction writes for `return_inspections`. IO only, no rules. */

import type { Database, Transaction } from '@mia/db';
import { eq, sql } from '@mia/db';
import { orderItems, orders, orderStatusEvents, products, returnInspections } from '@mia/db/schema';

import { setStockContext, type StockReason } from '../../shared/stock-context.ts';

/** Locks the order row so two inspectors cannot decide the same last unit at once. */
export async function lockOrder(tx: Transaction, orderId: string) {
  const [order] = await tx
    .select({ id: orders.id, status: orders.status })
    .from(orders)
    .where(eq(orders.id, orderId))
    .for('update')
    .limit(1);
  return order;
}

export function findLines(tx: Transaction, orderId: string) {
  return tx
    .select({
      id: orderItems.id,
      productId: orderItems.productId,
      productTitle: orderItems.productTitle,
      quantity: orderItems.quantity,
      configuration: orderItems.configuration,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));
}

/** Decisions per order line: `orderItemId → rows written`. */
export async function countByItem(tx: Transaction, orderId: string): Promise<Map<string, number>> {
  const rows = await tx
    .select({ orderItemId: returnInspections.orderItemId, n: sql<number>`count(*)::int` })
    .from(returnInspections)
    .where(eq(returnInspections.orderId, orderId))
    .groupBy(returnInspections.orderItemId);
  return new Map(rows.map((row) => [row.orderItemId, row.n]));
}

/** One unit back on the shelf, with the stock history told why. */
export async function putUnitBack(
  tx: Transaction,
  productId: string,
  context: { reason: StockReason; orderId: string; actorAdminUserId: string | null; note: string },
): Promise<void> {
  await setStockContext(tx, context);
  await tx
    .update(products)
    .set({ stock: sql`${products.stock} + 1` })
    .where(eq(products.id, productId));
}

/** The inspection's line on the order timeline. */
export async function writeInspectionEvent(
  tx: Transaction,
  event: { orderId: string; toValue: string; note: string; actorAdminUserId: string | null },
): Promise<void> {
  await tx.insert(orderStatusEvents).values({ ...event, field: 'inspection', fromValue: null });
}
