import { sql } from '@mia/db';

import { PAID_ONWARD_STATUSES } from '../orders/status.ts';

/**
 * SQL fragments shared by the rebuild and its reconciliation. Money rules and a
 * worked example: docs/code/sales-analytics.md and docs/code/order-money.md.
 */

/** The Rome day an order belongs to, over `orders o`. */
export const ORDER_DAY = sql.raw(`(o.placed_at AT TIME ZONE 'Europe/Rome')::date`);

/** Counted orders: money that stayed. `net_total` is total + extensions − refunds. */
export const COUNTED = sql.raw(
  `o.status IN (${PAID_ONWARD_STATUSES.map((status) => `'${status}'`).join(', ')}) AND o.net_total > 0`,
);

/** A line's pricing mode: the order's own snapshot, else the product, else fixed. */
export const LINE_MODE = sql.raw(
  `COALESCE(oi.configuration->>'pricingMode', p.pricing_mode::text, 'fixed')::pricing_mode`,
);

/**
 * `analytics_order_lines`: one row per order line of every counted order on the
 * given days, with the line's final share of the order's goods net.
 *
 *   line_gross = order_items.total + its paid-extension amounts
 *                (+ the order's extension amount no line amount explains, on the
 *                 order's first rental line, else its first line, by item id)
 *   goods_net  = round(Σ line_gross × net_total ÷ (total + extension_total), 2)
 *   line_net   = round(line_gross × factor, 2), rounding remainder on the line
 *                with the largest gross (tie: lowest id), so Σ lines = goods_net
 *
 * A temp table, because the reconciliation reads it again after the inserts.
 */
export function orderLinesStatement(dayList: ReturnType<typeof sql>) {
  return sql`
    CREATE TEMP TABLE analytics_order_lines ON COMMIT DROP AS
    WITH counted AS (
      SELECT o.id, ${ORDER_DAY} AS day, o.total, o.extension_total, o.net_total
      FROM orders o WHERE ${COUNTED} AND ${ORDER_DAY} IN ${dayList}
    ),
    lines AS (
      SELECT oi.id, c.id AS order_id, c.day, oi.product_id, oi.product_title, oi.quantity,
             oi.total AS item_total, ${LINE_MODE} AS mode,
             COALESCE(oi.configuration->>'pricingMode' = 'rental', p.pricing_mode = 'rental', false) AS is_rental,
             c.total AS order_total, c.extension_total, c.net_total
      FROM counted c
      JOIN order_items oi ON oi.order_id = c.id
      LEFT JOIN products p ON p.id = oi.product_id
    ),
    ext AS (
      SELECT e.order_id, kv.key::uuid AS item_id, (kv.value->>'total')::numeric AS amount
      FROM rental_extensions e
      JOIN counted c ON c.id = e.order_id
      CROSS JOIN LATERAL jsonb_each(e.line_amounts) kv
      WHERE e.paid_at IS NOT NULL
    ),
    ext_by_line AS (
      SELECT l.id, COALESCE(sum(x.amount), 0) AS amount
      FROM lines l LEFT JOIN ext x ON x.order_id = l.order_id AND x.item_id = l.id
      GROUP BY l.id
    ),
    unexplained AS (
      SELECT l.order_id, (max(l.extension_total) - sum(b.amount)) AS diff
      FROM lines l JOIN ext_by_line b ON b.id = l.id GROUP BY l.order_id
    ),
    carrier AS (
      SELECT DISTINCT ON (order_id) order_id, id
      FROM lines ORDER BY order_id, is_rental DESC, id
    ),
    gross AS (
      SELECT l.*, l.item_total + b.amount + CASE WHEN k.id = l.id THEN u.diff ELSE 0 END AS line_gross
      FROM lines l
      JOIN ext_by_line b ON b.id = l.id
      JOIN unexplained u ON u.order_id = l.order_id
      JOIN carrier k ON k.order_id = l.order_id
    ),
    scaled AS (
      SELECT g.*, sum(g.line_gross) OVER w AS goods_gross,
             COALESCE(g.net_total / NULLIF(g.order_total + g.extension_total, 0), 1) AS factor,
             row_number() OVER (PARTITION BY g.order_id ORDER BY g.line_gross DESC, g.id) AS rank
      FROM gross g WINDOW w AS (PARTITION BY g.order_id)
    ),
    rounded AS (
      SELECT s.*, round(s.line_gross * s.factor, 2) AS line_rounded,
             round(s.goods_gross * s.factor, 2) AS goods_net
      FROM scaled s
    )
    SELECT r.id, r.order_id, r.day, r.product_id, r.product_title, r.quantity, r.mode,
           r.goods_net,
           r.line_rounded + CASE WHEN r.rank = 1
             THEN r.goods_net - sum(r.line_rounded) OVER (PARTITION BY r.order_id) ELSE 0 END
             AS line_net
    FROM rounded r`;
}
