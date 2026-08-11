# Delivery pricing

The owner has a spreadsheet of places and prices. Italy has 7,896 comuni. This is
how the second becomes the first without typing 7,896 rows.

Files: `packages/db/src/schema/delivery.ts`, `packages/db/data/`,
`apps/server/script/build-istat-dataset.ts`,
`apps/server/src/modules/delivery/`, `apps/admin/src/lib/delivery-zones/`.

| Endpoint | For |
| --- | --- |
| `POST /api/delivery/quote` | public; `{ cap, comuneName? }` → a price or a phone quote |
| `GET /api/admin/delivery-zones` | the whole tree, nested |
| `POST /api/admin/delivery-zones` | add an area under a parent |
| `PATCH /api/admin/delivery-zones/:id` | rename, recode, or change the value |
| `DELETE /api/admin/delivery-zones/:id` | removes the subtree with it |

Permissions are the `2000` block in `@mia/permissions`.

---

## The tree

```
country    Italia — one row, always has a value, cannot be deleted
  region
    province
      comune
        cap        ← the pair (parent comune + this CAP), never a CAP alone
```

A row either carries a value or inherits one. Three states, and the difference
between the first two is the whole point:

```
value_kind = NULL   nobody has filled this in     → look at the parent
value_kind = 'fee'  a fixed amount at checkout    → 45.00
value_kind = 'call' we serve it, won't quote online → "let's agree it in chat"
```

`call` is a decision. `NULL` is an absence. Collapsing them would lose the owner's
intent the first time someone tidied up empty rows.

## Resolving an address

The customer types a CAP. Two walks — the same tree, a different answer.

Tree for both walks:

```
Italia                     call
  Lazio                    45.00
    Roma (RM)              —          (inherits)
      Riano       058081   40.00
      Formello    058038   —          (inherits)
  Lombardia                —          (inherits)
```

**Normal case — a CAP that names one comune.**

```
1. customer types            00121
2. istat_comune_caps         00121                  → 058091  (one comune: Roma)
3. istat_comuni              058091                 → Roma, RM, region 12
4. candidates, narrowest first:
     cap      058091 + 00121  → no row
     comune   058091          → no row
     province RM              → row, but value_kind NULL → skip
     region   12              → row, fee 45.00        ← first row with a value
5. answer                    { kind: 'fee', fee: '45.00', areaLabel: 'Lazio' }
```

**Fallback case — a CAP shared by 17 comuni, and we cannot tell which.**

```
1. customer types            00060
2. istat_comune_caps         00060                  → 17 comuni, incl. 058081 Riano
3. no comune name given, so no way to pick one
4. do the 17 agree on a price?
     Riano 058081            → 40.00
     Formello 058038         → inherits → Lazio 45.00
     … the rest             → inherits → Lazio 45.00
   they disagree             → do NOT guess
5. fall to the narrowest thing all 17 share: province RM → NULL → region 12 → 45.00
6. answer                    { kind: 'fee', fee: '45.00', areaLabel: 'Lazio' }
   and a row in zone_resolution_misses, so a real gap becomes visible
```

Had the customer's address also given `Riano`, step 3 would have matched
`name_normalised` and step 5 would never have run — the answer would be `40.00`.

A wrong price is worse than a coarse one, so nothing is ever fuzzy-matched. The
country row is why there is always an answer: coverage is 100%, not 99%.

The resolver is `resolveQuote` in `apps/server/src/modules/delivery/service.ts`,
behind `POST /api/delivery/quote`. It is the only implementation: the admin's tree
computes what a *row* effectively costs (a walk up one path), never what an
*address* costs (which has to reconcile every comune a CAP could mean).

## Why a CAP is not a level

It lines up with nothing, in both directions at once. Measured on the seeded data:

```
Rome (one comune)          → 79 CAPs          CAP is FINER than the comune
CAP 24060 (Bergamo hills)  → 45 comuni        CAP is COARSER than the comune
CAP 00060 (north of Rome)  → 17 comuni
860 of 4,735 CAPs (18%)    → shared by 2+ comuni
```

So a `cap` row stores the CAP in `code` and gets its comune from `parent_id`.
Keying on the CAP alone would let one comune's fee leak onto 44 neighbours.

## Why the ISTAT code and not the name

