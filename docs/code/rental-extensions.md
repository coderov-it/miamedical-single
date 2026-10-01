# Rental extensions

`apps/server/src/modules/rental-extensions` extends a running rental without
replacing its order. The order keeps its number, its start date and its first
contract. Each extension is one row in `rental_extensions` with its own span,
price, payment and contract.

## Normal case

Order `MIA-2026-001042`: wheelchair ×1, 7-day package, Oct 1 → Oct 8, contract
`C-1000` signed.

```text
 1. Oct 6, sweep (20% left)        → customer gets "Want to extend?" in the feed, as push and by email
 2. Customer: Extend → 7 days      → rental_extensions row  renew_pending   Oct 8 → Oct 15, €70
                                     timeline: Extension — → Awaiting payment
                                     operators: "Extension requested"
 3. Operator: Record payment       → awaiting_signature, paid_at set, method "bank_transfer"
                                     renewal contract C-1001 issued for Oct 8 → Oct 15 at €70
                                     customer gets the signing email
 4. Customer signs C-1001          → active; every rental line now ends Oct 15
                                     (start stays Oct 1, duration becomes 14)
                                     customer: "Rental renewed … to Oct 15"
 5. Oct 13, sweep                  → offered again: the span restarts at the extension
```

The order page then shows `C-1000` (Oct 1–8) and `C-1001` (Oct 8–15) in the
Contract card, and the extension in the Extensions card and on the timeline.

## Late and closed cases

```text
 Late:    rental ended Oct 8, equipment still out, order not fulfilled
          → Extend still works, and the span starts Oct 8, so no days go unbilled
 Closed:  operator "Finish rental" → order fulfilled
          → no Extend; the customer sees "Order again", which links to each rented product
 Unpaid:  customer withdraws, or operator cancels  → cancelled, end date untouched
 Voided:  operator voids C-1001 → extension stays awaiting_signature
          → "Reissue contract" on the order page sends a fresh one
```

## What is offered and what it costs

A length is offered when every rental line's product sells a **day** package of
that duration. The price is each line's package price × its quantity, from the
**current** price list. It is frozen per line in `line_amounts` when the request
is made, so a price change before payment does not change the contract.

```text
 wheelchair ×1  packages 7g €70, 30g €200
 cushion    ×2  packages 7g €10, 14g €18
 → offered: 7 days = 70 + 2×10 = €90
```

An operator can extend by any length at an agreed amount. That amount goes on
the first line of the contract table. An amount entered at payment that differs
from the quote replaces the quote the same way. Add-ons are not re-billed.
Hourly rentals cannot be extended online.

## Gates

- **One open extension per order.** The partial unique index
  `rental_extensions_one_open_key` enforces it.
- **No payment while an earlier contract is unsigned.** A renewal contract
  cannot be issued until the earlier contract is signed.
- **The end date moves on signature, not on payment.** `activate.ts` runs inside
  `contracts/service.sign` and is the only writer of the extended period.
