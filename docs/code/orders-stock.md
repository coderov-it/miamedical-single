# Order stock

`apps/server/src/modules/orders/stock.ts`. Placement calls it inside the order's
insert transaction (`repo.insertOrder`); every status move calls it inside
`transition-repo.applyTransition`.

## Direction table

```text
placement                         —  → pending                   -1 (held for payment)
to paid                           pending → paid                 taken ? 0 : -1
pending → cancelled                                              taken ? +1 : 0
from paid or delivery_missed      → cancelled / refunded         +1
everything else                   delivery, pickup, received,    0
                                  fulfilled, fulfilled → refunded
```

`stockDirection(from, to, taken)` no longer looks at the line mode: a returned rental unit is
put back by its own return inspection (`modules/return-inspections`), not by a status move.

## Rental: bed, stock 3, order for 1

```text
1. Customer places the order        —  → pending            → stock 2   (-1, held for payment)
2. Customer pays online             pending → paid          → stock 2
3. Delivered, then picked up        … → received            → stock 2   (nothing moves)
4. Inspector: "Stock back"          unit decided            → stock 3   (+1, rental_returned)
   or "Needs attention"             → attention queue       → stock 2
   queue item "Repaired"                                    → stock 3   (+1, unit_repaired)
   queue item "Written off"                                 → stock 2   (stays out)
5. Last unit decided                received → fulfilled    → stock unchanged
```

## Sale: chair, stock 3, order for 2

```text
1. Customer places the order        —  → pending            → stock 1   (-2)
2. Delivered, then fulfilled        delivered → fulfilled   → stock 1   (sold, never back; a
                                                                 goods return is out of scope)
```

## Unwound, and refused

```text
pending → cancelled (expired, or rejected by an operator)
                                    → quantity back on the shelf
paid / delivery_missed → cancelled / refunded
                                    → quantity back on the shelf
fulfilled → refunded                → nothing (the units were inspected or sold)
placing with stock 0                → 409 out_of_stock "Letto is no longer available",
                                       no order is written
```

A manual order (`manual-orders.md`) takes its units at creation like a checkout order,
with the creating agent as the history's actor. It has no `payment_due_at`, so the
unpaid sweep never returns them: they come back only when the order is cancelled.

## Orders placed before this rule

`orders.stock_taken` says whether a pending order holds its units. Placement
sets it. Orders placed when stock was only taken at payment have it false, so:

```text
old order, stock_taken false: pending → paid       → stock -1, stock_taken true
                              pending → cancelled  → nothing (nothing was taken)
```

A line is a rental when `configuration.pricingMode === 'rental'`; everything else
is a sale. Lines whose product was deleted (`productId` null) move nothing. Stock
still knows nothing about future dates: two rentals for next month each take a
unit today.

Every stock change is also a row in the stock history, with its reason: see [stock-history.md](./stock-history.md).
