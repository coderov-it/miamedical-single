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
     item.0.from=2026-08-20  item.0.to=2026-08-27
     item.0.variant.colore=grigio
     item.0.variant.sponde=si
     item.0.variant.altezza-materasso=18
     item.0.question.piano-installazione=3
     item.0.question.ascensore=yes
     item.0.addon=943f31e2…                     → shows "469,50 €"

2. the page's JSON island               data-checkout-items
     [{ productSlug: 'letto-degenza-elettrico',
        quantity: 1, startDate: '2026-08-20', endDate: '2026-08-27',
        addonIds: ['943f31e2…', 'ea063eea…'],   ← required add-on folded in
        variants: { colore: ['grigio'], sponde: ['si'],
                    'altezza-materasso': ['18'] },
        answers:  { 'piano-installazione': ['3'], ascensore: ['yes'] } }]
                                                → choices only, no amounts

3. POST /api/orders                     items + customer + delivery + notes

4. server re-reads the catalogue        loadProduct('letto-degenza-elettrico')
     status must be 'active'                    → PublicProductDetailDto (it)

5. server re-resolves every choice      resolveLine(product, item)
     colore=grigio                              → "Grigio"           +4.00
     sponde=si                                  → "Con sponde"       +6.00
     altezza-materasso=18                       → "18 cm"            +4.50
       (18 × 0.25 per cm, via mulMoney)
     ascensore=yes                              → "Sì"
     matchSku({colore:'grigio', sponde:'si'})   → MIA-LTE-GRI-CS-5VC6

6. server prices it                     priceRequest(...) in @mia/pricing
     unit rate    35.00 + 4.00 + 6.00 + 4.50    → 49.50 per day
     duration     2026-08-20 → 2026-08-27       → 7 days
     base         49.50 × 7                     → 346.50
     add-on       9.00 × 7  (rental mode)       → 63.00
     add-on       60.00     (fixed, one-off)    → 60.00
     line total                                 → 469.50

7. server writes, in one transaction    insertOrder(...)
     nextval('order_number_seq') → 1000         → MIA-2026-001000
     orders.subtotal                            → 469.50
     orders.shipping_total  (homeDelivery)      → 15.00
     orders.total                               → 484.50
     order_items.unit_price / .total            → 49.50 / 469.50
     order_items.configuration                  → the snapshot below
     order_status_events                        → null → pending

8. response                             201
     { number: 'MIA-2026-001000', status: 'pending',
       paymentStatus: 'unpaid',
       totals: { subtotal: '469.50', shippingTotal: '15.00',
                 total: '484.50', currency: 'EUR' } }
```

Step 1 and step 6 print the same figure because they run the same function.

## The fallback walk — a rental with no return date

```
1. checkout page renders          ?product=letto-degenza-elettrico&from=2026-09-01
                                         (no `to`, no package)

2. priceRequest(...)              units    → null
                                  total    → 45.00
                                  openPeriod → true
                                         → the page shows "45,00 €/giorno"
                                           and the qualifier "periodo da definire"

3. checkout.blocked               'openPeriod'
                                         → the confirm CTA is REPLACED by a notice
                                           and a link back to the product page.
                                           No POST is offered.

4. if one is forced anyway         POST /api/orders
   assertPeriod(...)                     → 422
     { fields: { 'items.0.endDate': 'A rental needs a return date.' } }
```

An order may never be open-period: `orders.total` is `NOT NULL`, and a per-unit rate
stored there would be a rate wearing a total's clothes. A **package** satisfies the
duration on its own (`7-giorni` → 7 days), so a packaged rental needs a start date
but no explicit return date.

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
  "rental": { "startDate": "2026-08-20", "endDate": "2026-08-27", "units": 7 },
  "rentalPackage": null,
  "unitRate": "49.50",
  "selections": [
    { "key": "colore", "label": "Colore", "value": "Grigio", "amount": "4.00" },
    { "key": "sponde", "label": "Sponde laterali", "value": "Con sponde", "amount": "6.00" },
    { "key": "altezza-materasso", "label": "Altezza materasso", "value": "18 cm", "amount": "4.50" }
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
      "total": "63.00"
    },
    {
      "id": "ea063eea-…",
      "name": "Consegna e installazione",
      "mode": "fixed",
      "unitPrice": "60.00",
      "total": "60.00"
    }
  ]
}
```

Labels are **frozen**, not read live through the SKU — for the same reason
`productTitle` is a column. A rental agreement has to keep saying what it said after
the operator renames an option.

