# Order money

`orders.net_total` is what an order is finally worth. The database keeps it; no
application code writes `extension_total` or `refunded_total`.

```
net_total = total + extension_total - refunded_total
            (generated)  (paid extensions)  (sum of order_refunds)
```

## Normal case and an extension

```
1. place order               total 100.00                    -> net 100.00
2. operator marks ext. 30.00 extension_total 30.00           -> net 130.00
   paid (or the webhook does)   (trigger recomputes it)
```

## Partial refund, then full refund

```
POST /api/admin/orders/:id/refunds  { amount: "40.00", reason: "Apparecchio difettoso" }
3. lock order, 40.00 <= net 130.00 -> insert row              -> net  90.00
   paymentStatus paid -> partially_refunded
   timeline: "Refund 40,00 € — Apparecchio difettoso"
4. { amount: "90.00" }  (exactly what is left)                -> net   0.00
   paymentStatus partially_refunded -> refunded
```

Moving the ORDER to `refunded` does step 4 itself: one refund row for the
remaining net, the operator's note as reason, in the same transaction.

## Paid extension, then cancelled

```
5. extension 30.00 paid, then cancelled   extension_total stays 30.00  -> net 130.00
   (the money was received; cancelling does not give it back)
6. { amount: "30.00", rentalExtensionId: <that extension> }   -> net 100.00
```

## Refused over-refund

```
net 100.00, { amount: "100.01" }
-> 422  fields.amount = "At most 100.00 can still be refunded."   (nothing written)
```

If a concurrent write still trips `orders_money_check`, the answer is 409
"This order changed a moment ago. Reload it."

Manual payment moves into `partially_refunded` / `refunded` are refused with 422:
an amount-less refund is data we cannot recover.

## Why it cannot drift

- `orders_sync_money(order_id)` locks the order row, then RECOMPUTES both totals
  from the source rows. Idempotent: a repeated or missed call cannot drift.
- A second transaction touching the same order waits on that lock, then sums
  with a fresh snapshot that includes the first one's commit.
- `order_refunds` is append-only (trigger); a mistake is corrected by a new
  note, not an edit. Legacy `partially_refunded` orders with no amount show
  `refundAmountMissing: true` until an operator prices them.

Code: `modules/order-refunds/` (`decision.ts` pure rules, `write.ts` the one
write path), tests in `money.integration.test.ts` (`MIA_DB_TESTS=1`).
