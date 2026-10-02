import type { Database } from '@mia/db';
import { and, asc, count, desc, eq, ilike, ne, or, sql } from '@mia/db';
import { contracts, orderItems, orders } from '@mia/db/schema';

import {
  isRentalLine,
  rentalEndDate,
  rentalOrderClosed,
  rentalOrderOpen,
  rentalStartDate,
  romeTodaySql,
} from '../../shared/rental-calendar.ts';
import type { RentalListFilters, RentalRow } from './types.ts';

const rentalDuration = sql<number>`(${orderItems.configuration}->'rental'->>'duration')::int`;
const rentalUnit = sql<string>`${orderItems.configuration}->'rental'->>'unit'`;
const rentalPackageName = sql<string>`${orderItems.configuration}->'rentalPackage'->>'name'`;

/** "Today" is the Rome calendar date, the same one the reminder sweep counts from. */
function rentalWhere(filters: RentalListFilters) {
  const clauses = [isRentalLine];

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
    clauses.push(sql`(${rentalEndDate})::date >= ${romeTodaySql}`, rentalOrderOpen());
  } else if (filters.status === 'overdue') {
    clauses.push(sql`(${rentalEndDate})::date < ${romeTodaySql}`, rentalOrderOpen());
  } else if (filters.status === 'completed') {
    clauses.push(rentalOrderClosed());
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
};

/**
 * The newest NON-VOIDED contract per row, id and status from ONE lookup.
 *
 * Matches findLatestActiveByOrderId and the orders list — a voided renewal must
 * fall back to the contract it replaced, not mask it, or this row's actions would
 * target dead paper. It used to be two correlated subqueries, one per column, so
 * a page of 30 rentals looked the same contract up 60 times:
 *
 *   before   SELECT …, (SELECT c.id …), (SELECT c.status …) FROM order_items …
 *   after    … LEFT JOIN LATERAL (SELECT id, status … LIMIT 1) latest_contract ON true
 */
function latestContract(db: Database) {
  return db
    .select({ id: contracts.id, status: contracts.status })
    .from(contracts)
    .where(and(eq(contracts.orderId, orders.id), ne(contracts.status, 'voided')))
    .orderBy(desc(contracts.createdAt))
    .limit(1)
    .as('latest_contract');
}

function selectRentals(db: Database) {
  const contract = latestContract(db);
  return db
    .select({
      ...selectFields,
      contractId: sql<string | null>`${contract.id}`,
      contractStatus: sql<string | null>`${contract.status}`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .leftJoinLateral(contract, sql`true`);
}

export async function findMany(
  db: Database,
  filters: RentalListFilters,
): Promise<{ rows: RentalRow[]; total: number }> {
  const where = rentalWhere(filters);

  const [rows, totals] = await Promise.all([
    selectRentals(db)
      .where(where)
      .orderBy(asc(sql`(${rentalEndDate})::date`), asc(orderItems.id))
      .limit(filters.perPage)
      .offset((filters.page - 1) * filters.perPage),
    db
      .select({ value: count() })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(rentalWhere(filters)),
  ]);

  return { rows: rows as RentalRow[], total: totals[0]?.value ?? 0 };
}

export async function findByOrderId(db: Database, orderId: string): Promise<RentalRow | undefined> {
  const rows = await selectRentals(db)
    .where(and(isRentalLine, eq(orders.id, orderId)))
    .limit(1);

  return (rows[0] as RentalRow) ?? undefined;
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
