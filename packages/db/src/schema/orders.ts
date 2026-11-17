import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  foreignKey,
  index,
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
import { customerAccounts } from './customers.ts';
import {
  customerType,
  orderCustomerLink,
  orderSource,
  orderStatus,
  paymentStatus,
} from './enums.ts';

/**
 * Money is `numeric(12, 2)` throughout — never integer cents, never a JS float —
 * and lines point at `products`, the sellable unit of the catalog.
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
    /** Storefront checkout or an agent's phone order; see `orderSource`. */
    source: orderSource().notNull().default('online'),
    /**
     * The agent who created a manual order. Required when `source = 'manual'`
     * (`orders_manual_actor_check`); null on every online order, and after the
     * agent's account is deleted. FK declared below with an explicit name.
     */
    createdByAdminUserId: uuid(),
    /**
     * The agent's stated reason for `discountTotal`. Kept next to the amount so
     * the order explains its own price.
     */
    discountReason: text(),
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
    /**
     * Money that moved after placement. Both are written ONLY by the database:
     * triggers recompute them from `rental_extensions` (paid ones) and
     * `order_refunds` on every change there, so no app path can forget one.
     * `net_total` is what the order is finally worth, and what analytics sum.
     * Worked example: docs/code/order-money.md.
     */
    extensionTotal: numeric({ precision: 12, scale: 2 }).notNull().default('0.00'),
    refundedTotal: numeric({ precision: 12, scale: 2 }).notNull().default('0.00'),
    netTotal: numeric({ precision: 12, scale: 2 }).generatedAlwaysAs(
      sql`total + extension_total - refunded_total`,
    ),
    /** Address snapshots — orders must not change when a user edits an address. */
    shippingAddress: jsonb().$type<Record<string, unknown>>(),
    billingAddress: jsonb().$type<Record<string, unknown>>(),
    /**
     * How this order changes hands, as the customer chose it:
     * `{ method, deliveryAddress?, deliveryCity?, deliveryPostalCode?, pickupCity?,
     * returnToSameAddress, returnAddress }`.
     *
     * It once also carried a `quote` block — what the zone ladder answered for the
     * customer's CAP. Delivery is not priced online any more, so nothing writes
     * that key; `0003_drop_delivery_pricing_and_geography` stripped it from the stored rows.
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
    /**
     * When an unpaid storefront order gives up its stock and is cancelled — 60
     * minutes for a guest, 24 hours for a signed-in customer. NULL on orders that
     * never had a deadline: raised by an operator, or placed before online payment.
     */
    paymentDueAt: timestamp({ withTimezone: true }),
    /**
     * True while this order holds its units off the shelf before it is paid.
     * Placement takes stock at once and sets it; an order placed before that rule
     * has it false, so its stock is taken when it is paid instead — never twice.
     * See docs/code/orders-stock.md.
     */
    stockTaken: boolean().notNull().default(false),
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
    /* The expiry sweep's read: unpaid orders past their deadline. */
    index('orders_payment_due_idx')
      .on(t.paymentDueAt)
      .where(sql`${t.status} = 'pending' AND ${t.paymentDueAt} IS NOT NULL`),
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
    /** Never refund more than the order took in, extensions included. */
    check(
      'orders_money_check',
      sql`${t.extensionTotal} >= 0 AND ${t.refundedTotal} >= 0
        AND ${t.refundedTotal} <= ${t.total} + ${t.extensionTotal}`,
    ),
    /**
     * The fiscal rule the checkout asks in words, held here so it survives any
     * other way an order gets written. `tourist` carries neither identifier, so
     * it is not named: the constraint only forbids the two combinations that
     * would leave an invoice unissuable.
     *
     * A manual order is exempt: the customer completes their details later, at the
     * order link, and `orders/manual/readiness.ts` holds the same rule before such
     * an order may start.
     */
    check(
      'orders_fiscal_check',
      sql`${t.source} = 'manual' OR (
        (${t.customerType} <> 'private' OR ${t.codiceFiscale} IS NOT NULL)
        AND (${t.customerType} <> 'company' OR (${t.partitaIva} IS NOT NULL AND ${t.codiceFiscale} IS NOT NULL)))`,
    ),
    /** A discount is never negative and never exceeds what it is taken from. */
    check(
      'orders_discount_check',
      sql`${t.discountTotal} >= 0 AND ${t.discountTotal} <= ${t.subtotal} + ${t.shippingTotal}`,
    ),
    check(
      'orders_manual_actor_check',
      sql`${t.source} <> 'manual' OR ${t.createdByAdminUserId} IS NOT NULL`,
    ),
    /* Named explicitly: the derived name is 60 bytes, over the house limit. */
    foreignKey({
      columns: [t.createdByAdminUserId],
      foreignColumns: [adminUsers.id],
      name: 'orders_created_by_admin_fk',
    }).onDelete('set null'),
  ],
);
