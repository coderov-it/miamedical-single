/**
 * DB writes (the single-order reads are in detail-repo.ts, re-exported here). Plain records out — no auth, no DTOs. The
 * list, dashboard, customer-lookup and calendar reads are in list-repo.ts, carts
 * in cart-repo.ts.
 */

import type { Database, DatabaseWriter, Transaction } from '@mia/db';
import { eq, inArray, sql } from '@mia/db';
import { orderItems, orders, orderStatusEvents, products } from '@mia/db/schema';

import { emitToAdmins } from '../notifications/write.ts';
import { applyStockMoves } from './stock.ts';
import type { OrderRow, OrderSummaryRecord } from './types.ts';

export { findById, findEvents, findRefunds } from './detail-repo.ts';

// --- placing an order ------------------------------------------------------

export interface NewOrderItemData {
  productId: string | null;
  productTitle: string;
  quantity: number;
  unitPrice: string;
  total: string;
  configuration: Record<string, unknown>;
}

export interface NewOrderData {
  /**
   * The account this order is attached to, and how much that attachment is worth.
   * Null when checkout could not resolve one at all; `confirmed` only when the
   * order was placed from inside a signed-in session.
   */
  customerAccountId: string | null;
  customerLinkStatus: 'unverified' | 'confirmed' | 'rejected';
  /**
   * Nullable as a group, like the columns: a manual order starts with the email
   * alone and the customer completes the rest at their order link.
   */
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  customerType: 'private' | 'company' | 'tourist' | null;
  codiceFiscale: string | null;
  partitaIva: string | null;
  currency: string;
  subtotal: string;
  shippingTotal: string;
  /** Absent means a checkout order: no discount. */
  discountTotal?: string;
  discountReason?: string | null;
  total: string;
  /** Absent means `online`. A `manual` order must name its agent. */
  source?: 'online' | 'manual';
  createdByAdminUserId?: string | null;
  /** The opening timeline note; absent reads as the storefront's. */
  openingNote?: string;
  /**
   * Null on a collection, which has no address: the checkout asks for one only
   * when something is being delivered. Both columns are nullable jsonb, so this is
   * the column's own shape rather than a widening.
   */
  shippingAddress: Record<string, unknown> | null;
  billingAddress: Record<string, unknown> | null;
  delivery: Record<string, unknown>;
  notes: string | null;
  /** When it is cancelled if still unpaid; null for no deadline. */
  paymentDueAt: Date | null;
  items: NewOrderItemData[];
}

/**
 * `MIA-2026-001042`. The counter comes from `order_number_seq`, so two customers
 * confirming in the same second cannot read the same number — which a
 * `MAX(number) + 1` would let them do, turning a unique-index violation into a
 * failed checkout for whoever lost the race.
 *
 * The year is stamped from the clock at placement, not from the counter, so the
 * prefix reads as "when" while the counter stays globally unique.
 */
async function nextOrderNumber(tx: Pick<Database, 'execute'>): Promise<string> {
  const rows = await tx.execute<{ value: string }>(
    sql`SELECT nextval('order_number_seq')::text AS value`,
  );
  const counter = rows[0]?.value ?? '0';
  return `MIA-${new Date().getUTCFullYear()}-${counter.padStart(6, '0')}`;
}

/**
 * The order, its lines and its opening timeline entry, or none of them.
 *
 * The `pending` event is written here rather than left implicit: the timeline is
 * what the admin reads to answer "why is this order where it is", and an order
 * whose first state has no entry reads as one that appeared out of nowhere.
 */
