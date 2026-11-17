import { sql } from '@mia/db';

import { COUNTED, ORDER_DAY } from './rollup-sql.ts';

type Runner = { execute: (query: ReturnType<typeof sql>) => PromiseLike<Iterable<unknown>> };

/**
 * Checks a rebuild against the orders themselves, inside the rebuild's
 * transaction, for the rebuilt days only:
 *   (a) sales_daily.revenue          == SUM(net_total) of counted orders
 *   (b) SUM(product_sales_daily.revenue) == SUM(round((items + extension_total)
 *   net_total / (total + extension_total), 2)) per order, from the base tables
 *   alone, so it ignores the rebuild's per-line attribution
 * A mismatch is logged loudly and the data is kept; it never throws, so the
 * charts stay up while someone looks.
 */
export async function reconcile(tx: Runner, dayList: ReturnType<typeof sql>): Promise<void> {
  const revenue = [
    ...(await tx.execute(sql`
      SELECT COALESCE(s.day, o.day)::text AS day, s.revenue::text AS rolled, o.expected::text AS expected
      FROM sales_daily s
      FULL JOIN (SELECT ${ORDER_DAY} AS day, sum(o.net_total) AS expected FROM orders o
                 WHERE ${COUNTED} AND ${ORDER_DAY} IN ${dayList} GROUP BY 1) o ON o.day = s.day
      WHERE COALESCE(s.day, o.day) IN ${dayList}
        AND s.revenue IS DISTINCT FROM o.expected`)),
  ];
  const products = [
    ...(await tx.execute(sql`
      SELECT COALESCE(p.day, g.day)::text AS day, p.rolled::text AS rolled, g.expected::text AS expected
      FROM (SELECT day, sum(revenue) AS rolled FROM product_sales_daily
            WHERE day IN ${dayList} GROUP BY day) p
      FULL JOIN (
        SELECT ${ORDER_DAY} AS day,
               sum(round((COALESCE((SELECT sum(oi.total) FROM order_items oi WHERE oi.order_id = o.id), 0)
                          + o.extension_total)
                         * COALESCE(o.net_total / NULLIF(o.total + o.extension_total, 0), 1), 2)) AS expected
        FROM orders o WHERE ${COUNTED} AND ${ORDER_DAY} IN ${dayList} GROUP BY 1
      ) g ON g.day = p.day
      WHERE p.rolled IS DISTINCT FROM g.expected`)),
  ];
  if (revenue.length === 0 && products.length === 0) return;
  console.error('[analytics] reconciliation mismatch', { revenue, products });
}
