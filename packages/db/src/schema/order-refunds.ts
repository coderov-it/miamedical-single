import { sql } from 'drizzle-orm';
import { check, index, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { adminUsers } from './admin-users.ts';
import { orders } from './orders.ts';
import { rentalExtensions } from './rental-extensions.ts';

/**
 * Money given back on an order, one row per refund. Append-only: a mistaken
 * refund is corrected by the operator with a note, never by editing a row —
 * a trigger rejects UPDATE. `orders.refunded_total` is the database's own SUM
 * of these rows. Worked example: docs/code/order-money.md.
 *
 * `rentalExtensionId` says the refund gives back an extension's money (a paid
 * extension that was then cancelled). Informational only: the amount still
 * comes off the order as a whole.
 */
export const orderRefunds = pgTable(
  'order_refunds',
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    amount: numeric({ precision: 12, scale: 2 }).notNull(),
    reason: text().notNull(),
    rentalExtensionId: uuid().references(() => rentalExtensions.id, { onDelete: 'set null' }),
    actorAdminUserId: uuid().references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('order_refunds_order_idx').on(t.orderId, t.createdAt),
    check('order_refunds_amount_check', sql`${t.amount} > 0`),
  ],
);
