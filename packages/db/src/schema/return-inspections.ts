import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { adminUsers } from './admin-users.ts';
import { products } from './catalog.ts';
import { attentionResolution, inspectionOutcome } from './enums.ts';
import { orderItems } from './order-records.ts';
import { orders } from './orders.ts';

/**
 * One row per physical returned unit: a line of quantity 2 gets up to 2 rows. A
 * row is written when an inspector decides the unit after the order is `received`,
 * and is never deleted by the app. `outcome = 'attention'` rows with no
 * `resolution` form the attention queue. See docs/code/order-delivery-and-return.md.
 *
 * `productId` is nullable and `set null`: the decision outlives a deleted product.
 * Both admin actors are nullable and `set null` for the same reason.
 */
export const returnInspections = pgTable(
  'return_inspections',
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    orderItemId: uuid()
      .notNull()
      .references(() => orderItems.id, { onDelete: 'cascade' }),
    productId: uuid().references(() => products.id, { onDelete: 'set null' }),
    outcome: inspectionOutcome().notNull(),
    note: text(),
    resolution: attentionResolution(),
    resolutionNote: text(),
    inspectedByAdminUserId: uuid().references(() => adminUsers.id, { onDelete: 'set null' }),
    inspectedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    resolvedByAdminUserId: uuid().references(() => adminUsers.id, { onDelete: 'set null' }),
    resolvedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    index('return_inspections_order_idx').on(t.orderId),
    index('return_inspections_queue_idx').on(t.outcome, t.resolution, t.inspectedAt),
  ],
);
