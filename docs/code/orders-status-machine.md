# Order status machine

`apps/server/src/modules/orders/status.ts` is the single authority on what may
follow what. Nothing else decides.

---

## The two axes

An order carries **two** independent statuses, and conflating them was the first
thing to get right.

```
status:        pending → paid → fulfilled
                  ↓       ↓         ↓
               cancelled  ↓      refunded
                       refunded

paymentStatus: unpaid → authorized → paid → partially_refunded → refunded
                  ↓          ↓
                failed ──────┘  (recoverable: back to unpaid/authorized/paid)
```

They move independently because reality does: a bank transfer can clear days
after the goods went out, and a partial refund does not un-fulfil an order.

`cancelled` and `refunded` are **exits**, not stages — nothing continues out of
them, which is what makes them safe for the UI to treat as terminal.

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

Reversal. There is no `fulfilled → paid`.

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

> This order is pending and cannot move to fulfilled. Possible next steps: paid,
> cancelled.

It names where the order is, what was asked, and what would actually work. A
bare "invalid transition" would send the reader to the source.

## The audit trail is not optional

`repo.applyTransition` writes the status column **and** its
`order_status_events` row inside one transaction. If the event insert fails, the
status change rolls back with it.

A status with no explanation is precisely the state the timeline exists to
prevent, so the two cannot come apart. This is also why `PATCH /orders/:id`
cannot touch status at all — `AdminUpdateOrderSchema` omits the field. A second,
unaudited write path is the only way this invariant could be lost, so there
isn't one.

`order_status_events` is append-only. `field` is `status`, `paymentStatus`,
`customerLink` or `contract` — one table rather than four, so the timeline is a
single ordered read. `contract` events (written by `repo.insertContractEvent`)
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
