# Placing an order

`POST /api/orders` turns a finished checkout into an `orders` row. It is public and
unauthenticated, because the storefront takes rentals from people who have never
signed in.

Code: `apps/server/src/modules/orders/{routes,service,resolve,repo}.ts`, the wire
format in `packages/validators/src/order.ts`, the money rules in
`packages/pricing`.

## The normal walk

A customer configures a hospital bed on its product page, adds the anti-decubitus
mattress, and confirms. What each step gets:

```
1. checkout page renders          resolveCheckout(params)
     item.0.product=letto-degenza-elettrico
     item.0.package=7-day    item.0.from=2026-09-10
     item.0.variant.colore=grigio
     item.0.variant.sponde=si
     item.0.question.piano-installazione=3
     item.0.question.ascensore=yes
     item.0.addon=943f31e2…
     item.0.addon.943f31e2…=2                   → shows "376,00 €"

2. the page's JSON island               data-checkout-items
     [{ productSlug: 'letto-degenza-elettrico',
        quantity: 1, startDate: '2026-09-10',
        rentalPackageCode: '7-day',             ← no end date: it is DERIVED
        addons: [{ id: '943f31e2…', quantity: 2 },
                 { id: 'ea063eea…', quantity: 1 }],
        variants: { colore: ['grigio'], sponde: ['si'] },
        answers:  { 'piano-installazione': ['3'], ascensore: ['yes'] } }]
                                                → choices only, no amounts

3. POST /api/orders                     items + customer + delivery + notes

4. server re-reads the catalogue        loadProduct('letto-degenza-elettrico')
     status must be 'active'                    → PublicProductDetailDto (it)

5. server re-resolves every choice      resolveLine(product, item)
     package=7-day                              → "7 giorni"        180.00
     colore=grigio                              → "Grigio"           +4.00
     sponde=si                                  → "Con sponde"       +6.00
     ascensore=yes                              → "Sì"
     matchSku({colore:'grigio', sponde:'si'})   → MIA-LTE-GRI-CS-5VC6
       identity only — a rental SKU carries no price

6. server places the period             resolvePeriod('2026-09-10', null, pkg)
     7 days from 2026-09-10                     → ends 2026-09-17

7. server prices it                     priceRequest(...) in @mia/pricing
     package      7 giorni                      → 180.00
     variants     4.00 + 6.00, FLAT             → +10.00
       not × 7: the package already carries the days
     unit rate                                  → 190.00
     add-on       9.00 × qty 2 × 7 days         → 126.00
     add-on       60.00 (fixed, one-off)        → 60.00
       both chosen — nothing attaches itself
     line total                                 → 376.00

8. server writes, in one transaction    insertOrder(...)
     nextval('order_number_seq') → 1000         → MIA-2026-001000
     orders.subtotal                            → 376.00
     orders.shipping_total                      → 0.00
     orders.total                               → 376.00
     order_items.unit_price / .total            → 190.00 / 376.00
     order_items.configuration                  → the snapshot below
     order_status_events                        → null → pending

9. response                             201
     { number: 'MIA-2026-001000', status: 'pending',
       paymentStatus: 'unpaid',
       totals: { subtotal: '376.00', shippingTotal: '0.00',
                 total: '376.00', currency: 'EUR' } }
```

Step 1 and step 7 print the same figure because they run the same function.

## An hour package

Only the period differs — the same pricing walk, and the customer is asked for a
time of day because a 4-hour rental starting "on the 10th" says nothing:

```
     package=4-hour  from=2026-09-10  time=22:00

     resolvePeriod('2026-09-10', '22:00', pkg)  → ends 2026-09-11 02:00
     package      4 ore                         → 15.00
     variants     flat                          → +10.00
     add-on       9.00 per DAY on a 4-hour package:
                  convertDuration(4, 'hour', 'day') → 1
                  9.00 × qty 2 × 1                  → 18.00
     add-on       60.00 (fixed)                 → 60.00
     line total                                 → 103.00
```

Half a day of insurance is still a day of insurance, so the conversion rounds up.

## The fallback walk — a rental with no package

