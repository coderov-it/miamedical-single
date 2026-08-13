import { relations } from 'drizzle-orm';
import { foreignKey, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { customerAccounts } from './customers.ts';
import { customerAuthPurpose } from './enums.ts';
import { orders } from './orders.ts';

/**
 * One-shot links we email. NOT sessions: a session is a long-lived credential in
 * a cookie (`customer_sessions`), these are single-use capabilities in a URL.
 *
 * Its own file, rather than sitting beside `customer_accounts`, because it is the
 * only table that needs both accounts and orders — keeping it here leaves the
 * schema's import graph acyclic.
 *
 * The stored `id` is the SHA-256 of the token in the link, so a database dump
 * cannot be turned back into a working link. Lifetimes per purpose, and the
 * redemption rules, are in docs/code/customer-accounts.md.
 */
export const customerAuthTokens = pgTable(
  'customer_auth_tokens',
  {
    /** SHA-256 of the emailed token. The token itself only exists in the email. */
    id: text().primaryKey(),
    /**
     * The FK is declared below with an explicit name: the one drizzle would
     * derive is 64 bytes, and PostgreSQL truncates identifiers at 63 — see the
     * naming rule in AGENTS.md.
     */
    customerAccountId: uuid().notNull(),
    purpose: customerAuthPurpose().notNull(),
    /**
     * The order whose email carried this link, when there was one. It is what
     * makes clicking through from an order email able to confirm that specific
     * order, and what attaches a dispute report to the right order without
     * putting an order id in a URL.
     */
    orderId: uuid().references(() => orders.id, { onDelete: 'set null' }),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    /** Set on redemption. A second click finds it non-null and is refused. */
    consumedAt: timestamp({ withTimezone: true }),
    ipAddress: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('customer_auth_tokens_account_idx').on(t.customerAccountId),
    index('customer_auth_tokens_expires_idx').on(t.expiresAt),
    foreignKey({
      columns: [t.customerAccountId],
      foreignColumns: [customerAccounts.id],
      name: 'customer_auth_tokens_account_fk',
    }).onDelete('cascade'),
  ],
);

export const customerAuthTokensRelations = relations(customerAuthTokens, ({ one }) => ({
  customerAccount: one(customerAccounts, {
    fields: [customerAuthTokens.customerAccountId],
    references: [customerAccounts.id],
  }),
  order: one(orders, { fields: [customerAuthTokens.orderId], references: [orders.id] }),
}));
