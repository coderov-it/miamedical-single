/** DB queries for orders and carts. Plain records out — no auth, no DTOs. */

import type { Database } from '@mia/db';
import { and, asc, count, desc, eq, gte, ilike, inArray, lt, lte, or, sql } from '@mia/db';
import {
  adminUsers,
  cartItems,
  carts,
  customerAccounts,
  orderItems,
  orders,
  orderStatusEvents,
  products,
  productTranslations,
} from '@mia/db/schema';

import { multiply, sumMoney } from './mapper.ts';
import type {
  ActorRef,
  CartAggregate,
  CartItemRecord,
  CartListFilters,
  CartSummaryRecord,
  OrderAggregate,
  OrderListFilters,
  OrderStatusEventRecord,
  AdminOrderSummaryRecord,
  OrderSummaryRecord,
} from './types.ts';

// --- orders ----------------------------------------------------------------

function orderWhere(filters: OrderListFilters) {
  const clauses = [];

  if (filters.q) {
    const term = `%${filters.q}%`;
    clauses.push(or(ilike(orders.number, term), ilike(orders.email, term)));
  }
  if (filters.status) clauses.push(eq(orders.status, filters.status));
  if (filters.paymentStatus) clauses.push(eq(orders.paymentStatus, filters.paymentStatus));
  if (filters.type) {
    clauses.push(
      sql`EXISTS (
        SELECT 1 FROM ${orderItems} oi
        WHERE oi.order_id = ${orders.id}
          AND oi.configuration->>'pricingMode' = ${filters.type}
      )`,
    );
  }
  if (filters.from) clauses.push(gte(orders.placedAt, new Date(`${filters.from}T00:00:00.000Z`)));
  if (filters.to) clauses.push(lt(orders.placedAt, nextDay(filters.to)));

  return clauses.length > 0 ? and(...clauses) : undefined;
}

function nextDay(date: string): Date {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value;
}

export async function findMany(
  db: Database,
  filters: OrderListFilters,
): Promise<{ rows: AdminOrderSummaryRecord[]; total: number }> {
  const where = orderWhere(filters);

  // LEFT JOIN + GROUP BY rather than a correlated subquery in `sql`: drizzle
  // renders a bare `${table.column}` *unqualified* when the outer statement has
  // only one table, so `WHERE order_id = id` silently resolved both sides
  // inside order_items and counted zero every time. A real join makes drizzle
  // qualify. Grouping by the primary key lets Postgres carry the other order
  // columns through on functional dependency, and LIMIT still counts orders.
  const [rows, totals] = await Promise.all([
    db
      .select({
        order: orders,
        itemCount: count(orderItems.id),
        // Whether anything on the order is rented — the fact that decides if a
        // missing/unsigned contract is a problem worth flagging on the list.
        hasRental: sql<boolean>`COALESCE(bool_or(${orderItems.configuration}->>'pricingMode' = 'rental'), false)`,
        // The newest live contract's status. Voided ones are dead paper, so
        // they fall back to the contract they replaced rather than masking it.
        contractStatus: sql<string | null>`(
          SELECT c.status FROM contracts c
          WHERE c.order_id = ${orders.id} AND c.status <> 'voided'
          ORDER BY c.created_at DESC LIMIT 1
        )`,
      })
      .from(orders)
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(where)
      .groupBy(orders.id)
      .orderBy(desc(orders.placedAt))
      .limit(filters.perPage)
      .offset((filters.page - 1) * filters.perPage),
    db.select({ value: count() }).from(orders).where(where),
  ]);

  return {
    rows: rows.map((row) => ({
      ...row.order,
      itemCount: row.itemCount,
      hasRental: row.hasRental,
      contractStatus: row.contractStatus,
    })),
    total: totals[0]?.value ?? 0,
  };
}

/** Orders waiting on someone here — the number the queue leads with. */
export async function countAwaiting(db: Database): Promise<number> {
  const rows = await db.select({ value: count() }).from(orders).where(eq(orders.status, 'pending'));
  return rows[0]?.value ?? 0;
}

/**
 * Dashboard figures over a trailing window.
 *
 * "Revenue" counts only `paid` and `fulfilled` orders. Pending is money that
 * has not arrived, and cancelled and refunded are money that left again —
 * folding any of them in would produce a number nobody could reconcile against
 * the bank. The DTO carries the definition to the UI so the tile can say so.
 */
