# Stock history

Every change of `products.stock` is one row in `stock_movements`, written by a
trigger on `products` (migration 0023) — never by app code. A stock change with
no row cannot happen. The app only says WHY, with `setStockContext(tx, …)`
(`shared/stock-context.ts`) right before each stock write.

## One product's life

```
action                                  delta  stock_after  reason              order  actor
1. migration / product created           +10      10        opening_balance /    -      operator
                                                              product_created
2. customer places order MIA-…-001042 (3)  -3       7        order_placed        001042  -
3. order paid (stock already taken)         -        7        (no row, no change)
4. rental order marked fulfilled (back)    +3      10        rental_returned     001042  operator
5. operator edits stock 10 -> 8, "Inventario"  -2    8        manual_adjustment    -     operator, note
```

Invariant: for each product `stock = SUM(delta)`, and each `stock_after` is the
running sum. `checkLedger` runs at boot and logs `[stock-history] ledger mismatch`;
it never fixes data.

Reasons by writer: placement `order_placed`; order moves `order_paid` /
`order_cancelled` / `order_refunded` / `rental_returned` (`stockReason` in
`orders/stock.ts`); product create `product_created`; a product edit that really
changes stock `manual_adjustment` (+ optional `stockNote`).

## Consumed context (the fallback)

The trigger reads the four `mia.stock_*` settings and CONSUMES them (resets them),
so one context covers exactly one stock write:

```
1. setStockContext(tx, manual_adjustment, "first")
2. UPDATE products SET stock = 9      -> row: manual_adjustment, note "first"
3. UPDATE products SET stock = 8      -> row: unknown   (nothing was said, nothing is reused)
```

A path that forgets the context still records the movement, as `unknown`; a bad
reason or id degrades to `unknown` / dropped ids with the problem in `note`. That is
why `applyStockMoves` sets the context before EACH product's UPDATE.

Read: `GET /api/admin/products/:id/stock-history?from&to&page` (`modules/stock-history`).
Tests: `stock.integration.test.ts` (`MIA_DB_TESTS=1`).
