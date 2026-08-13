import { pgEnum } from 'drizzle-orm/pg-core';

/*
 * There is deliberately no role enum. Back-office access is attribute-based:
 * `admin_users.permissions` holds integer codes from `@mia/permissions`, and
 * `admin_users.is_superuser` is the one attribute meaning "every code, including
 * ones added later". A role here would reintroduce a second, competing way to
 * answer "may they?" — see packages/permissions/src/check.ts.
 */

/**
 * What an emailed one-shot link lets someone do. One enum, one table
 * (`customer_auth_tokens`): every purpose has the same lifecycle — issue, mail,
 * redeem once, expire — so they share a row shape and an expiry sweep.
 *
 * TTLs are policy, not schema, and live in the customer-auth service.
 */
export const customerAuthPurpose = pgEnum('customer_auth_purpose', [
  'activation',
  'magic_link',
  'password_reset',
  'order_report',
]);

/**
 * How much we trust that the account on an order really placed it.
 *
 * Checkout asks for an email and takes what it is given, so a match against an
 * existing account is a claim, not proof. `unverified` is that claim; the
 * customer either confirms it or rejects it from their own account. Rejecting
 * clears `orders.customer_account_id` and never touches the order itself —
 * `orders_customer_link_check` enforces that pairing.
 */
export const orderCustomerLink = pgEnum('order_customer_link', [
  'unverified',
  'confirmed',
  'rejected',
]);

/** Where an "I did not place this order" report has got to. */
export const orderDisputeStatus = pgEnum('order_dispute_status', [
  'open',
  'contacted',
  'resolved',
  'confirmed_fraud',
]);

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

/**
 * Who is renting, which decides the fiscal identifier the order must carry: a
 * `private` gives a codice fiscale, a `company` gives both a partita IVA and its
 * own codice fiscale, and a `tourist` gives neither. The checkout asks the
 * question in those terms, and `orders_fiscal_check` holds the rule in the
 * database.
 */
export const customerType = pgEnum('customer_type', ['private', 'company', 'tourist']);

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

export const contractStatus = pgEnum('contract_status', [
  'draft',
  'generated',
  'sent',
  'viewed',
  'signed',
  'voided',
]);

export const contractVariant = pgEnum('contract_variant', [
  'carrozzina_italian',
  'carrozzina_tourist',
  'scooter_italian',
  'scooter_tourist',
]);

export const blogPostStatus = pgEnum('blog_post_status', ['draft', 'published', 'archived']);

/*
 * `delivery_zone_level` and `delivery_zone_value` stood here. They typed a price
 * tree over Italian geography that resolved a delivery fee from the customer's
 * CAP. Delivery is no longer priced online — see `geography.ts` — and both types
 * were dropped in `0003_drop_delivery_pricing_and_geography`.
 */
