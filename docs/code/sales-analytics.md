# Sales analytics

`apps/server/src/modules/analytics/`. Tables: `sales_daily`, `product_sales_daily`
(`packages/db/src/schema/analytics.ts`). Endpoint: `GET /api/admin/analytics/sales`
(`order:read`).

## Rollup: one order, one day

```text
order A  paid       placed 2026-11-16 23:30 UTC   total 35.00 (shipping 5.00)   1 × rollator
order B  fulfilled  placed 2026-11-17 08:00 UTC   total 30.00                   1 × SLIM
order C  pending    placed 2026-11-17 09:00 UTC   not counted

Rome day:  A → 2026-11-17 (23:30 UTC is 00:30 in Rome)   B → 2026-11-17

sales_daily  2026-11-17 : order_count 2, revenue 65.00 (SUM orders.total),
                          items_revenue 60.00 (SUM order_items.total), units 2
product_sales_daily      : (11-17, rollator, rental, 1 order, 1 unit, 30.00)
                           (11-17, SLIM,     rental, 1 order, 1 unit, 30.00)
```

Pricing mode of a line is `order_items.configuration->>'pricingMode'`, else the
product's `pricing_mode`, else `fixed` (deleted product, no snapshot). A deleted
product keeps its rows, grouped by the title snapshot (`product_id` null).

## Refresh

```text
boot            rebuild every day with an order or already in the rollups (deleted orders empty their day)
every 60 s      days of orders with updated_at > lastRunStart - 5 min  -> rebuild
A paid -> refunded at 10:00   A.updated_at = 10:00 -> 17 Nov rebuilt, A no longer counted
```

`rebuildDays` runs in one transaction behind `pg_advisory_xact_lock`, so several
pm2 workers rebuilding at once take turns. It deletes the days from both tables
and inserts them again. The 5 minute overlap covers app-clock skew; `updated_at`
is set by the app. After a rebuild that touched days the response cache is cleared.

## Endpoint: range, previous period, buckets

```text
?from=2026-11-01&to=2026-11-30&bucket=week
range     2026-11-01 .. 2026-11-30
previous  2026-10-02 .. 2026-10-31      same 30 days, right before from
series    2026-W44 (start 2026-10-26) .. 2026-W49 (start 2026-11-30)
          weeks start Monday; only days inside the range are summed,
          so W44 holds just 1 Nov and W49 just 30 Nov, and empty buckets are zero-filled

no query  to = today in Rome, from = to - 29 days, bucket = day
2027-01-01 -> key 2026-W53 (ISO week-year)
```

Rejected with 422 `validation_failed`: `from` after `to`, an impossible date
(`2026-02-30`), a span over 3660 days. Money is `numeric(12,2)` text, never a float.
`averageOrderValue` = revenue / orderCount to 2 dp, `0.00` with no orders. Top
products show the current Italian title while the product exists. Responses are
cached 60 s per `(from, to, bucket)`.

The report is one SQL statement (`report-sql.ts`: CTEs folded into a single json
column), so a cold request is one database round trip and one pool connection.
