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

/**
 * Tiers of the delivery-pricing tree, widest first.
 *
 * `cap` is NOT a tier of Italian geography — a CAP is a postal code drawn by the
 * post office, and it lines up with nothing. Measured on the seeded reference
 * data: Rome alone holds 79 CAPs, while CAP 00060 covers 17 whole comuni and
 * 24060 covers 45. Finer than a comune in a city, far coarser in the countryside.
 * A `cap` row therefore always means the PAIR (its parent comune + this code),
 * which is why it sits under `comune` and is never a root.
 *
 * `frazione` is deliberately declared but unused: no Italian retailer surveyed
 * prices below CAP, and a frazione cannot be matched reliably from address data.
 * Keeping the value here means enabling that tier later costs no migration —
 * appending to a pg enum is the one cheap change, inserting is not.
 */
export const deliveryZoneLevel = pgEnum('delivery_zone_level', [
  'country',
  'region',
  'province',
  'comune',
  'cap',
  'frazione',
]);

/**
 * What a zone row decides. A NULL column means "inherit from the nearest
 * ancestor that decided something", which is deliberately different from `call`:
 *
 *   NULL   nobody has filled this in
 *   fee    a fixed amount the customer sees at checkout
 *   call   we serve this area and will not quote it online
 *
 * Only the last two are decisions. Collapsing `call` into NULL would lose the
 * owner's intent the first time someone tidied up empty rows.
 */
export const deliveryZoneValue = pgEnum('delivery_zone_value', ['fee', 'call']);
