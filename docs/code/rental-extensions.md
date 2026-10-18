# Rental extensions

`apps/server/src/modules/rental-extensions` extends a running rental without
replacing its order. The order keeps its number, its start date and its first
contract. Each extension is one row in `rental_extensions` with its own span,
price, payment and contract.

## Renewed from the account (normal case)

Order `MIA-2026-001042`: wheelchair ×1, 7-day package, Oct 1 → Oct 8, contract
`C-1000` signed. Every "Prolunga il noleggio" opens the same full-screen modal
(`apps/website/src/components/account/renewal/`): the order's rental card, the
extend-offer notification, and the offer email's `?renew=1` link.

```text
 1. Oct 6, sweep (20% left)        → "Want to extend?" in the feed, as push and by email
 2. Modal step 1 "Durata"          → picks 7 days; summary beside it: Oct 8 → Oct 15, €70
 3. Modal step 2 "Contratto"       → POST …/contract-preview { days: 7 } → BOZZA, nothing written
                                     reads it, signs the box, ticks consent
 4. Modal step 3 "Conferma"        → POST /api/customer/rental-extensions/MIA-2026-001042
                                       { days: 7, contractSignature }
                                     one transaction: C-1001 born signed + extension
                                     renew_pending Oct 8 → Oct 15, €70, contract_id → C-1001
                                     timeline: Contract — → signed, Extension — → Awaiting payment
                                     operators: "Extension requested"; customer: signed-copy email
 5. Operator: Record payment       → active at once; every rental line now ends Oct 15
                                     (start stays Oct 1, duration becomes 14)
                                     customer: "Rental renewed … to Oct 15"
 6. Oct 13, sweep                  → offered again: the span restarts at the extension
```

When online payment exists, step 3's button becomes the payment and step 5
happens on the provider's confirmation instead of the operator's click.

## Raised by an operator

Same order, the customer phoned instead. Nothing is signed yet, so the contract
goes out by email after the money arrives.

```text
 1. Operator: Extend → 7 days      → renew_pending   Oct 8 → Oct 15, €70
 2. Operator: Record payment       → awaiting_signature, paid_at set, method "bank_transfer"
                                     renewal contract C-1001 issued, customer gets the signing email
 3. Customer signs C-1001          → active; every rental line now ends Oct 15
```

The order page then shows `C-1000` (Oct 1–8) and `C-1001` (Oct 8–15) in the
Contract card, and the extension in the Extensions card and on the timeline.

## Late and closed cases

```text
 Late:    rental ended Oct 8, equipment still out, order not fulfilled
          → Extend still works, and the span starts Oct 8, so no days go unbilled
 Closed:  operator "Finish rental" → order fulfilled
          → no Extend; the customer sees "Order again", which links to each rented product
 Unpaid:  customer withdraws, or operator cancels  → cancelled, end date untouched;
          a contract signed in the modal is voided with it
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
- **No renewal while an earlier contract is unsigned.** Neither the modal nor a
  payment issues a renewal contract until the earlier one is signed.
- **The end date moves once it is both paid and signed.** Whichever comes last
  runs `activate.applyExtension` in its own transaction: the email signature
  (`contracts/signing.sign`) for an operator-raised extension, the payment
  (`service.recordPayment`) for an account renewal. A failure anywhere rolls the
  whole step back.
- **A signed renewal holds its price.** Payment on it must match the signed
  amount; a different deal means cancelling it and raising a new one.
- **Issuing links in the same transaction.** The renewal contract and
  `rental_extensions.contract_id` commit together; a second concurrent issue finds
  the link taken and rolls back.
- **Every status write is guarded on the state it expects** — payment from
  `renew_pending`, cancel from the status it read, activation by signature from
  `awaiting_signature`. An operator cancelling while the customer signs gets a
  409, not a cancelled extension behind a signed contract. Cancel voids the
  contract and cancels the extension in one transaction.