export async function windowStats(
  db: Database,
  since: Date,
): Promise<{ revenue: string; orderCount: number; currency: string }> {
  const rows = await db
    .select({
      revenue: sql<string>`COALESCE(SUM(${orders.total}), 0)::numeric(12,2)::text`,
      orderCount: count(),
      currency: sql<string | null>`MIN(${orders.currency})`,
    })
    .from(orders)
    .where(and(gte(orders.placedAt, since), inArray(orders.status, ['paid', 'fulfilled'])));

  const row = rows[0];
  return {
    revenue: row?.revenue ?? '0.00',
    orderCount: row?.orderCount ?? 0,
    currency: row?.currency ?? 'EUR',
  };
}

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

// --- calendar --------------------------------------------------------------

export interface CalendarEntryRow {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  type: 'order-placed' | 'rental-start' | 'rental-end';
  date: string;
  productTitle: string | null;
}

export async function findCalendarEntries(
  db: Database,
  from: string,
  to: string,
): Promise<CalendarEntryRow[]> {
  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = nextDay(to);

  const startDate = sql<string>`${orderItems.configuration}->'rental'->>'startDate'`;
  const endDate = sql<string>`${orderItems.configuration}->'rental'->>'endDate'`;

  /* The rental dates are compared as Postgres `date`s against the validated
     YYYY-MM-DD strings, never as JS Date params: a Date embedded in a raw sql
     fragment is stringified with toString() ("Mon Jul 27 2026 … (Central
     European Summer Time)"), which Postgres rejects — the bug that blanked
     the dashboard calendar. */
  const rentalRows = await db
    .select({
      orderId: orders.id,
      orderNumber: orders.number,
      orderStatus: orders.status,
      productTitle: orderItems.productTitle,
      startDate,
      endDate,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        sql`${orderItems.configuration}->'rental' IS NOT NULL`,
        sql`${startDate} IS NOT NULL`,
        or(
          sql`(${startDate})::date BETWEEN ${from}::date AND ${to}::date`,
          and(
            sql`${endDate} IS NOT NULL`,
            sql`(${endDate})::date BETWEEN ${from}::date AND ${to}::date`,
          ),
        ),
      ),
    );

  const placedRows = await db
    .select({
      id: orders.id,
      number: orders.number,
      status: orders.status,
      placedAt: orders.placedAt,
    })
    .from(orders)
    .where(and(gte(orders.placedAt, fromDate), lt(orders.placedAt, toDate)));

  const entries: CalendarEntryRow[] = [];

  for (const row of placedRows) {
    entries.push({
      orderId: row.id,
      orderNumber: row.number,
      orderStatus: row.status,
      type: 'order-placed',
      date: row.placedAt.toISOString().slice(0, 10),
      productTitle: null,
    });
  }

  for (const row of rentalRows) {
    if (row.startDate) {
      const d = row.startDate.slice(0, 10);
      if (d >= from && d <= to) {
        entries.push({
          orderId: row.orderId,
          orderNumber: row.orderNumber,
          orderStatus: row.orderStatus,
          type: 'rental-start',
          date: d,
          productTitle: row.productTitle,
        });
      }
    }
    if (row.endDate) {
      const d = row.endDate.slice(0, 10);
      if (d >= from && d <= to) {
        entries.push({
          orderId: row.orderId,
          orderNumber: row.orderNumber,
          orderStatus: row.orderStatus,
          type: 'rental-end',
          date: d,
          productTitle: row.productTitle,
        });
      }
    }
  }

  return entries;
}

// --- customer lookup ---------------------------------------------------------

export interface CustomerMatchRow {
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  customerType: string;
  codiceFiscale: string | null;
  partitaIva: string | null;
  shippingAddress: Record<string, unknown> | null;
}

/**
 * Past customers by name, email or phone — one row per email, newest order
 * wins, so a prefilled manual contract starts from what the customer last
 * told us.
 */
