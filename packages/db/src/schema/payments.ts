import { relations } from 'drizzle-orm';
import { index, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { paymentAttemptStatus } from './enums.ts';
import { orders } from './orders.ts';
import { rentalExtensions } from './rental-extensions.ts';

/**
 * Every time a customer is sent to the payment gateway, one row. An order that
 * failed once and was paid on the second try has two. Walk-through:
 * docs/code/online-payments.md.
 *
 * `rentalExtensionId` is set when the money pays for a renewal rather than for
 * the order itself; the order id is always set, so an order's money history is
 * one read.
 */
export const paymentAttempts = pgTable(
  'payment_attempts',
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    rentalExtensionId: uuid().references(() => rentalExtensions.id, { onDelete: 'set null' }),
    /** Which gateway took it — `nexi` today. */
    provider: text().notNull(),
    /** The id the gateway knows this attempt by: `MIA2026001042P1`. */
    providerReference: text().notNull(),
    /** Secret the gateway echoes in its notification, proving the call is its own. */
    providerSecret: text(),
    /**
     * Ours, random, and the only thing in the result page's URL. It lets a
     * guest read the outcome and try again without an account.
     */
    accessToken: text().notNull(),
    status: paymentAttemptStatus().notNull().default('pending'),
    amount: numeric({ precision: 12, scale: 2 }).notNull(),
    currency: text().notNull().default('EUR'),
    /** The gateway's own words for the outcome (`EXECUTED`, `DECLINED`…). */
    providerResult: text(),
    providerOperationId: text(),
    /** Card circuit as the gateway reports it: `VISA`, `MC`… */
    paymentCircuit: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    uniqueIndex('payment_attempts_provider_reference_key').on(t.provider, t.providerReference),
    uniqueIndex('payment_attempts_access_token_key').on(t.accessToken),
    index('payment_attempts_order_idx').on(t.orderId, t.createdAt),
  ],
);

export const paymentAttemptsRelations = relations(paymentAttempts, ({ one }) => ({
  order: one(orders, { fields: [paymentAttempts.orderId], references: [orders.id] }),
  rentalExtension: one(rentalExtensions, {
    fields: [paymentAttempts.rentalExtensionId],
    references: [rentalExtensions.id],
  }),
}));