```
1. checkout page renders          ?product=letto-degenza-elettrico&from=2026-09-10
                                         (no `package`)

2. priceRequest(...)              units      → null
                                  total      → 0.00
                                  incomplete → true
                                         → the page shows no figure at all and
                                           the qualifier "scegli un pacchetto"

3. checkout.blocked               'noPackage'
                                         → the confirm CTA is REPLACED by a notice
                                           and a link back to the product page.
                                           No POST is offered.

4. if one is forced anyway         POST /api/orders
   resolveRental(...)                    → 422
     { fields: { 'items.0.rentalPackageCode':
                 'A rental needs a package — that is what sets its price.' } }
```

A rental IS its package. There is no per-unit rate to fall back to and no
open-ended period, so a line without one has no total — and `orders.total` is
`NOT NULL` for a reason. An hour package additionally needs `startTime`, refused
the same way.

The same gate covers a line that never made a required choice
(`checkout.blocked === 'incomplete'`), because `resolveLine` refuses that too.

## What the request may and may not contain

The body carries **choices, never prices**. There is no field for an amount, and
`PlaceOrderSchema` is a `strictObject`, so inventing one is a 422:

```
{"items":[{…, "unitPrice":"0.01"}]}
  → 422 { fields: { 'items.0.unitPrice': 'Invalid key: Expected never…' } }
```

That is what makes the endpoint safe to leave open. The worst a crafted request can
do is order something else — at that thing's real price.

## Strict here, lenient there

`apps/website/src/lib/request-config.ts` and `apps/server/.../resolve.ts` read the
same choices and disagree on purpose:

| input                      | the storefront     | the server |
| -------------------------- | ------------------ | ---------- |
| unknown option value       | drops it           | 422        |
| unknown group key          | ignores it         | 422        |
| required group unanswered  | renders without it | 422        |
| numeric value out of range | drops it           | 422        |
| unpublished product        | drops the line     | 422        |

A summary page showing one line fewer is better than one showing a choice we cannot
honour. A stored order is the opposite: the customer is about to be held to it, so
quietly recording something narrower than they asked for is the one outcome worse
than failing.

## `order_items.configuration`

One jsonb per line, holding what the customer configured at the labels they read:

```json
{
  "productId": "e121cb78-…",
  "productSlug": "letto-degenza-elettrico",
  "pricingMode": "rental",
  "rentalUnit": "day",
  "rental": {
    "startDate": "2026-09-10",
    "startTime": null,
    "endDate": "2026-09-17",
    "endTime": null,
    "duration": 7,
    "unit": "day"
  },
  "rentalPackage": {
    "code": "7-day",
    "name": "7 giorni",
    "label": "7 giorni",
    "price": "180.00",
    "duration": 7,
    "unit": "day"
  },
  "unitRate": "190.00",
  "selections": [
    { "key": "colore", "label": "Colore", "value": "Grigio", "amount": "4.00" },
    { "key": "sponde", "label": "Sponde laterali", "value": "Con sponde", "amount": "6.00" }
  ],
  "answers": [
    { "key": "piano-installazione", "label": "A che piano…?", "value": "3" },
    { "key": "ascensore", "label": "E' presente un ascensore?", "value": "Sì" }
  ],
  "addons": [
    {
      "id": "943f31e2-…",
      "name": "Materasso antidecubito",
      "mode": "rental",
      "unitPrice": "9.00",
      "quantity": 2,
      "total": "126.00"
    },
    {
      "id": "ea063eea-…",
      "name": "Consegna e installazione",
      "mode": "fixed",
      "unitPrice": "60.00",
      "quantity": 1,
      "total": "60.00"
    }
  ]
}
```

Labels are **frozen**, not read live through the SKU — for the same reason
`productTitle` is a column. A rental agreement has to keep saying what it said after
the operator renames an option.

`unit_price × quantity` is deliberately **not** `total`: the total also carries the
add-ons, and this blob is what explains the difference. The admin
renders the breakdown from it rather than leaving an operator to reconcile two
numbers. `addons[].total` is each add-on's contribution **before** the line quantity.

A line with no `configuration` (`null`) predates this endpoint — the seed's orders,
or one an operator raised by hand. The admin renders the plain line in that case.

## One pricing rule, two callers

`packages/pricing` holds the owner's rental rules and the exact-money primitives.
Both the checkout's displayed estimate and the stored order price through it, so the
figure a customer confirms and the figure in `orders.total` are the same arithmetic
on the same inputs — not two implementations that happen to agree.

