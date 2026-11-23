# Order delivery, return and inspection

Status: built on the server (statuses, machine, stock, inspections, attention queue, date
shift, rental readers). Admin screens: Return check page and the order card. The machine and stock tables now live in
`orders-status-machine.md` and `orders-stock.md`.
Visual draft for review: `docs/plan/PLAN_delivery_return_flow.html` (temporary).

Code: `orders/status.ts`, `orders/stock.ts`, `orders/delivery-dates.ts`,
`orders/transition-repo.ts`, `modules/return-inspections/`, `shared/rental-calendar.ts`.

Before this, the machine knew only `pending → paid → fulfilled`, and a rental's "Confirm
return" put stock back the moment it was clicked. The agent who collects a return is not the
one who can tell whether the unit is fit to rent again, so a return must not restock on its own.

## The flow

```text
pending ──pay──▶ paid ──▶ out_for_delivery ──▶ delivered ──(sale)──▶ fulfilled
   │              │            │      ▲             │
   ▼              ▼            ▼      │ retry       └──(rental)──▶ with customer
cancelled   cancelled /   delivery_missed                              │
            refunded           │                                       ▼
                               └── give up ──▶ cancelled        out_for_pickup ⇄ pickup_missed
                                                                       │
                                                                       ▼
                                                              received (stock unchanged)
                                                                       │
                                                       inspector decides each unit
                                                       ├─ Stock back        → stock +1
                                                       └─ Needs attention   → attention queue
                                                            ├─ Repaired     → stock +1
                                                            └─ Write off    → stays out, reason kept
                                                                       │
                                                  every unit decided ──▶ fulfilled (rental closed)
```

Status names are the enum members; labels shown to agents come from i18n.

## Rental: 2 beds, 10 days booked from 10 Nov, stock 3

```text
 1. Order placed                           → stock 1
 2. Paid                                   → stock 1
 3. 10 Nov  out_for_delivery
 4. 10 Nov  customer not home              → delivery_missed (note)
 5. 11 Nov  out_for_delivery               (retry)
 6. 11 Nov  delivered                      → rental starts 11 Nov, due back 21 Nov
 7. 21 Nov  out_for_pickup
 8. 21 Nov  received                       → stock 1
 9. bed #1  Stock back                     → stock 2
10. bed #2  Needs attention "motor noise"  → stock 2, queue 1, order → fulfilled
11a.        bed #2 Repaired                → stock 3
11b.        bed #2 Written off             → stock 2, history says why
```

## Sale: 1 chair

```text
1. Paid                    → stock already taken at placement
2. out_for_delivery → delivered → fulfilled   (sold, never back)
```

## Decisions

1. Every physical step is an order status an agent sets in the admin panel, and each
   one lands in the order timeline with who and when.
2. `received` does not restock. Each unit is decided on its own: one order can send one
   bed back to stock and the other to repair.
3. The order closes once every unit is decided. A unit under repair lives in a
   product-level attention queue, so the rental does not stay open for the repair.
4. **A rental starts when it is marked `delivered`.** The booked start date is the plan
   only; the due date is the delivery day plus the booked length:

   ```text
   booked 10 Nov, 10 days, delivered 11 Nov  → due back 21 Nov
   booked 10 Nov, 10 days, delivered  9 Nov  → due back 19 Nov
   ```

   Every reader of the booked dates moves to the delivered date: the Rent Management due
   column and filters (`shared/rental-calendar.ts`), due/overdue reminders, rental
   extensions, and the contract's printed period.

## As built

```text
POST /api/admin/orders/:id/status       { to, note?, deliveredOn? }   order:update
POST /api/admin/orders/:id/inspections  { orderItemId, outcome, note? }  order:update
GET  /api/admin/returns/pending                                        order:read
GET  /api/admin/attention                                              order:read
POST /api/admin/attention/:id/resolve   { resolution, note? }          order:update
```

- Admin page `/returns` ("Return check", under Rent Management, `order:read`; buttons need
  `order:update`) has two tabs, kept in `?tab=`: **To check** (undecided units of `received`
  rentals, grouped by order, from `/returns/pending`) and **Needs attention** (the repair queue,
  from `/attention`). Units are decided only here; the order page shows a progress line and a link to this page.
  Code: `routes/(app)/returns/`, `lib/returns/`.
- `/returns/pending` returns one element per undecided unit
  `{ orderId, orderNumber, customerName, orderItemId, productId, productTitle, unitNumber, receivedAt }`:
  `quantity − decisions` per rental line, `unitNumber` continuing after the decided ones, oldest
  `receivedAt` first (latest `received` status event). Pure part: `pending-units.ts`.
- Every new move uses `order:update` (reads `order:read`); no new permissions.
- `return_inspections`: one row per physical unit. Inspecting needs the order `received`;
  `attention` needs a note; the last unit closes the order, same transaction.
- The order detail carries `flow`, `allowedStatuses` (flow-aware; `received` is `[]`) and
  `returnUnits` (rental lines with their decisions).
- Rent Management "Confirm return" (`POST /rentals/:id/finish`) now moves the order to
  `received`; it no longer restocks or closes.
- Legacy orders: `apps/server/script/move-legacy-rentals.ts` (`legacy:delivered`) moves every
  `paid` order with a rental whose booked start had passed to `delivered` (dates not shifted),
  with a timeline row saying so. It is not a migration: enum values added in 0026 cannot be
  used in the same transaction, so it runs once after 0026 has committed. Deploy:
  `pnpm db:migrate`, then `pnpm --filter @mia/server legacy:delivered`.

Contracts are not re-rendered when delivery shifts the dates: a signed contract keeps the
period it was signed with. A contract generated after delivery reads the shifted line dates.

## Decisions taken

- Permissions stay on `order:update` / `order:read`. The proposed `order:deliver`,
  `rental:inspect`, `product:stock` split and the Driver and Warehouse bundles are dropped.
- The booked length is kept and only the start moves (decision 4).
- Returns of sold items are out of scope: a sale ends at `fulfilled`; a goods return stays a hand
  edit of stock.
