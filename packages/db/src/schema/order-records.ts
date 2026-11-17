import { relations } from 'drizzle-orm';
import {
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { adminUsers } from './admin-users.ts';
import { products } from './catalog.ts';
import { contracts } from './contracts.ts';
import { customerAccounts } from './customers.ts';
import { orderDisputeStatus } from './enums.ts';
import { orders } from './orders.ts';

/**
 * The rows that hang off an order: lines, the status timeline and dispute reports,
 * plus the order's own relations. Split from `orders.ts` to keep each file small.
 */

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid().references(() => products.id, { onDelete: 'set null' }),
    /** Snapshot — the line stays readable even if the product is deleted. */
    productTitle: text().notNull(),
    quantity: integer().notNull(),
    /**
     * The configured rate this line was priced at — per rental unit on a rental
     * product, one-off on a fixed one.
     *
     * `unitPrice × quantity` is deliberately NOT `total`: the total also carries
     * the rental duration and the line's add-ons. `configuration` below is what
     * explains the difference, which is why the admin renders the breakdown from
     * it rather than leaving an operator to reconcile two numbers.
     */
    unitPrice: numeric({ precision: 12, scale: 2 }).notNull(),
    total: numeric({ precision: 12, scale: 2 }).notNull(),
    /**
     * What the customer actually configured, snapshotted at the labels they saw:
     * the rental period and its resolved duration, the package, every intake
     * answer, and each add-on with its own amount.
     *
     * One jsonb rather than a column per concept, because a rental request has no
     * fixed shape — a product can ask any question its category defines — and
     * because this is a RECORD, read as a whole by an operator and never
     * aggregated. Shape and worked examples: docs/code/orders-placement.md.
     */
    configuration: jsonb().$type<Record<string, unknown>>(),
  },
  (t) => [index('order_items_order_idx').on(t.orderId)],
);

/**
 * Append-only audit of every status move, so the order detail can show *why*
 * an order is where it is rather than only where it is. Nothing updates or
 * deletes a row here.
 *
 * `field` is `status`, `paymentStatus` or `customerLink` — one table rather than
 * three keeps the timeline a single ordered read. Values are text, not the enums:
 * an event written today must stay readable after an enum member is renamed or
 * dropped, which is also what let `customerLink` be added without a type change.
 *
 * Two actor columns because the two kinds of actor live in different tables and
 * exactly one of them acts on any given event: an operator moving a status, or a
 * customer confirming or rejecting a link. Both are nullable and `set null` on
 * delete — the event outlives the account that caused it, and losing the actor
 * must never lose the event.
 */
export const orderStatusEvents = pgTable(
  'order_status_events',
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    field: text().notNull(),
    fromValue: text(),
    toValue: text().notNull(),
    note: text(),
    actorAdminUserId: uuid().references(() => adminUsers.id, { onDelete: 'set null' }),
    /**
     * FK declared below with an explicit name: the derived one is 69 bytes and
     * PostgreSQL truncates identifiers at 63.
     */
    actorCustomerAccountId: uuid(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  // Named explicitly, and kept well under the 63-byte identifier limit.
  (t) => [
    index('order_status_events_order_idx').on(t.orderId, t.createdAt),
    foreignKey({
      columns: [t.actorCustomerAccountId],
      foreignColumns: [customerAccounts.id],
      name: 'order_status_events_actor_customer_fk',
    }).onDelete('set null'),
  ],
);

/**
 * "I did not place this order" reports, raised from the button in every order
 * email. The emailed `order_report` token is what authorises the write, so the
 * reporter needs no account and no order id is ever exposed in a URL.
 *
 * `reportedPhone` is collected again on the form rather than read off the order:
 * the whole point is to reach the real person, and the number on a fraudulent
 * order is the fraudster's.
 */
export const orderDisputes = pgTable(
  'order_disputes',
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    /** Set only when the report came from inside a signed-in session. */
    customerAccountId: uuid().references(() => customerAccounts.id, { onDelete: 'set null' }),
    reportedPhone: text().notNull(),
    message: text().notNull(),
    status: orderDisputeStatus().notNull().default('open'),
    adminNotes: text(),
    resolvedByAdminUserId: uuid().references(() => adminUsers.id, { onDelete: 'set null' }),
    resolvedAt: timestamp({ withTimezone: true }),
    ipAddress: text(),
    userAgent: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('order_disputes_order_idx').on(t.orderId),
    index('order_disputes_status_idx').on(t.status),
    index('order_disputes_created_idx').on(t.createdAt),
  ],
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customerAccount: one(customerAccounts, {
    fields: [orders.customerAccountId],
    references: [customerAccounts.id],
  }),
  items: many(orderItems),
  events: many(orderStatusEvents),
  disputes: many(orderDisputes),
  contracts: many(contracts),
}));

export const orderStatusEventsRelations = relations(orderStatusEvents, ({ one }) => ({
  order: one(orders, { fields: [orderStatusEvents.orderId], references: [orders.id] }),
  actorAdminUser: one(adminUsers, {
    fields: [orderStatusEvents.actorAdminUserId],
    references: [adminUsers.id],
  }),
  actorCustomerAccount: one(customerAccounts, {
    fields: [orderStatusEvents.actorCustomerAccountId],
    references: [customerAccounts.id],
  }),
}));

export const orderDisputesRelations = relations(orderDisputes, ({ one }) => ({
  order: one(orders, { fields: [orderDisputes.orderId], references: [orders.id] }),
  customerAccount: one(customerAccounts, {
    fields: [orderDisputes.customerAccountId],
    references: [customerAccounts.id],
  }),
  resolvedByAdminUser: one(adminUsers, {
    fields: [orderDisputes.resolvedByAdminUserId],
    references: [adminUsers.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));