The package deliberately holds **no copy**. `priceRequest` returns structured rows
(`{ kind: 'duration', units: 7, amount: '346.50' }`) and each caller words them:
the storefront through its label catalog, the admin through its own. That is why the
server can price an order without a storefront copy catalogue.

`DELIVERY_METHODS` lives there too, but it no longer holds a fee. There are two
methods and one of them is free:

```
homeDelivery   NO_DELIVERY_FEE, which is '0.00' — unpriced, not free
storePickup    NO_DELIVERY_FEE, which is '0.00' — genuinely free
```

There used to be a third, `hotelDelivery`, at a flat €25 with its own two fields.
It was removed: a hotel is an address, and home delivery covers a house, a hotel,
a holiday let and an airport hotel alike. Asking the customer to classify their own
building added a branch to every layer and a way to get it wrong.

## What delivery costs, and who decides

**Nothing prices delivery.** There is no quote endpoint, no zone tree, and no fee
in any request or response at checkout. A zone ladder used to price this from the
customer's CAP; it was dropped in favour of a per-kilometre fee that does not exist
yet. Until it does, every order is placed at `'0.00'` and an operator writes the
agreed amount on afterwards.

**A home delivery — the fee arrives after the order does.**

```
1. customer types, step 2        Via Ostiense 44, int. 3
                                 00154 Roma (RM)
                                 ← one free-text box, newlines and all
2. card shows                    Consegna e ritiro …        Da concordare
   and, in the panel             "Ti contattiamo per il costo di consegna"
3. overview shows                Consegna a domicilio       Da concordare
                                 Totale                     1.240,00 €
                                 ← the goods alone; no fee is folded in
4. customer confirms, POST /api/orders
   delivery body                 { method: 'homeDelivery',
                                   address: { line1 } }
                                 ← an address, never an amount
5. order records                 shipping_total 0.00
                                 total          1240.00
                                 shippingAddress.line1  the text, verbatim
                                 shippingAddress.city / .postalCode  null
6. WhatsApp message carries      "Consegna: Da concordare"
7. admin's Delivery card         0,00 €   To agree by phone
8. operator rings, agrees 35,00 €, types it into that card
   PATCH /api/admin/orders/:id   { shippingTotal: '35.00' }
9. order now records             shipping_total 35.00
                                 total          1275.00   ← re-derived server-side
```

Step 9 recomputes the total from the order's own stored subtotal, not from anything
the browser sent — the same rule that has always applied to placement.

**A branch collection — free, and it says so.**

```
1. customer picks                Ritiro in sede → Roma
2. card shows                    Ritiro in sede             Gratis
3. order records                 shipping_total 0.00
                                 total          1240.00
4. admin's Delivery card         0,00 €        ← no "to agree" flag
```

Both methods store `0.00`, and the two zeros mean different things: a collection is
free, a home delivery is UNAGREED. `delivery.method` is what tells them apart, and
it is why the admin flags one and not the other.

The fee is still never read off the request. `CheckoutDeliverySchema` has no field
for an amount, so a crafted body can change what is ordered and where it goes,
never what it costs. Writing one requires `ORDER_UPDATE` in the admin.

The address is stored as ONE string. It was three fields plus an ISTAT code naming
the comune exactly, all of it there to key the fee on the comune; nothing prices
delivery, so the structure was spent on nothing. `city` and `postalCode` remain as
null keys in the snapshot because contract generation and the admin compose
`"line1, postalCode city"` from it and coalesce the missing parts away.

## The address belongs to the delivery

There is one address on the checkout and it lives in step 2, inside the home
delivery panel. It used to sit in step 1 beside the name and the email, which meant
every customer typed a delivery address — including the ones collecting from a
branch, for whom it was never used.

So the schema now says both halves of it:

```
homeDelivery  + address        → accepted
homeDelivery  (no address)     → 422  "A home delivery needs the address it is going to."
storePickup   + pickupCity     → accepted
storePickup   + address        → 422  "A collection has no delivery address."
```

A collected order therefore stores `shipping_address` and `billing_address` as
NULL. That is the honest record: nobody stated an address, and composing one from
the customer's contact details would be storing a fact they never gave.

## The return leg

A rental comes back, and where FROM is a different question from where it goes.
Usually the same place, so it is a default rather than a second address form:

