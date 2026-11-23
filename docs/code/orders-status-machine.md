# Order status machine

`apps/server/src/modules/orders/status.ts` is the single authority on what may
follow what. Nothing else decides.

---

## The two axes

An order carries **two** independent statuses, and conflating them was the first
thing to get right.

```
status:        pending ─▶ paid ─▶ out_for_delivery ─▶ delivered ─┬─ sale ───▶ fulfilled
                  │        │        ▲     │                      └─ rental ─▶ out_for_pickup
                  ▼        ▼        │     ▼                                   │     ▲  │
               cancelled   │   delivery_missed ─▶ cancelled                     │     │  ▼
                           ▼                                         pickup_missed   received
                  cancelled / refunded                                                  │ (automatic,
                                                                                        ▼  last inspection)
                                                                                    fulfilled ─▶ refunded

paymentStatus: unpaid → authorized → paid → partially_refunded → refunded
                  ↓          ↓
                failed ──────┘  (recoverable: back to unpaid/authorized/paid)
```

They move independently because reality does: a bank transfer can clear days
after the goods went out, and a partial refund does not un-fulfil an order.

`cancelled` and `refunded` are **exits**, not stages — nothing continues out of
them, which is what makes them safe for the UI to treat as terminal.

## Flow-dependent edges and the automatic close

`nextOrderStatuses(from, flow)` and `canMoveOrder(from, to, flow)` take the order's flow:
`orderFlow(items)` is `rental` when any line has `pricingMode: 'rental'`, else `sale`. Only
`delivered` branches (sale → `fulfilled`, rental → `out_for_pickup`). The forward step is
first in every array; the admin makes the first entry that is not an exit or a `*_missed`
the primary button.

`received → fulfilled` is **not** a manual move: `nextOrderStatuses('received', …)` is empty and
a hand request is a 409 ("This order closes by itself once every returned unit is decided.").
The inspection that decides the last returned unit makes the move, in its own transaction
(`modules/return-inspections`).

A move into `delivery_missed` or `pickup_missed` needs a note: 422 `validation_failed`,
`fields.note` "Write what happened.". A move to `delivered` may carry `deliveredOn`
(default Rome today, not in the future, not before the order was placed): it shifts each
rental line's dates in the same transaction (`orders/delivery-dates.ts`).

`PAID_ONWARD_STATUSES` is every status except `pending` and `cancelled`: "money was taken".
The orders list stats and the analytics rollup read it.

## The contract gate on `pending → paid`

The machine's edges say what _may_ follow what; one edge additionally carries a
precondition. `service.moveStatus` refuses `paid` on an order with rental lines
until the order's newest non-voided contract is `signed`
(`assertContractSigned`). Money is only taken once the customer has signed, so
nothing later on the happy path is reachable unsigned either — which is why the
gate sits on `paid` alone and `fulfilled` needs no second check.

Sales orders owe no contract and pass untouched. The **payment** machine is
deliberately not gated: a transfer arriving is a fact regardless of paperwork.
The refusal is a 409 naming the contract, shown verbatim by the admin.

## What is deliberately _not_ modelled

Reversal. There is no `fulfilled → paid`, and no step back from `delivered` or `received`.

An order that was fulfilled in error is not a rewound order, it is an order with
a mistake in its history — and the timeline is the artefact people actually
reason from when a customer disputes something. Adding a reverse edge would let
the current status quietly contradict the trail that explains it.

## Why the client does not own a copy

`AdminOrderDetailDto` carries `allowedStatuses` and `allowedPaymentStatuses`,
computed from the machine on every read. The admin renders its action buttons
from those arrays.

The client's `apps/admin/src/lib/orders/status.ts` holds only labels, colours
and display order — things the server has no opinion about. It never decides
what is _legal_. A rule change on the server therefore reaches the UI on the
next request, with no matching client edit to forget.

## Rejections are written to be read

`explainRejection` produces the 409 body, and the admin shows it verbatim:

> This order is pending and cannot move to delivered. Possible next steps: paid,
> cancelled.

It names where the order is, what was asked, and what would actually work. A
bare "invalid transition" would send the reader to the source.

## Status moves stock

Placement takes the units; `transition-repo.applyTransition` moves
`products.stock` for every later move in the same transaction: cancelling an
unpaid order puts them back, and so does `cancelled`/`refunded` from `paid` or
`delivery_missed`. Delivery, pickup, `received` and `fulfilled` move nothing: a
returned rental unit is put back by its own inspection. An old order that holds
nothing takes its units at `paid`. A take the shelf cannot cover is a 409 and the status does not move.
See `orders-stock.md`. Online payment moves `pending → paid` itself, with no
operator (`online-payments.md`).

## The audit trail is not optional

`transition-repo.applyTransition` (a transaction around `applyTransitionInTx`, which other
modules call inside theirs) writes the status column **and** its
`order_status_events` row inside one transaction. If the event insert fails, the
status change rolls back with it.

A status with no explanation is precisely the state the timeline exists to
prevent, so the two cannot come apart. This is also why `PATCH /orders/:id`
cannot touch status at all — `AdminUpdateOrderSchema` omits the field. A second,
unaudited write path is the only way this invariant could be lost, so there
isn't one.

`order_status_events` is append-only. `field` is `status`, `paymentStatus`,
`customerLink`, `contract`, `extension`, `email`, `discount`, `link` or `inspection` (a
returned unit decided or resolved: `toValue` is the outcome or resolution, `note` the
product and what was written). `discount`
(manual orders) records the order-level discount, `fromValue`/`toValue` the amounts and `note`
the reason. `link` records an order link being sent or revoked (written from Phase 2). A manual
order's payment is recorded through `moveStatus` with the note "Payment recorded: bank transfer,
ref. …", on both the `status` and `paymentStatus` events; see `manual-orders.md`. `email` records a send that
failed, `toValue` naming the message (`contract_ready`, …) — see
`notifications-and-mail.md`. It is one table, so the timeline is a
single ordered read. `extension` events record each step of a rental extension,
whose own row in `rental_extensions` is the source of truth (see
`rental-extensions.md`). `contract` events (written by `repo.insertContractEvent`)
record contract milestones — sent, signed, voided, renewal sent — against the
order without touching any order column: the contract's own row stays the source
of truth for its status. Values are stored as `text`, not the enums: an event
written today has to stay readable after an enum member is renamed or dropped. `actorUserId` is nullable and
`ON DELETE SET NULL`, because the event has to outlive the account that caused
it.

An order's **first** entry is written by `repo.insertOrder`, in the same
transaction as the order and its lines: `fromValue` is `null` because the order did
not move into `pending`, it began there, and `actorUserId` is `null` because a
customer placed it. Without it, a storefront order would read as one that appeared
out of nowhere. See `docs/code/orders-placement.md`.

## Every mutation returns the whole order

`POST /status`, `POST /payment` and `PATCH` all respond with the full refreshed
`AdminOrderDetailDto`. The client's cache story stays `order = updated`: no
second GET, no partial merge, and the newly written timeline entry arrives with
the change that produced it.
