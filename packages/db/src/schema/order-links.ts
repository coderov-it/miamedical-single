import { relations } from 'drizzle-orm';
import { boolean, foreignKey, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { adminUsers } from './admin-users.ts';
import { orders } from './orders.ts';

/**
 * The private link an agent sends for a manual order (details, contract, payment).
 * `id` is the SHA-256 of the raw token, like `contract_signing_tokens`: the raw
 * value is stored nowhere. Not single-use — the page is visited several times —
 * so a link ends by `expiresAt`, by `revokedAt` (a newer link was minted), or by
 * the order leaving `pending`. Worked example: docs/code/manual-orders.md.
 *
 * `steps` is `sign_pay`, `sign` or `pay`; `includeDetails` adds the customer
 * details form in front of them.
 */
export const orderLinkTokens = pgTable(
  'order_link_tokens',
  {
    id: text().primaryKey(),
    orderId: uuid().notNull(),
    steps: text().notNull(),
    includeDetails: boolean().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    revokedAt: timestamp({ withTimezone: true }),
    createdByAdminUserId: uuid(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('order_link_tokens_order_idx').on(t.orderId),
    index('order_link_tokens_expires_idx').on(t.expiresAt),
    foreignKey({
      columns: [t.orderId],
      foreignColumns: [orders.id],
      name: 'order_link_tokens_order_fk',
    }).onDelete('cascade'),
    /* Named explicitly: the derived name is over the 63-byte identifier limit. */
    foreignKey({
      columns: [t.createdByAdminUserId],
      foreignColumns: [adminUsers.id],
      name: 'order_link_tokens_admin_fk',
    }).onDelete('set null'),
  ],
);

export const orderLinkTokensRelations = relations(orderLinkTokens, ({ one }) => ({
  order: one(orders, { fields: [orderLinkTokens.orderId], references: [orders.id] }),
}));
