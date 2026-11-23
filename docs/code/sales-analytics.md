# Sales analytics

`apps/server/src/modules/analytics/`. Tables: `sales_daily`, `product_sales_daily`
(`packages/db/src/schema/analytics.ts`). Endpoint: `GET /api/admin/analytics/sales`
(`order:read`).

## Rollup: what an order is finally worth, on its placed day

Money rules (extension, refund, `net_total`): [order-money.md](order-money.md).
Counted: status `paid` or any later one (`PAID_ONWARD_STATUSES`: everything except `pending` and
`cancelled`) with `net_total > 0`.

```text
order T  paid, placed 2026-03-10 (Rome)     total 100.00 = A rental 60.00 + B sale 40.00 (×2)
  + paid extension, operator typed 50.00    line_amounts A 20.00, B 10.00  (sum 30.00)
  + refund 33.34
net_total = 100 + 50 - 33.34 = 116.66          -> day 2026-03-10, however late the extension/refund came

sales_daily 03-10:  revenue 116.66, extension_revenue 50.00, refunded_total 33.34,
                    items_revenue 100.00, units 3 (an extension sells no unit)

per line:  line_gross  A = 60 + 20 + 20 (the 20.00 no line explains goes on the first rental line) = 100
                       B = 40 + 10                                                                 =  50
           factor = net_total / (total + extension_total) = 116.66 / 150
           A = round(100 × factor, 2) = 77.77      B = round(50 × factor, 2) = 38.89
           Σ = 116.66 = round(goods_net, 2); any rounding remainder goes on the line with the
           largest gross (tie: lowest item id)
```

Pricing mode of a line is `order_items.configuration->>'pricingMode'`, else the
product's `pricing_mode`, else `fixed`. A deleted product keeps its rows,
grouped by the title snapshot (`product_id` null). `MIA-2026-001013` is `pending`
with a paid extension: not counted.

Every rebuild ends with a reconciliation inside the same transaction: (a)
`sales_daily.revenue` = SUM(`net_total`) of counted orders, (b) the day's product
revenue = Σ round(goods_net, 2). A mismatch is logged as
`[analytics] reconciliation mismatch`; the data is kept.

## Refresh

```text
boot            rebuild every day with an order or already in the rollups (deleted orders empty their day)
every 60 s      days of orders with updated_at > lastRunStart - 5 min  -> rebuild
A fully refunded at 10:00     A.updated_at = 10:00 -> 17 Nov rebuilt, net_total 0, A no longer counted
an extension is paid / a partial refund is booked -> the trigger bumps updated_at, same day rebuilt
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
(`2026-02-30`), a span over 3660 days. Totals also carry `extensionRevenue` and `refundedTotal` (both already inside `revenue`). Money is `numeric(12,2)` text, never a float.
`averageOrderValue` = revenue / orderCount to 2 dp, `0.00` with no orders. Top
products show the current Italian title while the product exists. Responses are
cached 60 s per `(from, to, bucket)`.

The report is one SQL statement (`report-sql.ts`: CTEs folded into a single json
column), so a cold request is one database round trip and one pool connection.

Product page views (separate table, same endpoint family): [product-views.md](product-views.md).
