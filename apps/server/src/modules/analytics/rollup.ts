import type { Database } from '@mia/db';
import { sql } from '@mia/db';

/**
 * Rebuilds the two rollup tables for whole Europe/Rome days. Counted orders are
 * `paid` and `fulfilled`. Walkthrough: docs/code/sales-analytics.md.
 */

/** Serialises rebuilds across pm2 workers; any fixed number nobody else takes. */
const ROLLUP_LOCK = 7_301_001n;

/** The Rome day an order belongs to, as a SQL fragment over `orders o`. */
const ORDER_DAY = sql.raw(`(o.placed_at AT TIME ZONE 'Europe/Rome')::date`);

/** Lines' pricing mode: the order's own snapshot, else the product, else fixed. */
const LINE_MODE = sql.raw(
  `COALESCE(oi.configuration->>'pricingMode', p.pricing_mode::text, 'fixed')::pricing_mode`,
);

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

/** One transaction: lock, delete the days from both tables, insert them again. */
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
        (day, order_count, revenue, items_revenue, shipping_total, discount_total, units)
      SELECT d.day, count(*)::int, sum(d.total), sum(d.items_total),
             sum(d.shipping_total), sum(d.discount_total), sum(d.units)::int
      FROM (
        SELECT ${ORDER_DAY} AS day, o.total, o.shipping_total, o.discount_total,
               COALESCE((SELECT sum(oi.total) FROM order_items oi WHERE oi.order_id = o.id), 0) AS items_total,
               COALESCE((SELECT sum(oi.quantity) FROM order_items oi WHERE oi.order_id = o.id), 0) AS units
        FROM orders o
        WHERE o.status IN ('paid', 'fulfilled') AND ${ORDER_DAY} IN ${dayList}
      ) d
      GROUP BY d.day`);

    await tx.execute(sql`
      INSERT INTO product_sales_daily
        (day, product_id, product_title, pricing_mode, order_count, units, revenue)
      SELECT ${ORDER_DAY}, oi.product_id, min(oi.product_title), ${LINE_MODE},
             count(DISTINCT o.id)::int, sum(oi.quantity)::int, sum(oi.total)
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.status IN ('paid', 'fulfilled') AND ${ORDER_DAY} IN ${dayList}
      GROUP BY ${ORDER_DAY}, oi.product_id,
               CASE WHEN oi.product_id IS NULL THEN oi.product_title END, ${LINE_MODE}`);
  });
}
