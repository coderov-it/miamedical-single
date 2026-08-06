import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * Back-office roles only — the storefront takes orders without accounts, so
 * `customer` exists purely for orders that get linked to a person later.
 *
 * `super_admin` bypasses every permission check (see `@mia/permissions`);
 * every other role is granted capabilities through `users.permissions`.
 *
 * New values are appended, never inserted: PostgreSQL enum ordering is part of
 * the type, and appending keeps the migration a single `ADD VALUE`.
 */
export const userRole = pgEnum('user_role', ['customer', 'staff', 'admin', 'super_admin']);

export const productStatus = pgEnum('product_status', ['draft', 'active', 'archived']);

export const orderStatus = pgEnum('order_status', [
  'pending',
  'paid',
  'fulfilled',
  'cancelled',
  'refunded',
]);

export const paymentStatus = pgEnum('payment_status', [
  'unpaid',
  'authorized',
  'paid',
  'partially_refunded',
  'refunded',
  'failed',
]);

export const addressKind = pgEnum('address_kind', ['shipping', 'billing']);
