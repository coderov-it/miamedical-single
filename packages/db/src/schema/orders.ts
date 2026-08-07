import { relations } from 'drizzle-orm';
import {
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

import { productSkus } from './catalog.ts';
import { orderStatus, paymentStatus } from './enums.ts';
import { users } from './users.ts';

/**
 * Nothing reads these tables yet — the orders module is a later pass. They are
 * kept in step with the catalog so the day it lands there is no conversion:
 * money is `numeric(12, 2)` (never integer cents, never a JS float) and lines
 * point at `product_skus`, the sellable unit of the new catalog.
 */

export const carts = pgTable(
  'carts',
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Null for guest carts, which are keyed by `token` instead. */
    userId: uuid().references(() => users.id, { onDelete: 'cascade' }),
    token: text().notNull(),
    currency: text().notNull().default('EUR'),
    expiresAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex('carts_token_key').on(t.token), index('carts_user_idx').on(t.userId)],
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
    userId: uuid().references(() => users.id, { onDelete: 'set null' }),
    email: text().notNull(),
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
    notes: text(),
    placedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex('orders_number_key').on(t.number),
    index('orders_user_idx').on(t.userId),
    index('orders_status_idx').on(t.status),
    index('orders_placed_at_idx').on(t.placedAt),
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
    unitPrice: numeric({ precision: 12, scale: 2 }).notNull(),
    total: numeric({ precision: 12, scale: 2 }).notNull(),
  },
  (t) => [index('order_items_order_idx').on(t.orderId)],
);

/**
 * Append-only audit of every status move, so the order detail can show *why*
 * an order is where it is rather than only where it is. Nothing updates or
 * deletes a row here.
 *
 * `field` is `status` or `paymentStatus` — one table rather than two keeps the
 * timeline a single ordered read. Values are text, not the enums: an event
 * written today must stay readable after an enum member is renamed or dropped.
 *
 * `actorUserId` is nullable and `set null` on delete: the event outlives the
 * account that caused it, and losing the actor must never lose the event.
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
    actorUserId: uuid().references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  // Named explicitly, and kept well under the 63-byte identifier limit.
  (t) => [index('order_status_events_order_idx').on(t.orderId, t.createdAt)],
);

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, { fields: [carts.userId], references: [users.id] }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  sku: one(productSkus, { fields: [cartItems.skuId], references: [productSkus.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
  events: many(orderStatusEvents),
}));

export const orderStatusEventsRelations = relations(orderStatusEvents, ({ one }) => ({
  order: one(orders, { fields: [orderStatusEvents.orderId], references: [orders.id] }),
  actor: one(users, { fields: [orderStatusEvents.actorUserId], references: [users.id] }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  sku: one(productSkus, { fields: [orderItems.skuId], references: [productSkus.id] }),
}));
