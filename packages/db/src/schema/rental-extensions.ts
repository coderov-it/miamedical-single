import { relations, sql } from 'drizzle-orm';
import {
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { adminUsers } from './admin-users.ts';
import { contracts } from './contracts.ts';
import { customerAccounts } from './customers.ts';
import { rentalExtensionStatus } from './enums.ts';
import { orders } from './orders.ts';

/**
 * One extension of a rental order: the extra span, its price, how it was paid
 * and the contract that covers it. The order keeps its id and its original
 * start; each active row here pushed its end date from `fromDate` to `toDate`,
 * so the rows ordered by `toDate` ARE the order's extension history.
 */
export const rentalExtensions = pgTable(
  'rental_extensions',
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    status: rentalExtensionStatus().notNull().default('renew_pending'),
    /** The order's end date when this was requested — the new span starts here. */
    fromDate: date({ mode: 'string' }).notNull(),
    toDate: date({ mode: 'string' }).notNull(),
    days: integer().notNull(),
    amount: numeric({ precision: 12, scale: 2 }).notNull(),
    currency: text().notNull().default('EUR'),
    /**
     * The quote frozen per rental line, keyed by order item id:
     * `{ "<itemId>": { "unitPrice": "70.00", "total": "70.00" } }`. The contract
     * is issued after payment, and must print what was quoted, not today's list.
     */
    lineAmounts: jsonb().$type<Record<string, { unitPrice: string; total: string }>>().notNull(),
    /** Who asked for it: the customer from their account, or an operator. */
    requestedByCustomerAccountId: uuid(),
    requestedByAdminUserId: uuid().references(() => adminUsers.id, { onDelete: 'set null' }),
    /** Free text until online payment exists: `bank_transfer`, `cash`, `card_pos`… */
    paymentMethod: text(),
    paymentReference: text(),
    paidAt: timestamp({ withTimezone: true }),
    paidByAdminUserId: uuid().references(() => adminUsers.id, { onDelete: 'set null' }),
    contractId: uuid().references(() => contracts.id, { onDelete: 'set null' }),
    activatedAt: timestamp({ withTimezone: true }),
    cancelledAt: timestamp({ withTimezone: true }),
    cancelReason: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index('rental_extensions_order_idx').on(t.orderId, t.toDate),
    index('rental_extensions_contract_idx').on(t.contractId),
    /* One open extension per order: a second request while the first still waits
       for money or a signature would issue two contracts for the same days. */
    uniqueIndex('rental_extensions_one_open_key')
      .on(t.orderId)
      .where(sql`${t.status} IN ('renew_pending', 'awaiting_signature')`),
    foreignKey({
      columns: [t.requestedByCustomerAccountId],
      foreignColumns: [customerAccounts.id],
      name: 'rental_extensions_customer_fk',
    }).onDelete('set null'),
    check('rental_extensions_period_check', sql`${t.toDate} > ${t.fromDate} AND ${t.days} > 0`),
    check(
      'rental_extensions_paid_check',
      sql`${t.status} NOT IN ('awaiting_signature', 'active') OR ${t.paidAt} IS NOT NULL`,
    ),
    check(
      'rental_extensions_cancelled_check',
      sql`${t.status} <> 'cancelled' OR ${t.cancelledAt} IS NOT NULL`,
    ),
  ],
);

export const rentalExtensionsRelations = relations(rentalExtensions, ({ one }) => ({
  order: one(orders, { fields: [rentalExtensions.orderId], references: [orders.id] }),
  contract: one(contracts, { fields: [rentalExtensions.contractId], references: [contracts.id] }),
}));
