/**
 * Read-only queries behind the order lists, the dashboard tiles, the customer
 * lookup and the calendar. Plain records out — no auth, no DTOs. The query shape
 * of the two order lists is walked through in `docs/code/order-lists.md`.
 */

import type { Database, SQL } from '@mia/db';
import { and, count, desc, eq, gte, ilike, inArray, lt, or, sql } from '@mia/db';
import { orderItems, orders } from '@mia/db/schema';

import { romeDayRange } from '../../shared/rome-day.ts';
import type { AdminOrderSummaryRecord, OrderListFilters } from './types.ts';

function orderWhere(filters: OrderListFilters) {
  const clauses: (SQL | undefined)[] = [];

  if (filters.q) {
    const term = `%${filters.q}%`;
    clauses.push(or(ilike(orders.number, term), ilike(orders.email, term)));
  }
  if (filters.status) clauses.push(eq(orders.status, filters.status));
  if (filters.paymentStatus) clauses.push(eq(orders.paymentStatus, filters.paymentStatus));
  if (filters.type) {
    clauses.push(
      /* A column inside a WHERE renders qualified even in the single-table page
         subquery (checked with toSQL), so `${orders.id}` binds to the outer
         order here — the unqualified-column pitfall is the select list's. */
      sql`EXISTS (
        SELECT 1 FROM ${orderItems} oi
        WHERE oi.order_id = ${orders.id}
          AND oi.configuration->>'pricingMode' = ${filters.type}
      )`,
    );
  }
  clauses.push(...romeDayRange(orders.placedAt, filters.from, filters.to));

  return clauses.length > 0 ? and(...clauses) : undefined;
}

/**
 * One page of order ids, newest first, as a subquery named `page`. The list
 * queries join their per-row figures onto this, so the join and the grouping
 * only ever run over `perPage` orders, never over every order the filter matches.
 * `id` breaks ties so two orders placed in the same instant keep one order
 * across pages.
 */
export function orderPage(db: Database, where: SQL | undefined, page: number, perPage: number) {
  return db
    .select({ id: orders.id })
    .from(orders)
    .where(where)
    .orderBy(desc(orders.placedAt), desc(orders.id))
    .limit(perPage)
    .offset((page - 1) * perPage)
    .as('page');
}

export async function findMany(
  db: Database,
  filters: OrderListFilters,
): Promise<{ rows: AdminOrderSummaryRecord[]; total: number }> {
  const where = orderWhere(filters);
  const page = orderPage(db, where, filters.page, filters.perPage);

  /* Joined rather than correlated: with three tables in the outer statement
     drizzle qualifies every column, and grouping by the primary key lets
     Postgres carry the other order columns through on functional dependency. */
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
      .from(page)
      .innerJoin(orders, eq(orders.id, page.id))
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .groupBy(orders.id)
      .orderBy(desc(orders.placedAt), desc(orders.id)),
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

// --- calendar --------------------------------------------------------------

export interface CalendarEntryRow {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  type: 'order-placed' | 'rental-start' | 'rental-end';
  date: string;
  productTitle: string | null;
}

function nextDay(date: string): Date {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value;
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
