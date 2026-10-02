import type { Database } from '@mia/db';
import { and, count, desc, eq, ilike, isNotNull, or, sql } from '@mia/db';
import { orderItems, orders } from '@mia/db/schema';

import { romeDayRange } from '../../shared/rome-day.ts';
import type { PaymentListFilters, PaymentRow } from './types.ts';

/**
 * The outer order's id, spelled with its table.
 *
 * Drizzle renders a bare `${orders.id}` as `"id"` when the statement reads a
 * single table, and inside the subqueries below Postgres resolves that `"id"` to
 * the order ITEM's id, the nearest table with that column. The type column then
 * compared an item's `order_id` with its own `id` and called every order a sale:
 *
 *   rental order a1…, item b7… (order_id a1…)
 *   bare "id"         oi.order_id = "id"          → a1… = b7… → no  → Vendita ✗
 *   qualified         oi.order_id = "orders"."id" → a1… = a1… → yes → Noleggio ✓
 */
const outerOrderId = sql`${orders}.${sql.identifier(orders.id.name)}`;

const hasRentalLine = sql`EXISTS (
  SELECT 1 FROM ${orderItems} oi
  WHERE oi.order_id = ${outerOrderId}
    AND oi.configuration->>'pricingMode' = 'rental'
)`;

function paymentWhere(filters: Omit<PaymentListFilters, 'page' | 'perPage'>) {
  const clauses = [isNotNull(orders.placedAt)];

  if (filters.q) {
    const term = `%${filters.q}%`;
    clauses.push(or(ilike(orders.number, term), ilike(orders.email, term))!);
  }
  if (filters.paymentStatus) clauses.push(eq(orders.paymentStatus, filters.paymentStatus));
  clauses.push(...romeDayRange(orders.placedAt, filters.from, filters.to));
  /* The filter and the type column share one definition: an order with any
     rented line is a rental, every other order is a sale. */
  if (filters.type === 'rental') clauses.push(hasRentalLine);
  if (filters.type === 'fixed') clauses.push(sql`NOT ${hasRentalLine}`);

  return and(...clauses);
}

const orderTypeSubquery = sql<string>`CASE WHEN ${hasRentalLine} THEN 'rental' ELSE 'fixed' END`;

const selectFields = {
  orderId: orders.id,
  orderNumber: orders.number,
  email: orders.email,
  firstName: orders.firstName,
  lastName: orders.lastName,
  total: orders.total,
  currency: orders.currency,
  orderStatus: orders.status,
  paymentStatus: orders.paymentStatus,
  placedAt: orders.placedAt,
  orderType: orderTypeSubquery,
};

export async function findMany(
  db: Database,
  filters: PaymentListFilters,
): Promise<{ rows: PaymentRow[]; total: number }> {
  const where = paymentWhere(filters);

  const [rows, totals] = await Promise.all([
    db
      .select(selectFields)
      .from(orders)
      .where(where)
      .orderBy(desc(orders.placedAt), desc(orders.id))
      .limit(filters.perPage)
      .offset((filters.page - 1) * filters.perPage),
    db.select({ value: count() }).from(orders).where(where),
  ]);

  return { rows: rows as PaymentRow[], total: totals[0]?.value ?? 0 };
}

export async function stats(
  db: Database,
  filters: PaymentListFilters,
): Promise<{ totalRevenue: string; pendingCount: number; paidCount: number; currency: string }> {
  const where = paymentWhere(filters);

  const rows = await db
    .select({
      totalRevenue: sql<string>`COALESCE(
        SUM(CASE WHEN ${orders.paymentStatus} = 'paid' THEN ${orders.total} ELSE 0 END),
        0
      )::numeric(12,2)::text`,
      pendingCount: sql<number>`COUNT(*) FILTER (WHERE ${orders.paymentStatus} = 'unpaid')`,
      paidCount: sql<number>`COUNT(*) FILTER (WHERE ${orders.paymentStatus} = 'paid')`,
      currency: sql<string | null>`MIN(${orders.currency})`,
    })
    .from(orders)
    .where(where);

  const row = rows[0];
  return {
    totalRevenue: row?.totalRevenue ?? '0.00',
    pendingCount: row?.pendingCount ?? 0,
    paidCount: row?.paidCount ?? 0,
    currency: row?.currency ?? 'EUR',
  };
}

/** Rows per round trip while exporting; the CSV itself has no cap. */
const EXPORT_BATCH = 1000;

/**
 * Every payment the filter matches, newest first.
 *
 * Read in batches with a keyset on (placed_at, id) rather than one LIMIT, which
 * used to stop at 10,000 rows without saying so. `id` breaks ties, so two orders
 * placed in the same instant can neither repeat nor go missing between batches.
 */
export async function findAllForExport(
  db: Database,
  filters: Omit<PaymentListFilters, 'page' | 'perPage'>,
): Promise<PaymentRow[]> {
  const where = paymentWhere(filters);
  const all: PaymentRow[] = [];
  let after: PaymentRow | undefined;

  for (;;) {
    const batch = (await db
      .select(selectFields)
      .from(orders)
      .where(and(where, after ? olderThan(after) : undefined))
      .orderBy(desc(orders.placedAt), desc(orders.id))
      .limit(EXPORT_BATCH)) as PaymentRow[];

    all.push(...batch);
    if (batch.length < EXPORT_BATCH) return all;
    after = batch[batch.length - 1];
  }
}

function olderThan(row: PaymentRow) {
  return sql`(${orders.placedAt}, ${orders.id}) < (${row.placedAt}::timestamptz, ${row.orderId}::uuid)`;
}
