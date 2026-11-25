# Delivery fee

A home delivery is priced when the order is placed: each product may carry its own
fee, a platform-wide fallback covers products without one, and the order pays the
**highest** of them — one van trip carries the whole cart. The fee is part of the
order total and is charged online with the goods. Collection from a branch is free.

The client calls this temporary. Every rule below lives in ONE function,
`resolveDeliveryFee` in `packages/pricing/src/delivery.ts`; a future scheme
(per-km, zones) replaces that function and nothing else needs to know.

## Where the numbers come from

```
products.delivery_fee          numeric(12,2) NULL   NULL = "use the fallback"
platform_settings
  key   'deliveryFee'
  value { fallback: '15.00' }  or { fallback: null }  — no row = null
```

Both are edited in the admin: the product's Pricing tab ("Costo consegna", empty =
use default) and Settings → General → "Consegna" (fallback, empty = none).

## How an order's fee is decided

**Normal case** — fallback 15,00 €, home delivery:

```
1. cart                        Carrozzina X  (own fee 25,00)  × 2
                               Deambulatore Y (own fee —)     × 1
2. each line → its fee         X → 25.00        Y → 15.00 (fallback)
3. highest wins                → 25.00          quantity never matters
4. order records               shipping_total 25.00
                               total          subtotal + 25.00
5. card payment charges        total — goods and delivery together
```

**Fallback case** — no own fee on any line AND no fallback:

```
1. each line → its fee         X → null         Y → null
2. highest of nothing          → null  = UNPRICED
3. order records               shipping_total 0.00   ← today's behaviour
4. storefront shows            "Da concordare"-style copy, as before
5. admin Delivery card         flags it "to agree"; operator types the amount
```

**Mixed** — X has 25,00, Y has none, no fallback → 25.00. A line without a fee
never makes a priced cart unpriced; `null` comes back only when no line has one.

**Collection** — `storePickup` → `0.00` always, whatever the products carry.

## The function

```ts
// packages/pricing/src/delivery.ts
resolveDeliveryFee(
  method: DeliveryMethodId,
  productFees: readonly (string | null)[],   // one per line, the product's own fee
  fallback: string | null,
): string | null                              // null = unpriced home delivery
```

## Who calls it

```
server  orders/placement.ts     authoritative — fees read from the DB, never the body
web     checkout overview/card  display only, same function, same inputs
web     cart summary            display only, home-delivery figure
```

The storefront reads the fallback from `GET /api/settings/delivery` (public) and
each product's own fee from the public product DTO. The server re-reads both at
placement, so a stale storefront cache can show a different figure for a moment but
can never charge one.
