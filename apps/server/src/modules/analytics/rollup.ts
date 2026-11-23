import type { Database } from '@mia/db';
import { sql } from '@mia/db';

import { reconcile } from './reconcile.ts';
import { COUNTED, ORDER_DAY, orderLinesStatement } from './rollup-sql.ts';

/**
 * Rebuilds the two rollup tables for whole Europe/Rome days. Counted orders are
 * `paid` and every later status with money left (`net_total > 0`), on the day
 * they were placed. Walkthrough: docs/code/sales-analytics.md.
 */

/** Serialises rebuilds across pm2 workers; any fixed number nobody else takes. */
const ROLLUP_LOCK = 7_301_001n;

/** Every day with any order, plus every day the rollups already hold (orders since deleted). */
export async function allOrderDays(db: Database): Promise<string[]> {
  const rows = await db.execute<{ day: string }>(
    sql`SELECT ${ORDER_DAY}::text AS day FROM orders o
      UNION SELECT day::text FROM sales_daily
      UNION SELECT day::text FROM product_sales_daily`,
  );
  return rows.map((r) => r.day);
}

/** Days of every order touched since `since`, whatever its status is now. */
export async function daysChangedSince(db: Database, since: Date): Promise<string[]> {
  const rows = await db.execute<{ day: string }>(
    sql`SELECT DISTINCT ${ORDER_DAY}::text AS day FROM orders o WHERE o.updated_at > ${since.toISOString()}::timestamptz`,
  );
  return rows.map((r) => r.day);
}

/** One transaction: lock, delete the days from both tables, insert them again, reconcile. */
export async function rebuildDays(db: Database, days: string[]): Promise<void> {
  if (days.length === 0) return;
  const dayList = sql`(${sql.join(
    days.map((d) => sql`${d}::date`),
    sql`, `,
  )})`;
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${ROLLUP_LOCK})`);
    await tx.execute(sql`DELETE FROM sales_daily WHERE day IN ${dayList}`);
    await tx.execute(sql`DELETE FROM product_sales_daily WHERE day IN ${dayList}`);

    await tx.execute(sql`
      INSERT INTO sales_daily
        (day, order_count, revenue, extension_revenue, refunded_total, items_revenue,
         shipping_total, discount_total, units)
      SELECT d.day, count(*)::int, sum(d.net_total), sum(d.extension_total), sum(d.refunded_total),
             sum(d.items_total), sum(d.shipping_total), sum(d.discount_total), sum(d.units)::int
      FROM (
        SELECT ${ORDER_DAY} AS day, o.net_total, o.extension_total, o.refunded_total,
               o.shipping_total, o.discount_total,
               COALESCE((SELECT sum(oi.total) FROM order_items oi WHERE oi.order_id = o.id), 0) AS items_total,
               COALESCE((SELECT sum(oi.quantity) FROM order_items oi WHERE oi.order_id = o.id), 0) AS units
        FROM orders o
        WHERE ${COUNTED} AND ${ORDER_DAY} IN ${dayList}
      ) d
      GROUP BY d.day`);

    /* Dropped on commit; the explicit drop covers a rebuild nested in a caller's transaction. */
    await tx.execute(sql`SET LOCAL client_min_messages = warning`);
    await tx.execute(sql`DROP TABLE IF EXISTS analytics_order_lines`);
    await tx.execute(orderLinesStatement(dayList));
    await tx.execute(sql`
      INSERT INTO product_sales_daily
        (day, product_id, product_title, pricing_mode, order_count, units, revenue)
      SELECT l.day, l.product_id, min(l.product_title), l.mode,
             count(DISTINCT l.order_id)::int, sum(l.quantity)::int, sum(l.line_net)
      FROM analytics_order_lines l
      GROUP BY l.day, l.product_id,
               CASE WHEN l.product_id IS NULL THEN l.product_title END, l.mode`);

    await reconcile(tx, dayList);
  });
}
