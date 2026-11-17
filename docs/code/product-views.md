# Product views

`apps/server/src/modules/product-views/` (count and flush),
`apps/server/src/modules/analytics/views-*.ts` (report). Table
`product_views_daily(product_id, day, views)`. Counts views, not people: no IP,
cookie or user id is stored anywhere.

## One view, end to end

```text
1. Customer opens /prodotto/sedia   storefront sends  POST /api/products/<id>/view   (beacon, no body)
2. Server: id is a uuid, UA is Firefox, under 600/h  → buffer["2026-11-17|<id>"] = 1     → 204 at once
   (two more opens by other visitors)                → buffer["2026-11-17|<id>"] = 3
3. 60 s tick: Map swapped out, ONE statement
   INSERT … ON CONFLICT (product_id, day) DO UPDATE SET views = views + EXCLUDED.views
                                                     → product_views_daily (<id>, 2026-11-17) = 3
4. Second tick, 2 more views                         → same row = 5 (added, never overwritten)
5. GET /api/admin/analytics/views?from=2026-11-17&to=2026-11-17
   → totals.views 5, series [{ key "2026-11-17", views 5 }],
     topViewed [{ title "Sedia…", views 5, orders 1, conversionRate 0.2 }]   (orders ÷ views, 4 dp)
```

The request never touches the database; the Rome day is taken when the request
arrives. A view is visible in the report after the next tick (`flushedAt`).

## Fallbacks

```text
bot / crawler / curl / no User-Agent   → 204, not counted      (bot.ts, tested on real UA strings)
id is not a uuid                       → 204, not counted
id is a uuid but not a product         → counted in memory, dropped by the JOIN at flush
over 600 requests/hour from one IP     → 429 (the browser ignores the answer)
20 000 distinct day|product keys       → new keys dropped, "[product-views] buffer full, dropped N" once per flush
database down at flush                 → the swapped counts are merged back (under the cap), error logged, retried next tick
SIGINT / SIGTERM                       → one last flush, given up after 3 s so shutdown cannot hang
crash / kill -9                        → at most the last minute of views is lost
several server processes               → each flushes its own sums; `views + EXCLUDED.views` adds them
```

Report contract and the sales side: [sales-analytics.md](sales-analytics.md).
