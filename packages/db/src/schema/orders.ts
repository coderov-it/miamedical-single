import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { productVariants } from './catalog.ts';
import { orderStatus, paymentStatus } from './enums.ts';
import { users } from './users.ts';

export const carts = pgTable(
  'carts',
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Null for guest carts, which are keyed by `token` instead. */
    userId: uuid().references(() => users.id, { onDelete: 'cascade' }),
    token: text().notNull(),
    currency: text().notNull().default('USD'),
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
    variantId: uuid()
      .notNull()
      .references(() => productVariants.id, { onDelete: 'restrict' }),
    quantity: integer().notNull().default(1),
    /** Price captured when the item was added, so cart totals stay stable. */
    unitPriceCents: integer().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('cart_items_cart_variant_key').on(t.cartId, t.variantId),
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
    currency: text().notNull().default('USD'),
    subtotalCents: integer().notNull(),
    shippingCents: integer().notNull().default(0),
    taxCents: integer().notNull().default(0),
    discountCents: integer().notNull().default(0),
    totalCents: integer().notNull(),
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
    variantId: uuid().references(() => productVariants.id, { onDelete: 'set null' }),
    /** Snapshots — the line stays readable even if the product is deleted. */
    productName: text().notNull(),
    variantName: text().notNull(),
    sku: text().notNull(),
    quantity: integer().notNull(),
    unitPriceCents: integer().notNull(),
    totalCents: integer().notNull(),
  },
  (t) => [index('order_items_order_idx').on(t.orderId)],
);

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, { fields: [carts.userId], references: [users.id] }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));