`unit_price × quantity` is deliberately **not** `total`: the total also carries the
duration and the add-ons, and this blob is what explains the difference. The admin
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
homeDelivery   priced from the CAP, per order
storePickup    STORE_PICKUP_FEE, which is '0.00'
```

There used to be a third, `hotelDelivery`, at a flat €25 with its own two fields.
It was removed: a hotel is an address, and home delivery covers a house, a hotel,
a holiday let and an airport hotel alike. Asking the customer to classify their own
building added a branch to every layer and a way to get it wrong.

## What delivery costs, and who decides

Two walks. Both hit `resolveQuote` — the storefront over `POST /api/delivery/quote`
to show a figure, `place()` directly to write one — so the number the customer
agrees to and the number stored cannot come from different code.

**An address the ladder prices.**

```
1. customer picks, step 2        Lazio → Roma (RM) → Roma → 00121
   then types the street         Via Ostiense 44
2. storefront POSTs              { cap: '00121', istatCode: '058091',
                                   comuneName: 'Roma' }
                                 ← the CODE is what answers; the name is only a
                                   fallback tiebreak, unused here
3. quote answers                 { kind: 'fee', fee: '35.00', areaLabel: 'Roma 00121' }
4. card shows                    Consegna e ritiro …        +35,00 €
5. customer confirms, POST /api/orders
   delivery body                 { method: 'homeDelivery',
                                   address: { line1, city, postalCode, istatCode } }
                                 ← an address, never an amount
6. place() re-resolves           resolveQuote(db, { cap: '00121', istatCode: '058091',
                                                    comuneName: 'Roma' })
7. order records                 shipping_total 35.00
                                 delivery.quote { kind: 'fee', fee: '35.00',
                                                  areaLabel: 'Roma 00121',
                                                  resolvedVia: 'cap' }
```

Step 6 is handed the same three values step 2 sent, so the two calls cannot diverge
— and because `istatCode` pins one comune, neither call can be affected by a CAP our
reference data spells differently or lacks entirely.

**An address nothing prices — an answer, not a failure.**

```
1. customer picks                Lombardia → Milano → Milano → 20121
2. quote answers                 { kind: 'call', areaLabel: 'Italia',
                                   resolvedVia: 'country' }
                                 ← the comune is known; nothing above it is priced
3. card shows                    Da confermare
   and, under it                 "Per questa zona non abbiamo una tariffa fissa.
                                  Possiamo definire il costo di consegna in chat.
                                  Va bene?"
4. order records                 shipping_total 0.00
                                 delivery.quote { kind: 'call', … }
5. admin's Delivery card         0,00 €   To agree by phone · Italia
6. WhatsApp message carries      "Consegna: Da confermare"
```

`0.00` is not a claim that delivery is free — it is the part of the total that is
settled. The quote block beside it is what says a figure is still owed, and it is
why the admin can show that without re-deriving anything.

The fee is never read off the request. `CheckoutDeliverySchema` has no field for an
amount, so a crafted body can change what is ordered and where it goes, never what
it costs.

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

The address carries both `city` and `istatCode`, which are two jobs rather than a
duplicate: `city` is the comune's name, part of what a courier reads; `istatCode` is
what the fee is keyed on. The form fills both from one pick, so they cannot disagree.
`istatCode` is optional because the picker can be unreachable — then the server
infers the comune from the CAP, exactly as it did before the picker existed.

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

The panel never claims a confirmation email: there is no mail service behind it.

## Known gaps

- **A collected order has no address at all**, which an invoice for a company
  eventually needs. The checkout asks for a registered address nowhere, and
  inferring one from a delivery address would be worse than its absence. Asking for
  it on the `company` chip is the fix when invoicing is built.
- **A shared CAP can be priced coarsely.** When a CAP spans several comuni that
  disagree on price and nothing breaks the tie, the quote widens to what they all
  share, which can be dearer than the right answer — Riano's customer is quoted
  Lazio's fee rather than Riano's. Step 1's town breaks the tie; an alternate
  delivery address is one free-text line, so it cannot. Every imprecise resolution
  lands in `zone_resolution_misses`.
- **The delivery quote is not re-checked at hand-over.** It is resolved again by
  `place()`, so the stored figure is always current — but a customer who leaves the
  tab open while the owner edits a zone sees the older number on the card until they
  touch a CAP field.
- **No cart persistence.** The storefront cart lives in `localStorage`; the `carts`
  and `cart_items` tables are still only written by the seed, so the admin's
  abandoned-cart view shows seeded rows.
- **No order confirmation email**, and nothing tells the customer their order
  number except the page they are standing on.
- **`orders.user_id` is always null.** Placement never links an order to an account,
  because the checkout never asks anyone to sign in.
- The product page's inline estimate script is still its own implementation of the
  pricing rules — a third copy, in browser TypeScript. Folding it onto
  `@mia/pricing` is the remaining half of that job.