```text
returnToSameAddress  absent or true   → the delivery address, or the branch
                     false            → `returnAddress`, one free-text line
```

Four rules, and every one of them is enforced:

```text
rented   + false + an address        → accepted
rented   + false + no address        → 422  "Tell us where to collect it from…"
rented   + true  + an address        → 422  "…there is no second one."
NOT rented + false + an address      → 422  "Nothing in this order is rented…"
```

The first three are `CheckoutDeliverySchema`. The last one is in `place()`, after
the lines are resolved, because only the catalogue knows whether a line is a rental
— `line.configuration.pricingMode`. The storefront only asks when something is
rented, so a body carrying a return address for an outright sale is the request
disagreeing with the catalogue, which is a 422 here like every other such
disagreement.

`returnToSameAddress` defaults to `true` rather than being required. An order placed
before the question existed has neither key, and "the same place" is exactly what it
meant — so `toDelivery` reads it as `value.returnToSameAddress !== false`: only an
explicit `false` means somewhere else.

Both fields are stored even when they are the default, because "the customer said
the same address" and "the customer was never asked" are different facts and the
driver's route depends on which. The admin's Delivery card renders the address
**only** when it differs — a line saying "same address" on every order is a line an
operator has to read to learn nothing.

## The address belongs to the delivery — both halves of it

The address is one free-text block, written by the person who lives there. It used
to be a street line plus a comune and a CAP picked down Italy's own ladder, with an
ISTAT code naming the comune exactly — structure that existed to key a delivery fee
on the comune and was dropped with the fee.

## Order numbers

`MIA-2026-001000` — the year from the clock at placement, the counter from
`order_number_seq`. A sequence rather than `MAX(number) + 1`, because two customers
confirming in the same second would read the same maximum and the unique index would
turn that into a failed checkout for whoever lost the race. The counter does not
reset per year; it starts at 1000, which leaves the seed's `MIA-2026-000001…6` alone.

## What the storefront does with the response

`apps/website/src/pages/checkout.astro`, confirm step:

- With no JavaScript the CTA **is** an `<a>` to WhatsApp carrying every line item —
  a complete path, not a degraded one. The order gets recorded by a human reading
  the message.
- With JavaScript the same control posts first, then reveals the confirmation with
  the order number and the server's own total. WhatsApp stays one step down, now
  quoting that number.
- On failure it says so and leaves the handover in place, because the message still
  carries the whole request. It does not tell the customer to start again.

The panel points at the inbox rather than repeating the order details: placement now
sends a confirmation email. What it says depends on whether the address already has
an account — see [customer-accounts.md](./customer-accounts.md).

## What placement writes about the customer

`orders` snapshots the contact block as columns: `email`, `phone`, `first_name`,
`last_name`, `customer_type`, `codice_fiscale`, `partita_iva`.

The two name columns exist because the name used to live **only** inside
`shipping_address.fullName`, and a store pickup has no address — so every collected
order silently lost the customer's name. Two such orders predate the fix and cannot
be recovered.

`customer_account_id` and `customer_link_status` are resolved before the insert, so
an order is never written unattached and patched afterwards. The branches, and why
`unverified` is the honest default for a checkout that takes any email it is given,
are documented in [customer-accounts.md](./customer-accounts.md).

## Known gaps

- **A collected order has no address at all**, which an invoice for a company
  eventually needs. The checkout asks for a registered address nowhere, and
  inferring one from a delivery address would be worse than its absence. Asking for
  it on the `company` chip is the fix when invoicing is built.
- **Delivery is not priced at all.** Every order is placed at `0.00` and an
  operator types the agreed amount in afterwards, so an order sitting in the queue
  unread carries a total that is not yet what the customer will pay. The admin's
  Delivery card flags a home delivery still at zero; nothing chases one that stays
  there. Per-kilometre pricing is what closes this.
- **Nothing reconciles the fee with the contract.** A contract generated before the
  operator types the delivery amount prints `0,00 €` for it, and regenerating is the
  only fix.
- **No cart persistence.** The storefront cart lives in `localStorage`; the `carts`
  and `cart_items` tables are still only written by the seed, so the admin's
  abandoned-cart view shows seeded rows.
- The product page's inline estimate script is still its own implementation of the
  pricing rules — a third copy, in browser TypeScript. Folding it onto
  `@mia/pricing` is the remaining half of that job.
