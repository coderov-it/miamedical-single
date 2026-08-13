import { relations, sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgSequence,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { adminUsers } from './admin-users.ts';
import { productSkus } from './catalog.ts';
import { customerAccounts } from './customers.ts';
import { contracts } from './contracts.ts';
import {
  customerType,
  orderCustomerLink,
  orderDisputeStatus,
  orderStatus,
  paymentStatus,
} from './enums.ts';

/**
 * Money is `numeric(12, 2)` throughout — never integer cents, never a JS float —
 * and lines point at `product_skus`, the sellable unit of the catalog.
 *
 * The storefront writes here through `POST /api/orders`; how a checkout request
 * becomes these rows is documented in docs/code/orders-placement.md.
 */

/**
 * Feeds the human-facing `orders.number`. A sequence rather than
 * `MAX(number) + 1`: two customers confirming at the same moment would read the
 * same maximum, and the unique index would turn that into a failed checkout for
 * one of them.
 *
 * It does not reset per year, so the counter inside `MIA-2026-001042` is global
 * and simply keeps climbing. Starting at 1000 leaves the seed's own
 * `MIA-2026-000001…6` alone.
 */
export const orderNumberSeq = pgSequence('order_number_seq', { startWith: 1000, increment: 1 });

export const carts = pgTable(
  'carts',
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Null for guest carts, which are keyed by `token` instead. */
    customerAccountId: uuid().references(() => customerAccounts.id, { onDelete: 'cascade' }),
    token: text().notNull(),
    currency: text().notNull().default('EUR'),
    expiresAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex('carts_token_key').on(t.token),
    index('carts_customer_account_idx').on(t.customerAccountId),
  ],
);

export const cartItems = pgTable(
  'cart_items',
  {
    id: uuid().primaryKey().defaultRandom(),
    cartId: uuid()
      .notNull()
      .references(() => carts.id, { onDelete: 'cascade' }),
    skuId: uuid()
      .notNull()
      .references(() => productSkus.id, { onDelete: 'restrict' }),
    quantity: integer().notNull().default(1),
    /** Price captured when the item was added, so cart totals stay stable. */
    unitPrice: numeric({ precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('cart_items_cart_sku_key').on(t.cartId, t.skuId),
    index('cart_items_cart_idx').on(t.cartId),
  ],
);

export const orders = pgTable(
  'orders',
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Human-facing sequential-ish reference, e.g. MIA-2026-000123. */
    number: text().notNull(),
    /**
     * The account this order belongs to, or null for one nobody has claimed.
     * `set null` rather than cascade: deleting an account must never delete its
     * order history, which is a fiscal record.
     */
    customerAccountId: uuid().references(() => customerAccounts.id, { onDelete: 'set null' }),
    /**
     * How much the link above is worth. Checkout takes whatever email it is given,
     * so matching an existing account is a claim until the customer confirms it.
     */
    customerLinkStatus: orderCustomerLink().notNull().default('unverified'),
    email: text().notNull(),
    /**
     * The rest of the contact block. Nullable as a group: these are facts the
     * storefront checkout collects, and an order raised any other way — the seed,
     * an operator taking it over the phone — legitimately has none of them.
     *
     * The name is here as columns rather than only inside `shippingAddress`
     * because a store-pickup order has no address at all, and snapshotting the
     * name into a NULL address lost it entirely.
     */
    firstName: text(),
    lastName: text(),
    phone: text(),
    customerType: customerType(),
    /**
     * Italian fiscal instruments keep their Italian names, in code and in the
     * database — see the RULES section of AGENTS.md. A company writes its own
     * codice fiscale into `codiceFiscale` alongside its `partitaIva`.
     */
    codiceFiscale: text(),
    partitaIva: text(),
    status: orderStatus().notNull().default('pending'),
    paymentStatus: paymentStatus().notNull().default('unpaid'),
    currency: text().notNull().default('EUR'),
    subtotal: numeric({ precision: 12, scale: 2 }).notNull(),
    shippingTotal: numeric({ precision: 12, scale: 2 }).notNull().default('0.00'),
    taxTotal: numeric({ precision: 12, scale: 2 }).notNull().default('0.00'),
    discountTotal: numeric({ precision: 12, scale: 2 }).notNull().default('0.00'),
    total: numeric({ precision: 12, scale: 2 }).notNull(),
    /** Address snapshots — orders must not change when a user edits an address. */
    shippingAddress: jsonb().$type<Record<string, unknown>>(),
    billingAddress: jsonb().$type<Record<string, unknown>>(),
    /**
     * How this order changes hands, as the customer chose it:
     * `{ method, deliveryAddress?, deliveryPostalCode?, pickupCity?, quote? }`,
     * where `quote` is what the zone ladder answered —
     * `{ kind, fee, areaLabel, resolvedVia, zoneId, comune }`.
     *
     * A jsonb rather than columns because this is the part of an order most likely
     * to change shape next, and because a method only ever means anything together
     * with the one detail it carries. It has already changed once, and the change
     * was migrated rather than absorbed: `0008_retire_hotel_delivery` rewrote every
     * stored `hotelDelivery` into a `homeDelivery` with an address, so no reader has
     * to know a shape that no writer produces. The mapper still reads field by
     * field, so an unexpected shape degrades to a blank line, never to an error.
     */
    delivery: jsonb().$type<Record<string, unknown>>(),
    notes: text(),
    placedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex('orders_number_key').on(t.number),
    index('orders_customer_account_idx').on(t.customerAccountId),
    index('orders_status_idx').on(t.status),
    index('orders_placed_at_idx').on(t.placedAt),
    /**
     * Rejecting a link clears the account id, so the two columns can never
     * disagree about whether this order still belongs to somebody.
     */
    check(
      'orders_customer_link_check',
      sql`${t.customerLinkStatus} <> 'rejected' OR ${t.customerAccountId} IS NULL`,
    ),
    /**
     * A delivery block with no method names nothing — the fee, the address and
     * the panel the operator reads all hang off it.
     */
    check('orders_delivery_check', sql`${t.delivery} IS NULL OR ${t.delivery} ? 'method'`),
    /**
     * The fiscal rule the checkout asks in words, held here so it survives any
     * other way an order gets written. `tourist` carries neither identifier, so
     * it is not named: the constraint only forbids the two combinations that
     * would leave an invoice unissuable.
     */
    check(
      'orders_fiscal_check',
      sql`(${t.customerType} <> 'private' OR ${t.codiceFiscale} IS NOT NULL)
        AND (${t.customerType} <> 'company' OR (${t.partitaIva} IS NOT NULL AND ${t.codiceFiscale} IS NOT NULL))`,
    ),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    skuId: uuid().references(() => productSkus.id, { onDelete: 'set null' }),
    /** Snapshots — the line stays readable even if the product is deleted. */
    productTitle: text().notNull(),
    skuLabel: text().notNull(),
    sku: text().notNull(),
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
     * the rental period and its resolved duration, the package, every variant
     * choice, every intake answer, and each add-on with its own amount.
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

export const cartsRelations = relations(carts, ({ one, many }) => ({
  customerAccount: one(customerAccounts, {
    fields: [carts.customerAccountId],
    references: [customerAccounts.id],
  }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  sku: one(productSkus, { fields: [cartItems.skuId], references: [productSkus.id] }),
}));

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
  sku: one(productSkus, { fields: [orderItems.skuId], references: [productSkus.id] }),
}));
