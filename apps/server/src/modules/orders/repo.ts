/**
 * DB writes and single-order reads. Plain records out — no auth, no DTOs. The
 * list, dashboard, customer-lookup and calendar reads are in list-repo.ts, carts
 * in cart-repo.ts.
 */

import type { Database, DatabaseWriter, Transaction } from '@mia/db';
import { asc, eq, inArray, sql } from '@mia/db';
import {
  adminUsers,
  customerAccounts,
  orderItems,
  orders,
  orderStatusEvents,
  products,
} from '@mia/db/schema';

import { emit, emitToAdmins } from '../notifications/write.ts';
import type {
  ActorRef,
  OrderAggregate,
  OrderStatusEventRecord,
  OrderSummaryRecord,
} from './types.ts';

// --- orders ----------------------------------------------------------------

export async function findById(db: Database, id: string): Promise<OrderAggregate | undefined> {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, id) });
  if (!order) return undefined;

  const [items, events] = await Promise.all([
    db.query.orderItems.findMany({
      where: eq(orderItems.orderId, id),
      orderBy: asc(orderItems.id),
    }),
    findEvents(db, id),
  ]);

  return { ...order, items, events };
}

export async function findEvents(db: Database, orderId: string): Promise<OrderStatusEventRecord[]> {
  const rows = await db
    .select({
      event: orderStatusEvents,
      adminId: adminUsers.id,
      adminEmail: adminUsers.email,
      adminName: adminUsers.fullName,
      customerId: customerAccounts.id,
      customerEmail: customerAccounts.email,
      customerFirstName: customerAccounts.firstName,
      customerLastName: customerAccounts.lastName,
    })
    .from(orderStatusEvents)
    // Two actor tables, at most one of which matches: an operator moved a status,
    // or a customer confirmed or rejected the account link.
    .leftJoin(adminUsers, eq(orderStatusEvents.actorAdminUserId, adminUsers.id))
    .leftJoin(customerAccounts, eq(orderStatusEvents.actorCustomerAccountId, customerAccounts.id))
    .where(eq(orderStatusEvents.orderId, orderId))
    // Oldest first: a timeline is read downwards. `id` breaks ties so two
    // events written in the same transaction keep a stable order.
    .orderBy(asc(orderStatusEvents.createdAt), asc(orderStatusEvents.id));

  return rows.map((row) => ({
    ...row.event,
    actor: resolveActor(row),
  }));
}

/**
 * Collapses the two actor joins into one reference. `kind` matters to the reader:
 * "Confermato" from an operator and from the customer are different facts, and
 * without it the timeline would present them identically.
 */
function resolveActor(row: {
  adminId: string | null;
  adminEmail: string | null;
  adminName: string | null;
  customerId: string | null;
  customerEmail: string | null;
  customerFirstName: string | null;
  customerLastName: string | null;
}): ActorRef | null {
  if (row.adminId && row.adminEmail) {
    return { kind: 'admin', id: row.adminId, email: row.adminEmail, fullName: row.adminName };
  }

  if (row.customerId && row.customerEmail) {
    return {
      kind: 'customer',
      id: row.customerId,
      email: row.customerEmail,
      fullName: `${row.customerFirstName ?? ''} ${row.customerLastName ?? ''}`.trim() || null,
    };
  }

  return null;
}

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
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  customerType: 'private' | 'company' | 'tourist';
  codiceFiscale: string | null;
  partitaIva: string | null;
  currency: string;
  subtotal: string;
  shippingTotal: string;
  total: string;
  /**
   * Null on a collection, which has no address: the checkout asks for one only
   * when something is being delivered. Both columns are nullable jsonb, so this is
   * the column's own shape rather than a widening.
   */
  shippingAddress: Record<string, unknown> | null;
  billingAddress: Record<string, unknown> | null;
  delivery: Record<string, unknown>;
  notes: string | null;
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
        customerType: data.customerType,
        codiceFiscale: data.codiceFiscale,
        partitaIva: data.partitaIva,
        status: 'pending',
        paymentStatus: 'unpaid',
        currency: data.currency,
        subtotal: data.subtotal,
        shippingTotal: data.shippingTotal,
        total: data.total,
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress,
        delivery: data.delivery,
        notes: data.notes,
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
      note: 'Placed from the storefront checkout.',
      actorAdminUserId: null,
      actorCustomerAccountId: null,
    });

    /* Closes the gap `docs/code/notifications-and-mail.md` names outright: a new
       order alerted nobody. Inside the order's own transaction, so an operator
       is never told about a checkout that rolled back. */
    await emitToAdmins(tx, {
      type: 'order.placed',
      orderId: order.id,
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
  total?: string;
}

export async function update(db: Database, id: string, patch: OrderPatch): Promise<void> {
  await db.update(orders).set(patch).where(eq(orders.id, id));
}

export interface StatusEventData {
  orderId: string;
  field: 'status' | 'paymentStatus';
  fromValue: string;
  toValue: string;
  note: string | null;
  actorAdminUserId: string | null;
}

/**
 * The status column and its audit entry move together or not at all. The
 * transaction lives here rather than in the service because that is where the
 * other multi-statement writes in this codebase keep theirs — and because a
 * status with no explanation is precisely the state the timeline exists to
 * prevent.
 */
export async function applyTransition(db: Database, event: StatusEventData): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ [event.field]: event.toValue })
      .where(eq(orders.id, event.orderId));
    await tx.insert(orderStatusEvents).values(event);
    /* The customer's copy of the same fact, in the same transaction and under
       the same rollback. It reaches nobody until the customer feed ships in
       phase two — the row is written now so the feed opens with history rather
       than with an empty list. */
    await emitOrderStatusChanged(tx, event);
  });
}

/**
 * The customer-facing half of a transition, written only where there is a
 * customer to tell.
 *
 * An unclaimed order has no account id, and `notifications_recipient_check`
 * refuses a customer row without one — correctly: there is nobody to address.
 * Those orders are reachable through the emailed order link instead, which is
 * what the placement mail already provides.
 */
async function emitOrderStatusChanged(tx: Transaction, event: StatusEventData): Promise<void> {
  const [order] = await tx
    .select({ number: orders.number, customerAccountId: orders.customerAccountId })
    .from(orders)
    .where(eq(orders.id, event.orderId))
    .limit(1);

  if (!order?.customerAccountId) return;

  await emit(tx, {
    audience: 'customer',
    customerAccountId: order.customerAccountId,
    type: 'order.status_changed',
    orderId: event.orderId,
    data: {
      orderNumber: order.number,
      field: event.field,
      from: event.fromValue,
      to: event.toValue,
    },
  });
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
