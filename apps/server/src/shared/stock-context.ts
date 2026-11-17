/**
 * Says WHY the next `products.stock` write happens. A trigger on `products` writes
 * the stock_movements row; it reads these transaction-local settings and CONSUMES
 * them, so call this right before EACH stock write. Missing context is recorded as
 * `unknown`, never an error. See /docs/code/stock-history.md.
 */

import type { Transaction } from '@mia/db';
import { sql } from '@mia/db';
import type { stockMovementReason } from '@mia/db/schema';

export type StockReason = (typeof stockMovementReason.enumValues)[number];

export interface StockContext {
  reason: StockReason;
  orderId?: string | null | undefined;
  actorAdminUserId?: string | null | undefined;
  note?: string | null | undefined;
}

/** The four settings, in the order they are sent. An absent value is '' so nothing stale survives. */
export function stockContextSettings(context: StockContext): Array<[string, string]> {
  return [
    ['mia.stock_reason', context.reason],
    ['mia.stock_order_id', context.orderId ?? ''],
    ['mia.stock_actor_id', context.actorAdminUserId ?? ''],
    ['mia.stock_note', context.note ?? ''],
  ];
}

/**
 * One round trip. Typed to `Transaction` on purpose: `set_config(…, true)` outside
 * a transaction lasts one statement, so it would silently say nothing.
 */
export async function setStockContext(tx: Transaction, context: StockContext): Promise<void> {
  const calls = stockContextSettings(context).map(
    ([name, value]) => sql`set_config(${name}, ${value}, true)`,
  );
  await tx.execute(sql`SELECT ${sql.join(calls, sql`, `)}`);
}
