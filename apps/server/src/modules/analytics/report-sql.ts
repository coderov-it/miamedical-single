import type { Database } from '@mia/db';
import { sql } from '@mia/db';
import { SOURCE_LANGUAGE } from '@mia/validators';

import type { DayRange } from '../../shared/day-range.ts';
import type { Bucket } from './range.ts';
import type { ModeSplit, SeriesPoint, TopProduct, Totals } from './repo.ts';

/**
 * The whole sales report as ONE statement, so the page costs one database round
 * trip instead of six (the dev DB is ~300 ms away). Each block of `repo.ts` is a
 * CTE here, folded into a single json column; the shapes are identical.
 */
export type ReportRows = {
  totals: Totals;
  previousTotals: Totals;
  series: SeriesPoint[];
  byRevenue: TopProduct[];
  byUnits: TopProduct[];
  modeSplit: ModeSplit[];
};

export const KEY_FORMAT: Record<Bucket, string> = {
  day: 'YYYY-MM-DD',
  week: 'IYYY-"W"IW',
  month: 'YYYY-MM',
  year: 'YYYY',
};

function totalsBlock(r: DayRange) {
  return sql`(SELECT json_build_object(
      'revenue', COALESCE(sum(revenue), 0)::numeric(12,2)::text,
      'itemsRevenue', COALESCE(sum(items_revenue), 0)::numeric(12,2)::text,
      'extensionRevenue', COALESCE(sum(extension_revenue), 0)::numeric(12,2)::text,
      'refundedTotal', COALESCE(sum(refunded_total), 0)::numeric(12,2)::text,
      'orderCount', COALESCE(sum(order_count), 0)::int,
      'units', COALESCE(sum(units), 0)::int,
      'averageOrderValue', COALESCE(round(sum(revenue) / NULLIF(sum(order_count), 0), 2), 0)::numeric(12,2)::text)
    FROM sales_daily WHERE day BETWEEN ${r.from}::date AND ${r.to}::date)`;
}

export async function fetchReport(
  db: Database,
  range: DayRange,
  previous: DayRange,
  bucket: Bucket,
): Promise<ReportRows> {
  const unit = sql.raw(`'${bucket}'`);
  const fmt = sql.raw(`'${KEY_FORMAT[bucket]}'`);
  const step = sql.raw(`'1 ${bucket}'`);
  const rows = await db.execute<{ report: ReportRows | string }>(sql`
    WITH series AS (
      SELECT b.start,
             to_char(b.start, ${fmt}) AS key,
             COALESCE(sum(s.revenue), 0)::numeric(12,2)::text AS revenue,
             COALESCE(sum(s.order_count), 0)::int AS "orderCount",
             COALESCE(sum(s.units), 0)::int AS units
      FROM generate_series(date_trunc(${unit}, ${range.from}::date::timestamp),
                           ${range.to}::date::timestamp, ${step}::interval) AS b(start)
      LEFT JOIN sales_daily s
        ON date_trunc(${unit}, s.day::timestamp) = b.start
       AND s.day BETWEEN ${range.from}::date AND ${range.to}::date
      GROUP BY b.start
    ),
    products AS (
      SELECT s.product_id AS "productId",
             COALESCE(max(pt.title), min(s.product_title)) AS title,
             s.pricing_mode AS "pricingMode",
             sum(s.revenue) AS revenue_raw, sum(s.units) AS units_raw,
             sum(s.revenue)::numeric(12,2)::text AS revenue,
             sum(s.units)::int AS units,
             sum(s.order_count)::int AS "orderCount"
      FROM product_sales_daily s
      LEFT JOIN product_translations pt
        ON pt.product_id = s.product_id AND pt.language_code = ${SOURCE_LANGUAGE}
      WHERE s.day BETWEEN ${range.from}::date AND ${range.to}::date
      GROUP BY s.product_id, CASE WHEN s.product_id IS NULL THEN s.product_title END, s.pricing_mode
    ),
    by_revenue AS (SELECT * FROM products ORDER BY revenue_raw DESC, title LIMIT 10),
    by_units AS (SELECT * FROM products ORDER BY units_raw DESC, title LIMIT 10),
    modes AS (
      SELECT m.mode AS "pricingMode", m.pos,
             COALESCE(sum(s.revenue), 0)::numeric(12,2)::text AS revenue,
             COALESCE(sum(s.units), 0)::int AS units,
             COALESCE(sum(s.order_count), 0)::int AS "orderCount"
      FROM (VALUES ('rental', 1), ('fixed', 2)) AS m(mode, pos)
      LEFT JOIN product_sales_daily s
        ON s.pricing_mode::text = m.mode AND s.day BETWEEN ${range.from}::date AND ${range.to}::date
      GROUP BY m.mode, m.pos
    )
    SELECT json_build_object(
      'totals', ${totalsBlock(range)},
      'previousTotals', ${totalsBlock(previous)},
      'series', COALESCE((SELECT json_agg(json_build_object('key', key, 'start', start::date::text,
          'revenue', revenue, 'orderCount', "orderCount", 'units', units) ORDER BY start) FROM series), '[]'::json),
      'byRevenue', COALESCE((SELECT json_agg(json_build_object('productId', "productId", 'title', title,
          'pricingMode', "pricingMode", 'revenue', revenue, 'units', units, 'orderCount', "orderCount")
          ORDER BY revenue_raw DESC, title) FROM by_revenue), '[]'::json),
      'byUnits', COALESCE((SELECT json_agg(json_build_object('productId', "productId", 'title', title,
          'pricingMode', "pricingMode", 'revenue', revenue, 'units', units, 'orderCount', "orderCount")
          ORDER BY units_raw DESC, title) FROM by_units), '[]'::json),
      'modeSplit', (SELECT json_agg(json_build_object('pricingMode', "pricingMode", 'revenue', revenue,
          'units', units, 'orderCount', "orderCount") ORDER BY pos) FROM modes)
    ) AS report`);
  const report = rows[0]!.report;
  return typeof report === 'string' ? (JSON.parse(report) as ReportRows) : report;
}
