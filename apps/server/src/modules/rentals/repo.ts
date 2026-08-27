import type { Database } from '@mia/db';
import { and, asc, count, eq, ilike, or, sql } from '@mia/db';
import { orderItems, orders } from '@mia/db/schema';
import { addMoney } from '@mia/pricing';

import { sumMoney } from '../orders/mapper.ts';
import type { RentalListFilters, RentalRow } from './types.ts';

const rentalStartDate = sql<string>`${orderItems.configuration}->'rental'->>'startDate'`;
const rentalEndDate = sql<string>`${orderItems.configuration}->'rental'->>'endDate'`;
const rentalDuration = sql<number>`(${orderItems.configuration}->'rental'->>'duration')::int`;
const rentalUnit = sql<string>`${orderItems.configuration}->'rental'->>'unit'`;
const rentalPackageName = sql<string>`${orderItems.configuration}->'rentalPackage'->>'name'`;
const pricingMode = sql<string>`${orderItems.configuration}->>'pricingMode'`;

function rentalWhere(filters: RentalListFilters, today: string) {
  const clauses = [sql`${pricingMode} = 'rental'`];

  if (filters.q) {
    const term = `%${filters.q}%`;
    clauses.push(
      or(
        ilike(orders.number, term),
        ilike(orders.email, term),
        sql`(${orders.firstName} || ' ' || ${orders.lastName}) ILIKE ${term}`,
      )!,
    );
  }

  if (filters.status === 'active') {
    clauses.push(
      sql`(${rentalEndDate})::date >= ${today}::date`,
      sql`${orders.status} NOT IN ('fulfilled', 'cancelled')`,
    );
  } else if (filters.status === 'overdue') {
    clauses.push(
      sql`(${rentalEndDate})::date < ${today}::date`,
      sql`${orders.status} NOT IN ('fulfilled', 'cancelled')`,
    );
  } else if (filters.status === 'completed') {
    clauses.push(sql`${orders.status} IN ('fulfilled', 'cancelled')`);
  }

  return and(...clauses);
}

const selectFields = {
  orderId: orders.id,
  orderNumber: orders.number,
  orderStatus: orders.status,
  paymentStatus: orders.paymentStatus,
  email: orders.email,
  firstName: orders.firstName,
  lastName: orders.lastName,
  phone: orders.phone,
  productTitle: orderItems.productTitle,
  orderItemId: orderItems.id,
  total: orderItems.total,
  currency: orders.currency,
  rentalStartDate,
  rentalEndDate,
  rentalDuration,
  rentalUnit,
  rentalPackageName,
  /* The newest NON-VOIDED contract, matching findLatestActiveByOrderId and the
     orders list — a voided renewal must fall back to the contract it replaced,
     not mask it, or this row's actions would target dead paper. */
  contractId: sql<string | null>`(
    SELECT c.id FROM contracts c WHERE c.order_id = ${orders.id}
    AND c.status <> 'voided'
    ORDER BY c.created_at DESC LIMIT 1
  )`,
  contractStatus: sql<string | null>`(
    SELECT c.status FROM contracts c WHERE c.order_id = ${orders.id}
    AND c.status <> 'voided'
    ORDER BY c.created_at DESC LIMIT 1
  )`,
};

export async function findMany(
  db: Database,
  filters: RentalListFilters,
): Promise<{ rows: RentalRow[]; total: number }> {
  const today = new Date().toISOString().slice(0, 10);
  const where = rentalWhere(filters, today);

  const [rows, totals] = await Promise.all([
    db
      .select(selectFields)
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(where)
      .orderBy(asc(sql`(${rentalEndDate})::date`))
      .limit(filters.perPage)
      .offset((filters.page - 1) * filters.perPage),
    db
      .select({ value: count() })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(rentalWhere(filters, today)),
  ]);

  return { rows: rows as RentalRow[], total: totals[0]?.value ?? 0 };
}

export async function findByOrderId(
  db: Database,
  orderId: string,
): Promise<RentalRow | undefined> {
  const rows = await db
    .select(selectFields)
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(sql`${pricingMode} = 'rental'`, eq(orders.id, orderId)))
    .limit(1);

  return (rows[0] as RentalRow) ?? undefined;
}

/**
 * Sets the agreed price of the order's single rental line and re-derives the
 * order's own money from its lines, so the renewal contract and the order books
 * state the same figure. Returns `ambiguous` — and writes nothing — when the
 * order has more than one rental line: one amount cannot be split across lines
 * without inventing a rule nobody agreed to.
 */
export async function repriceSingleRentalLine(
  db: Database,
  orderId: string,
  total: string,
): Promise<'ok' | 'ambiguous'> {
  return db.transaction(async (tx) => {
    const items = await tx.query.orderItems.findMany({
      where: eq(orderItems.orderId, orderId),
    });
    const rentals = items.filter(
      (item) => (item.configuration as Record<string, unknown> | null)?.pricingMode === 'rental',
    );
    const line = rentals[0];
    if (!line || rentals.length !== 1) return 'ambiguous';

    await tx.update(orderItems).set({ total }).where(eq(orderItems.id, line.id));

    const subtotal = sumMoney(items.map((item) => (item.id === line.id ? total : item.total)));
    const order = await tx.query.orders.findFirst({
      where: eq(orders.id, orderId),
      columns: { shippingTotal: true },
    });
    await tx
      .update(orders)
      .set({ subtotal, total: addMoney(subtotal, order?.shippingTotal ?? '0.00') })
      .where(eq(orders.id, orderId));

    return 'ok';
  });
}

/**
 * Rewrites the rented period on every rental line of the order — a renewal is
 * agreed for the order as a whole, exactly like the contract that certifies it.
 * Read-modify-write per line because the period lives inside the configuration
 * snapshot; the transaction keeps a multi-line order from renewing halfway.
 */
export async function updateRentalPeriods(
  db: Database,
  orderId: string,
  from: string,
  to: string,
  durationDays: number,
): Promise<void> {
  await db.transaction(async (tx) => {
    const items = await tx.query.orderItems.findMany({
      where: eq(orderItems.orderId, orderId),
    });
    for (const item of items) {
      const config = item.configuration as Record<string, unknown> | null;
      if (config?.pricingMode !== 'rental') continue;
      const rental = {
        ...((config.rental as Record<string, unknown> | undefined) ?? {}),
        startDate: from,
        endDate: to,
        duration: durationDays,
        unit: 'day',
      };
      await tx
        .update(orderItems)
        .set({ configuration: { ...config, rental } })
        .where(eq(orderItems.id, item.id));
    }
  });
}
