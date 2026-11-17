import type { Database } from '@mia/db';
import { sql } from '@mia/db';
import { SOURCE_LANGUAGE } from '@mia/validators';

import type { DayRange } from '../../shared/day-range.ts';
import type { Bucket } from './range.ts';
import { KEY_FORMAT } from './report-sql.ts';

/**
 * The product-views report as ONE statement (one round trip, like the sales
 * report): totals for the range and the previous one, a zero-filled series, and
 * the 10 most viewed products with their orders from the sales rollup.
 */
export type ViewsRows = {
  totals: { views: number };
  previousTotals: { views: number };
  series: Array<{ key: string; start: string; views: number }>;
  topViewed: Array<{
    productId: string;
    title: string;
    pricingMode: 'fixed' | 'rental';
    views: number;
    orders: number;
    conversionRate: number | null;
  }>;
};

function viewsTotal(r: DayRange) {
  return sql`(SELECT COALESCE(sum(views), 0)::int FROM product_views_daily
              WHERE day BETWEEN ${r.from}::date AND ${r.to}::date)`;
}

export async function fetchViews(
  db: Database,
  range: DayRange,
  previous: DayRange,
  bucket: Bucket,
): Promise<ViewsRows> {
  const unit = sql.raw(`'${bucket}'`);
  const fmt = sql.raw(`'${KEY_FORMAT[bucket]}'`);
  const step = sql.raw(`'1 ${bucket}'`);
  const rows = await db.execute<{ report: ViewsRows | string }>(sql`
    WITH series AS (
      SELECT b.start, to_char(b.start, ${fmt}) AS key, COALESCE(sum(v.views), 0)::int AS views
      FROM generate_series(date_trunc(${unit}, ${range.from}::date::timestamp),
                           ${range.to}::date::timestamp, ${step}::interval) AS b(start)
      LEFT JOIN product_views_daily v
        ON date_trunc(${unit}, v.day::timestamp) = b.start
       AND v.day BETWEEN ${range.from}::date AND ${range.to}::date
      GROUP BY b.start
    ),
    viewed AS (
      SELECT v.product_id, sum(v.views)::int AS views
      FROM product_views_daily v
      WHERE v.day BETWEEN ${range.from}::date AND ${range.to}::date
      GROUP BY v.product_id
    ),
    top AS (
      SELECT p.id AS "productId",
             COALESCE(pt.title,
               (SELECT t.title FROM product_translations t
                 WHERE t.product_id = p.id ORDER BY t.language_code LIMIT 1), '') AS title,
             p.pricing_mode::text AS "pricingMode", w.views,
             COALESCE((SELECT sum(s.order_count) FROM product_sales_daily s
                        WHERE s.product_id = p.id
                          AND s.day BETWEEN ${range.from}::date AND ${range.to}::date), 0)::int AS orders
      FROM viewed w
      JOIN products p ON p.id = w.product_id
      LEFT JOIN product_translations pt
        ON pt.product_id = p.id AND pt.language_code = ${SOURCE_LANGUAGE}
      ORDER BY w.views DESC, 2 LIMIT 10
    )
    SELECT json_build_object(
      'totals', json_build_object('views', ${viewsTotal(range)}),
      'previousTotals', json_build_object('views', ${viewsTotal(previous)}),
      'series', COALESCE((SELECT json_agg(json_build_object('key', key, 'start', start::date::text,
          'views', views) ORDER BY start) FROM series), '[]'::json),
      'topViewed', COALESCE((SELECT json_agg(json_build_object('productId', "productId", 'title', title,
          'pricingMode', "pricingMode", 'views', views, 'orders', orders,
          'conversionRate', CASE WHEN views = 0 THEN NULL
                                 ELSE round(orders::numeric / views, 4)::float8 END)
          ORDER BY views DESC, title) FROM top), '[]'::json)
    ) AS report`);
  const report = rows[0]!.report;
  return typeof report === 'string' ? (JSON.parse(report) as ViewsRows) : report;
}
