/** DB queries for orders and carts. Plain records out — no auth, no DTOs. */

import type { Database } from '@mia/db';
import { and, asc, count, desc, eq, gte, ilike, inArray, lt, lte, or, sql } from '@mia/db';
import {
  cartItems,
  carts,
  orderItems,
  orders,
  orderStatusEvents,
  products,
  productSkus,
  productTranslations,
  users,
} from '@mia/db/schema';

import { multiply, sumMoney } from './mapper.ts';
import type {
  CartAggregate,
  CartItemRecord,
  CartListFilters,
  CartSummaryRecord,
  OrderAggregate,
  OrderListFilters,
  OrderStatusEventRecord,
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
  if (filters.from) clauses.push(gte(orders.placedAt, new Date(`${filters.from}T00:00:00.000Z`)));
  // Exclusive upper bound on the *next* day, so `to` includes the whole day it
  // names — `<= 2026-08-07` would otherwise drop everything after midnight.
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
): Promise<{ rows: OrderSummaryRecord[]; total: number }> {
  const where = orderWhere(filters);

  // LEFT JOIN + GROUP BY rather than a correlated subquery in `sql`: drizzle
  // renders a bare `${table.column}` *unqualified* when the outer statement has
  // only one table, so `WHERE order_id = id` silently resolved both sides
  // inside order_items and counted zero every time. A real join makes drizzle
  // qualify. Grouping by the primary key lets Postgres carry the other order
  // columns through on functional dependency, and LIMIT still counts orders.
  const [rows, totals] = await Promise.all([
    db
      .select({ order: orders, itemCount: count(orderItems.id) })
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
    rows: rows.map((row) => ({ ...row.order, itemCount: row.itemCount })),
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
      actorId: users.id,
      actorEmail: users.email,
      actorName: users.fullName,
    })
    .from(orderStatusEvents)
    .leftJoin(users, eq(orderStatusEvents.actorUserId, users.id))
    .where(eq(orderStatusEvents.orderId, orderId))
    // Oldest first: a timeline is read downwards. `id` breaks ties so two
    // events written in the same transaction keep a stable order.
    .orderBy(asc(orderStatusEvents.createdAt), asc(orderStatusEvents.id));

  return rows.map((row) => ({
    ...row.event,
    actor:
      row.actorId && row.actorEmail
        ? { id: row.actorId, email: row.actorEmail, fullName: row.actorName }
        : null,
  }));
}

export interface OrderPatch {
  notes?: string | null;
  shippingAddress?: Record<string, unknown> | null;
  billingAddress?: Record<string, unknown> | null;
  status?: OrderSummaryRecord['status'];
  paymentStatus?: OrderSummaryRecord['paymentStatus'];
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
  actorUserId: string | null;
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
        userEmail: users.email,
      })
      .from(carts)
      .leftJoin(users, eq(carts.userId, users.id))
      .leftJoin(cartItems, eq(cartItems.cartId, carts.id))
      .where(where)
      .groupBy(carts.id, users.id)
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
      userEmail: row.userEmail,
    })),
    total: totals[0]?.value ?? 0,
  };
}

export async function findCartById(db: Database, id: string): Promise<CartAggregate | undefined> {
  const cart = await db.query.carts.findFirst({ where: eq(carts.id, id) });
  if (!cart) return undefined;

  const owner = cart.userId
    ? await db.query.users.findFirst({
        where: eq(users.id, cart.userId),
        columns: { email: true },
      })
    : undefined;

  // Unlike an order line, a cart line holds no snapshot — the title has to be
  // read live, through the SKU, from the Italian translation (the mandatory
  // one). A left join on the translation keeps the line visible even for a
  // product that somehow has none.
  const rows = await db
    .select({
      item: cartItems,
      sku: productSkus.sku,
      productId: products.id,
      title: productTranslations.title,
      baseSku: products.baseSku,
    })
    .from(cartItems)
    .innerJoin(productSkus, eq(cartItems.skuId, productSkus.id))
    .innerJoin(products, eq(productSkus.productId, products.id))
    .leftJoin(
      productTranslations,
      and(
        eq(productTranslations.productId, products.id),
        eq(productTranslations.languageCode, 'it'),
      ),
    )
    .where(eq(cartItems.cartId, id))
    .orderBy(asc(cartItems.createdAt));

  const items: CartItemRecord[] = rows.map((row) => ({
    ...row.item,
    productTitle: row.title ?? row.baseSku,
    productId: row.productId,
    sku: row.sku,
  }));

  return {
    ...cart,
    items,
    itemCount: items.length,
    subtotal: sumMoney(items.map((item) => multiply(item.unitPrice, item.quantity))),
    userEmail: owner?.email ?? null,
  };
}
