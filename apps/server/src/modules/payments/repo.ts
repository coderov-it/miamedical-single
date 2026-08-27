import type { Database } from '@mia/db';
import { and, count, desc, eq, ilike, isNotNull, or, sql } from '@mia/db';
import { orderItems, orders } from '@mia/db/schema';

import type { PaymentListFilters, PaymentRow } from './types.ts';

function paymentWhere(filters: PaymentListFilters) {
  const clauses = [isNotNull(orders.placedAt)];

  if (filters.q) {
    const term = `%${filters.q}%`;
    clauses.push(or(ilike(orders.number, term), ilike(orders.email, term))!);
  }
  if (filters.paymentStatus) clauses.push(eq(orders.paymentStatus, filters.paymentStatus));
  if (filters.from) clauses.push(sql`${orders.placedAt}::date >= ${filters.from}::date`);
  if (filters.to) clauses.push(sql`${orders.placedAt}::date <= ${filters.to}::date`);
  if (filters.type) {
    clauses.push(
      sql`EXISTS (
        SELECT 1 FROM ${orderItems} oi
        WHERE oi.order_id = ${orders.id}
          AND oi.configuration->>'pricingMode' = ${filters.type}
      )`,
    );
  }

  return and(...clauses);
}

const orderTypeSubquery = sql<string>`CASE WHEN EXISTS (
  SELECT 1 FROM ${orderItems} oi
  WHERE oi.order_id = ${orders.id}
    AND oi.configuration->>'pricingMode' = 'rental'
) THEN 'rental' ELSE 'fixed' END`;

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
      .orderBy(desc(orders.placedAt))
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

export async function findAllForExport(
  db: Database,
  filters: Omit<PaymentListFilters, 'page' | 'perPage'>,
): Promise<PaymentRow[]> {
  const where = paymentWhere({ ...filters, page: 1, perPage: 1 });
  const rows = await db
    .select(selectFields)
    .from(orders)
    .where(where)
    .orderBy(desc(orders.placedAt))
    .limit(10000);

  return rows as PaymentRow[];
}