export async function findCustomers(db: Database, q: string): Promise<CustomerMatchRow[]> {
  const term = `%${q}%`;
  const rows = await db
    .selectDistinctOn([orders.email], {
      email: orders.email,
      firstName: orders.firstName,
      lastName: orders.lastName,
      phone: orders.phone,
      customerType: orders.customerType,
      codiceFiscale: orders.codiceFiscale,
      partitaIva: orders.partitaIva,
      shippingAddress: orders.shippingAddress,
    })
    .from(orders)
    .where(
      or(
        ilike(orders.email, term),
        ilike(orders.phone, term),
        sql`(${orders.firstName} || ' ' || ${orders.lastName}) ILIKE ${term}`,
      ),
    )
    .orderBy(orders.email, desc(orders.placedAt))
    .limit(10);

  return rows as CustomerMatchRow[];
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
export async function insertContractEvent(db: Database, event: ContractEventData): Promise<void> {
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

// --- carts -----------------------------------------------------------------

function cartWhere(filters: CartListFilters, now: Date) {
  const clauses = [];

  if (filters.q) clauses.push(ilike(carts.token, `%${filters.q}%`));
  // A cart with no `expiresAt` never expires, so it is never abandoned — and
  // `lte(null)` would be NULL, not false, which is why `active` needs the
  // explicit IS NULL arm.
  if (filters.state === 'abandoned') clauses.push(lte(carts.expiresAt, now));
  if (filters.state === 'active') {
    clauses.push(or(sql`${carts.expiresAt} IS NULL`, sql`${carts.expiresAt} > ${now}`));
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

/**
 * Line count and subtotal come back with the row: a cart is only interesting
 * as "how much is sitting in it", and fetching that per row in the service
 * would be one query per cart.
 */
export async function findCarts(
  db: Database,
  filters: CartListFilters,
  now = new Date(),
): Promise<{ rows: CartSummaryRecord[]; total: number }> {
  const where = cartWhere(filters, now);

  // Aggregated over a join for the same reason as `findMany` above — see the
  // note there about drizzle leaving `sql` column references unqualified.
  // `users.id` joins the GROUP BY so Postgres can carry `users.email` through.
  const subtotal = sql<string>`COALESCE(
    SUM(${cartItems.unitPrice} * ${cartItems.quantity}), 0
  )::numeric(12,2)::text`;

  const [rows, totals] = await Promise.all([
    db
      .select({
        cart: carts,
        itemCount: count(cartItems.id),
        subtotal,
        customerEmail: customerAccounts.email,
      })
      .from(carts)
      .leftJoin(customerAccounts, eq(carts.customerAccountId, customerAccounts.id))
      .leftJoin(cartItems, eq(cartItems.cartId, carts.id))
      .where(where)
      .groupBy(carts.id, customerAccounts.id)
      .orderBy(desc(carts.updatedAt))
      .limit(filters.perPage)
      .offset((filters.page - 1) * filters.perPage),
    db.select({ value: count() }).from(carts).where(where),
  ]);

  return {
    rows: rows.map((row) => ({
      ...row.cart,
      itemCount: row.itemCount,
      subtotal: row.subtotal,
      customerEmail: row.customerEmail,
    })),
    total: totals[0]?.value ?? 0,
  };
}

export async function findCartById(db: Database, id: string): Promise<CartAggregate | undefined> {
  const cart = await db.query.carts.findFirst({ where: eq(carts.id, id) });
  if (!cart) return undefined;

  const owner = cart.customerAccountId
    ? await db.query.customerAccounts.findFirst({
        where: eq(customerAccounts.id, cart.customerAccountId),
        columns: { email: true },
      })
    : undefined;

  // Unlike an order line, a cart line holds no snapshot — the title has to be
  // read live, through the product, from the Italian translation (the mandatory
  // one). A left join on the translation keeps the line visible even for a
  // product that somehow has none.
  const rows = await db
    .select({
      item: cartItems,
      title: productTranslations.title,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .leftJoin(
      productTranslations,
      and(
        eq(productTranslations.productId, products.id),
        eq(productTranslations.languageCode, 'it'),
      ),
    )
    .where(eq(cartItems.cartId, id))
    .orderBy(asc(cartItems.createdAt));

  /* The Italian row is mandatory on every product, so the fallback is a
     belt-and-braces default rather than a case anyone should see. */
  const items: CartItemRecord[] = rows.map((row) => ({
    ...row.item,
    productTitle: row.title ?? 'Prodotto',
  }));

  return {
    ...cart,
    items,
    itemCount: items.length,
    subtotal: sumMoney(items.map((item) => multiply(item.unitPrice, item.quantity))),
    customerEmail: owner?.email ?? null,
  };
}
