import { sql } from 'drizzle-orm';
import { bigint, check, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { adminUsers } from './admin-users.ts';
import { products } from './catalog.ts';
import { stockMovementReason } from './enums.ts';
import { orders } from './orders.ts';

/**
 * Every change of `products.stock`, one row each, written ONLY by the trigger on
 * `products` (migration 0023) — so a stock change without a history row cannot
 * happen, whichever code path made it. Append-only. For each product the deltas
 * sum to its current stock, starting from its `opening_balance` row.
 * Worked example: docs/code/stock-history.md.
 *
 * `id` is an identity, not a uuid: two changes of one product are serialised by
 * the row lock on `products`, so id order IS the order they happened in.
 */
export const stockMovements = pgTable(
  'stock_movements',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    delta: integer().notNull(),
    stockAfter: integer().notNull(),
    reason: stockMovementReason().notNull(),
    orderId: uuid().references(() => orders.id, { onDelete: 'set null' }),
    actorAdminUserId: uuid().references(() => adminUsers.id, { onDelete: 'set null' }),
    note: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('stock_movements_product_idx').on(t.productId, t.id),
    index('stock_movements_order_idx').on(t.orderId),
    check(
      'stock_movements_delta_check',
      sql`${t.delta} <> 0 OR ${t.reason} IN ('opening_balance', 'product_created')`,
    ),
  ],
);
