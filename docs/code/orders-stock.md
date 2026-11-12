# Order stock

`apps/server/src/modules/orders/stock.ts`, called from
`transition-repo.applyTransition` inside the status transaction.

## Rental: bed, stock 3, order for 1

```
1. Customer places the order        pending          → stock 3
2. Agent marks it paid              pending → paid   → stock 2   (-1)
3. Equipment is with the customer   paid             → stock 2
4. Agent clicks "Confirm return"    paid → fulfilled → stock 3   (+1)
```

## Sale: chair, stock 3, order for 2

```
1. Agent marks it paid              pending → paid      → stock 1   (-2)
2. Goods delivered                  paid → fulfilled    → stock 1   (sold, never back)
```

## Unwound, and refused

```
paid → cancelled / refunded         → quantity back on the shelf
pending → cancelled                 → nothing (nothing was taken)
fulfilled → refunded                → nothing (rental already back; a sold item's
                                       return is a hand edit of stock)
pending → paid, stock 0             → 409 "Letto does not have 1 in stock…",
                                       order stays pending
```

A line is a rental when `configuration.pricingMode === 'rental'`; everything else
is a sale. Lines whose product was deleted (`productId` null) move nothing. Stock
still knows nothing about future dates: two paid rentals for next month each take
a unit today.