export async function insertOrder(
  db: Database,
  data: NewOrderData,
  /** Runs last, inside the same transaction — how a rental's signed contract commits with it. */
  onInserted?: (tx: Transaction, order: { id: string; number: string }) => Promise<void>,
): Promise<{ id: string; number: string; placedAt: Date }> {
  return db.transaction(async (tx) => {
    const number = await nextOrderNumber(tx);

    const [order] = await tx
      .insert(orders)
      .values({
        number,
        customerAccountId: data.customerAccountId,
        customerLinkStatus: data.customerLinkStatus,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        source: data.source ?? 'online',
        createdByAdminUserId: data.createdByAdminUserId ?? null,
        customerType: data.customerType,
        codiceFiscale: data.codiceFiscale,
        partitaIva: data.partitaIva,
        status: 'pending',
        paymentStatus: 'unpaid',
        currency: data.currency,
        subtotal: data.subtotal,
        shippingTotal: data.shippingTotal,
        discountTotal: data.discountTotal ?? '0.00',
        discountReason: data.discountReason ?? null,
        total: data.total,
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress,
        delivery: data.delivery,
        notes: data.notes,
        paymentDueAt: data.paymentDueAt,
        stockTaken: true,
      })
      .returning({ id: orders.id, number: orders.number, placedAt: orders.placedAt });

    if (!order) throw new Error('Order insert returned no row.');

    await tx.insert(orderItems).values(
      data.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        productTitle: item.productTitle,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        configuration: item.configuration,
      })),
    );

    /* The units leave the shelf now, with the order, so two customers can never
       pay for the same last one. Short stock rolls the whole order back as an
       `out_of_stock` 409 — see stock.ts and docs/code/orders-stock.md. */
    await applyStockMoves(tx, data.items, null, 'pending', false, {
      orderId: order.id,
      actorAdminUserId: data.createdByAdminUserId ?? null,
    });

    /**
     * Demand, counted once per order rather than per unit — three of the same
     * product in one cart is still one order that wanted it. Inside the same
     * transaction as the lines it counts, so the ranking can never drift from
     * the order history it claims to summarise. Deleted products drop out of
     * the list; `distinctProductIds` is what keeps the bump idempotent when a
     * cart holds the same product on two configured lines.
     */
    const distinctProductIds = [
      ...new Set(data.items.map((item) => item.productId).filter((id) => id !== null)),
    ];
    if (distinctProductIds.length > 0) {
      await tx
        .update(products)
        .set({ orderCount: sql`${products.orderCount} + 1` })
        .where(inArray(products.id, distinctProductIds));
    }

    await tx.insert(orderStatusEvents).values({
      orderId: order.id,
      field: 'status',
      // Nothing preceded it — the order did not move into `pending`, it began there.
      fromValue: null,
      toValue: 'pending',
      note: data.openingNote ?? 'Placed from the storefront checkout.',
      actorAdminUserId: data.createdByAdminUserId ?? null,
      actorCustomerAccountId: null,
    });

    /* Closes the gap `docs/code/notifications-and-mail.md` names outright: a new
       order alerted nobody. Inside the order's own transaction, so an operator
       is never told about a checkout that rolled back. A manual order does not
       tell the agent who just created it. */
    await emitToAdmins(tx, {
      type: 'order.placed',
      orderId: order.id,
      exceptAdminUserId: data.createdByAdminUserId ?? null,
      data: {
        orderNumber: order.number,
        total: data.total,
        currency: data.currency,
        customerName: `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() || data.email,
      },
    });

    if (onInserted) await onInserted(tx, order);

    return { id: order.id, number: order.number, placedAt: order.placedAt };
  });
}

export interface OrderPatch {
  notes?: string | null;
  shippingAddress?: Record<string, unknown> | null;
  billingAddress?: Record<string, unknown> | null;
  status?: OrderSummaryRecord['status'];
  paymentStatus?: OrderSummaryRecord['paymentStatus'];
  /**
   * Always written together, never one without the other: the total is the
   * subtotal plus this, and the service is what re-derives it. A caller that set
   * only the fee would leave the order's own arithmetic wrong.
   */
  shippingTotal?: string;
  /** Set only by `manual/discount.ts`, together with its reason and the total. */
  discountTotal?: string;
  discountReason?: string | null;
  total?: string;
  /** The customer block, written by the customer from a manual order's link (`order-links/details.ts`). */
  firstName?: string;
  lastName?: string;
  phone?: string;
  customerType?: OrderRow['customerType'];
  codiceFiscale?: string | null;
  partitaIva?: string | null;
}

export async function update(db: DatabaseWriter, id: string, patch: OrderPatch): Promise<void> {
  await db.update(orders).set(patch).where(eq(orders.id, id));
}

export interface ContractEventData {
  orderId: string;
  fromValue: string | null;
  /** A contract status — `sent`, `signed` — so the timeline can badge it. */
  toValue: string;
  note: string | null;
  actorAdminUserId?: string | null;
}

/**
 * A contract milestone on the order's timeline. Unlike `applyTransition` this
 * writes no order column — the contract's own row is the source of truth for
 * its status; the event exists so "the customer signed" reads in the same place
 * every other fact about the order does.
 */
export async function insertContractEvent(
  db: DatabaseWriter,
  event: ContractEventData,
): Promise<void> {
  await db.insert(orderStatusEvents).values({
    orderId: event.orderId,
    field: 'contract',
    fromValue: event.fromValue,
    toValue: event.toValue,
    note: event.note,
    actorAdminUserId: event.actorAdminUserId ?? null,
    actorCustomerAccountId: null,
  });
}
