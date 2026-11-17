import { relations } from 'drizzle-orm';
import {
  integer,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { products } from './catalog.ts';
import { customerAccounts } from './customers.ts';

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
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    quantity: integer().notNull().default(1),
    /** Price captured when the item was added, so cart totals stay stable. */
    unitPrice: numeric({ precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('cart_items_cart_product_key').on(t.cartId, t.productId),
    index('cart_items_cart_idx').on(t.cartId),
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
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
}));
