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

/** Chosen at product creation and never updated — the repo's UPDATE omits it. */
export const pricingMode = pgEnum('pricing_mode', ['fixed', 'rental']);

/** The billing increment a rental price is quoted per. One unit per product. */
export const rentalUnit = pgEnum('rental_unit', ['hour', 'day']);

/** Value shapes shared by variant groups and category specs. */
export const valueType = pgEnum('value_type', [
  'string',
  'number',
  'single_select',
  'multi_select',
  'boolean',
  'number_range',
]);

/** Value shapes for intake questions answered by the customer at order time. */
export const questionValueType = pgEnum('question_value_type', [
  'string',
  'text',
  'number',
  'single_select',
  'multi_select',
  'boolean',
  'date',
]);

export const termsStatus = pgEnum('terms_status', ['draft', 'published', 'archived']);
