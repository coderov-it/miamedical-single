import { date, index, integer, numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { pricingMode } from './enums.ts';

/**
 * Sales rollups for the admin analytics page. Derived data: every row can be
 * rebuilt from `orders` + `order_items`, and the refresh job does exactly that,
 * one Europe/Rome day at a time (DELETE the day, INSERT it again). Nothing else
 * writes here. Worked example: docs/code/sales-analytics.md.
 *
 * Two tables because an order spans products: the number of orders on a day
 * cannot be summed from per-product rows without counting a two-line order
 * twice.
 *
 * Counted orders: status `paid`, `fulfilled` or `refunded` with `net_total > 0`,
 * each on the Rome day it was PLACED — extensions and refunds land on that day
 * too. Rules and worked example: docs/code/order-money.md. No foreign keys: a rollup must never block a
 * product delete, and the next refresh of that day corrects it anyway.
 */

/** One row per Europe/Rome day that had at least one counted order. */
export const salesDaily = pgTable('sales_daily', {
  day: date({ mode: 'string' }).primaryKey(),
  orderCount: integer().notNull(),
  /** `SUM(orders.net_total)` — placement + paid extensions − refunds. */
  revenue: numeric({ precision: 12, scale: 2 }).notNull(),
  /** `SUM(orders.extension_total)` — already inside `revenue`. */
  extensionRevenue: numeric({ precision: 12, scale: 2 }).notNull(),
  /** `SUM(orders.refunded_total)` — already taken out of `revenue`. */
  refundedTotal: numeric({ precision: 12, scale: 2 }).notNull(),
  /** `SUM(order_items.total)` — the goods only. */
  itemsRevenue: numeric({ precision: 12, scale: 2 }).notNull(),
  shippingTotal: numeric({ precision: 12, scale: 2 }).notNull(),
  discountTotal: numeric({ precision: 12, scale: 2 }).notNull(),
  units: integer().notNull(),
});

/**
 * One row per day × product × pricing mode. `productId` is null once a product
 * is deleted (`order_items.product_id` is `set null`); such lines are kept and
 * grouped by the title snapshot so revenue never silently disappears.
 */
export const productSalesDaily = pgTable(
  'product_sales_daily',
  {
    day: date({ mode: 'string' }).notNull(),
    productId: uuid(),
    /** The line's title snapshot — the fallback label for a deleted product. */
    productTitle: text().notNull(),
    pricingMode: pricingMode().notNull(),
    /** Distinct orders that carried this product on this day. */
    orderCount: integer().notNull(),
    units: integer().notNull(),
    revenue: numeric({ precision: 12, scale: 2 }).notNull(),
  },
  (t) => [
    index('product_sales_daily_day_idx').on(t.day),
    index('product_sales_daily_product_day_idx').on(t.productId, t.day),
  ],
);
