/** Reads for the stock history. The ledger is written only by the trigger on `products`. */

import type { Database } from '@mia/db';
import { and, count, desc, eq, sql } from '@mia/db';
import { adminUsers, orders, productTranslations, products, stockMovements } from '@mia/db/schema';
import { DEFAULT_LANGUAGE } from '@mia/validators';

import { romeDayRange } from '../../shared/rome-day.ts';
import type { DayRange } from '../../shared/day-range.ts';

export const PER_PAGE = 25;

export async function findProduct(db: Database, id: string) {
  const [row] = await db
    .select({
      id: products.id,
      stock: products.stock,
      title: sql<string | null>`(
        SELECT t.title FROM ${productTranslations} t
        WHERE t.product_id = ${products.id}
        ORDER BY (t.language_code = ${DEFAULT_LANGUAGE}) DESC, t.language_code LIMIT 1)`,
    })
    .from(products)
    .where(eq(products.id, id));
  return row;
}

/**
 * Closing stock per Rome day in ONE query: every day of the range, joined to the
 * last movement made before that day ended (id order IS the order things happened).
 */
export async function findSeries(db: Database, productId: string, range: DayRange) {
  const rows = await db.execute<{ day: string; stock: number | null }>(sql`
    SELECT to_char(g.d, 'YYYY-MM-DD') AS day, m.stock_after AS stock
    FROM generate_series(${range.from}::date, ${range.to}::date, interval '1 day') AS g(d)
    LEFT JOIN LATERAL (
      SELECT sm.stock_after FROM stock_movements sm
      WHERE sm.product_id = ${productId}
        AND sm.created_at < ((g.d::date + 1)::timestamp AT TIME ZONE 'Europe/Rome')
      ORDER BY sm.id DESC LIMIT 1
    ) m ON true
    ORDER BY g.d`);
  return rows.map((row) => ({ day: row.day, stock: row.stock }));
}

/** One page of movements in range, newest first, plus the range's total. */
export async function findMovements(
  db: Database,
  productId: string,
  range: DayRange,
  page: number,
) {
  const where = and(
    eq(stockMovements.productId, productId),
    ...romeDayRange(stockMovements.createdAt, range.from, range.to),
  );
  const [rows, totals] = await Promise.all([
    db
      .select({
        id: stockMovements.id,
        at: stockMovements.createdAt,
        reason: stockMovements.reason,
        delta: stockMovements.delta,
        stockAfter: stockMovements.stockAfter,
        note: stockMovements.note,
        orderId: stockMovements.orderId,
        orderNumber: orders.number,
        actorEmail: adminUsers.email,
        actorFullName: adminUsers.fullName,
      })
      .from(stockMovements)
      .leftJoin(orders, eq(orders.id, stockMovements.orderId))
      .leftJoin(adminUsers, eq(adminUsers.id, stockMovements.actorAdminUserId))
      .where(where)
      .orderBy(desc(stockMovements.id))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    db.select({ value: count() }).from(stockMovements).where(where),
  ]);
  return { rows, total: totals[0]?.value ?? 0 };
}

/** Products whose stock is not the sum of their movements. Empty means the ledger is sound. */
export async function findLedgerMismatches(db: Database) {
  return db.execute<{ id: string; stock: number; ledger: number }>(sql`
    SELECT p.id, p.stock, COALESCE(SUM(m.delta), 0)::int AS ledger
    FROM products p LEFT JOIN stock_movements m ON m.product_id = p.id
    GROUP BY p.id, p.stock
    HAVING p.stock <> COALESCE(SUM(m.delta), 0)`);
}