`delivery_zones.code` at the comune level is the 6-digit ISTAT code — `058091`,
not `Roma`. Names are display only, and `name` may be edited freely without
changing what an address matches.

Names cannot be identity: they repeat (Samone exists in both TO and TN, Calliano in
TN and AT), they get renamed (Montecompatri → Monte Compatri), and every address
provider spells them slightly differently. ISTAT codes are retired on a merge and
never reassigned.

## The reference data

No provider returns ISTAT codes — checked for both HERE and Google. So the mapping
has to be ours, built once at import time and committed:
`packages/db/data/`, rebuilt with `pnpm --filter @mia/server istat:build`.

Three sources, because no free one has both halves:

```
ISTAT comune list      7,896 comuni, codes, provinces, regions   — but no CAPs
GeoNames postal        4,735 CAPs + a place name                 — but no ISTAT codes,
                                                                   and the place is often
                                                                   a frazione (19% of rows)
GeoNames gazetteer     place → admin3, which for Italy IS the ISTAT code
```

The gazetteer is the bridge: it is what turns "San Giovanni, AQ" into the comune
that contains it. How each of the 18,415 postal rows resolves:

```
name + province                  14,963   the plain case
name unique in Italy, in region      123   recovers Sardinia, where GeoNames still
                                           uses the pre-2016 provinces (CA where
                                           ISTAT now says SU) — the province
                                           disagrees, the region does not
frazione whose CAP is already known 3,296  dropped on purpose: adding a guessed
                                           parent would invent a shared CAP and push
                                           real lookups to a coarser price
nearest place, CAP would be lost        33  see below
unresolved                               0
```

The region guard on the second rule is not optional. Without it a hamlet near Rome
matches a same-named comune in Piedmont, and CAP 00060 picks up comuni 500 km away.

**Result: 4,735 of 4,735 CAPs resolve, and 7,894 of 7,896 comuni have a CAP.**
`packages/db/data/README.md` records the imperfections behind those numbers — the
33 proximity matches, and the 2 comuni that recently changed province.

## What the database refuses

An illegal tree is unstorable, with no triggers — every migration in this repo is
Drizzle-generated and that stays true.

```
delivery_zones_parent_fk             (parent_id, parent_level) → (id, level)
                                     the denormalised parent_level cannot lie
delivery_zones_nesting_check         only country→region→province→comune→cap
delivery_zones_root_is_country_check the parent columns are all-or-nothing, and the
                                     root is the country row
delivery_zones_sibling_key           no duplicate siblings — but the same CAP may
                                     exist under different comuni
delivery_zones_root_key              one root, ever
delivery_zones_value_check           exactly the three legal value states
delivery_zones_fee_sign_check        no negative fees
```

`parent_level` is denormalised for one reason: a `CHECK` cannot see another row, so
without it the nesting rule would need a trigger.

The all-or-nothing clause on the parent columns exists because a composite foreign
key is `MATCH SIMPLE` — it is trivially satisfied when *either* referencing column
is NULL, so a row could name a real parent, leave `parent_level` NULL, and never be
checked against it.

## Deliberately not modelled

**Distance.** The first design routed from the nearest outlet and priced per km.
It was dropped because the owner prices from a list, and because km pricing needs a
geocoding provider, an API key and coordinates on every order — for a number the
owner already knows.

**`frazione`.** The value exists in `delivery_zone_level` and nothing writes it. No
Italian retailer surveyed prices below CAP, and a frazione cannot be matched
reliably from address data. Keeping the enum value means enabling the tier later
needs no migration; appending to a pg enum is cheap, inserting is not.

**A delete guard on the country row.** Deleting it would cascade the whole tree
away, so the service refuses and the admin hides the button. It is not enforced in
the database because that is the one rule that would need a hand-written trigger.
The service also refuses to recode it or set it to inherit, for the same reason:
it is the fallback that makes coverage total.

**Moving a row to a different parent.** `UpdateZoneSchema` accepts only `name`,
`code` and the value pair. Re-parenting would silently change what every address
underneath resolves to, which is a delete-and-recreate decision.

**Anything below CAP, in practice.** `frazione` is a legal level and the admin will
create one, but nothing matches it: a quote comes in as a CAP, and no address field
is reliable enough to name a frazione from. It exists so enabling that tier later
needs no migration.
