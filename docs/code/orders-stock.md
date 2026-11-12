# Order stock

`apps/server/src/modules/orders/stock.ts`. Placement calls it inside the order's
insert transaction (`repo.insertOrder`); every status move calls it inside
`transition-repo.applyTransition`.

## Rental: bed, stock 3, order for 1

```text
1. Customer places the order        —  → pending      → stock 2   (-1, held for payment)
2. Customer pays online             pending → paid    → stock 2
3. Equipment is with the customer   paid              → stock 2
4. Agent clicks "Confirm return"    paid → fulfilled  → stock 3   (+1)
```

## Sale: chair, stock 3, order for 2

```text
1. Customer places the order        —  → pending      → stock 1   (-2)
2. Goods delivered                  paid → fulfilled  → stock 1   (sold, never back)
```

## Unwound, and refused

```text
pending → cancelled (expired, or rejected by an operator)
                                    → quantity back on the shelf
paid → cancelled / refunded         → quantity back on the shelf
fulfilled → refunded                → nothing (rental already back; a sold item's
                                       return is a hand edit of stock)
placing with stock 0                → 409 out_of_stock "Letto is no longer available",
                                       no order is written
```

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
