# Order lists

The admin list (`GET /api/admin/orders`, `findMany` in
`apps/server/src/modules/orders/list-repo.ts`) and the customer's own list
(`listOrders` in `apps/server/src/modules/customer-account/repo.ts`) both pick the
page first and only then join the lines onto it.

```
   filter: type=rental, from=2026-10-01, to=2026-10-01, page 2, perPage 20

1. page of ids                 orderPage(db, where, 2, 20)
     WHERE filters, Rome days        placed_at >= 2026-09-30 22:00 UTC
                                     placed_at <  2026-10-01 22:00 UTC
     ORDER BY placed_at DESC, id DESC
     LIMIT 20 OFFSET 20                         → 20 ids, subquery "page"
2. per-row figures             page ⋈ orders ⋈ order_items, GROUP BY orders.id
     count(order_items.id)                      → itemCount
     bool_or(pricingMode = 'rental')            → hasRental     (admin only)
     newest non-voided contract                 → contractStatus (admin only)
3. total                       count(*) FROM orders WHERE same filters
```

Step 2 runs over the 20 page rows, not over every matching order. The `id`
tiebreak keeps two orders placed in the same instant in one order across pages.

The day filter is `romeDayRange` (`apps/server/src/shared/rome-day.ts`): an order
placed at 00:30 on 2 October in Rome (22:30 UTC on 1 October) belongs to 2
October, not 1 October.

## Stage filter

The admin queue's filter bar filters by stage, not by status: `?stage=` takes
`pending | paid | delivery | return | fulfilled | closed`. The map is `ORDER_STAGES`
in `apps/server/src/modules/orders/status.ts` (every status in exactly one stage,
tested) and is mirrored for display in `apps/admin/src/lib/orders/status.ts`.

```
   stage=delivery  →  status IN (out_for_delivery, delivery_missed, delivered)
   stage=closed    →  status IN (cancelled, refunded)
   status=paid&stage=delivery  →  both apply (here: no rows)
```

`?status=` still works, so old links keep filtering by the exact status; the bar
then highlights the stage that contains it.
