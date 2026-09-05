# The catalogue, migrated from miamedicalitalia.it

Crawled **4 September 2026** from the live site, through the browser, against
the shop's own WooCommerce Store API and WP REST API. Every figure, price and
sentence in `packages/catalog/src/data/` was read from that crawl. Nothing was
invented, and where the source is wrong or contradicts itself the source is
recorded and the problem is listed below rather than quietly corrected.

| | |
|---|---|
| Categories | **34** (every `product_cat` leaf term, flat) |
| Products | **108** (every published product) |
| Rental packages | **283** across 58 hire products |
| Product photos | **355** references, 246 distinct files, ~93 MB |

## What is where

```
docs/catalog/source/          the crawl, as committed source of record
  products.json               all 108 products, IT + EN, exactly as the APIs returned them
  categories.json             all 36 terms with descriptions and Yoast meta, both languages
  packages.json               every rental product's durations and the price each variation charges
  placement.json              which category each product went to, and why
  media.json                  every photo: WordPress id, URL, pixel size, alt text
  variation-axes.json         the varying attributes per product
  terms-page.json             the terms & conditions page
docs/catalog/media-manifest.json   file name → source URL, for `media:fetch`
docs/assets/catalog/<category>/    the photos (gitignored; fetch them, don't commit them)
packages/catalog/src/data/         the catalogue itself
```

## Re-running it

```
pnpm --filter @mia/catalog media:fetch    download the photos (~93 MB, idempotent)
pnpm catalog:sync --dry-run               validate and report, write nothing
pnpm catalog:sync                         write to the database and R2
```

## Decisions that were judgement, not data

**The taxonomy is flat and uses the shop's own names.** The site nests 34 leaf
terms under two containers, `Affitto e noleggio` and `Vendita`. Those two are
containers, not categories a product sits in, so they are not here. Every leaf
is, with its name and its slug exactly as published — including
`Vendita Carrozzine` next to `Carrozzine`, and the un-separated slug
`vendita-carrozzineelettriche`.

**One product, one category.** 18 products are filed under two or three terms on
the site. Each was placed once:

- where the site's own Yoast primary term names a leaf, that leaf won — 8988
  (Carrozzine), 12361 (Montascale), 12408 (Carrozzine), 9431 (Tens);
- for the rest the primary term is only the parent container, so the leaf
  matching the **first device the product's own title names** won — "Kinetec
  CEMP + Carrozzina" → Kinetec, "Deambulatore + Carrozzina" → Deambulatori;
- the six second-hand items sit in `Occasione Usato in Vendita` and not
  `Occasione usato`, because all six are `simple` products with a sale price and
  no hire packages at all.

`docs/catalog/source/placement.json` records the choice and the reason for all
108. Two categories therefore hold nothing: `used-deals-hire` (its six items are
the sale ones) and `electromedical-sale` (empty on the live site too). Both are
kept, because their URLs are indexed.

**Product codes.** A code is the identity and the uuid seed, and it must be
unique across the whole catalogue. Where the same machine is published twice —
once to hire, once to buy — the hire listing keeps the bare handle and the sale
twin takes `-sale`: `bariatric-wheelchair` and `bariatric-wheelchair-sale`. 22
products are affected. A product that exists only as a sale keeps the bare
handle.

**Packages are the site's variations and nothing else.** No package was added,
renamed or normalised. In particular the "Noleggio per 1 giorno: 15€ con ritiro
solamente in sede" that nine wheelchair pages advertise is **not** a package
here: it is not one of the WooCommerce variations, so it cannot be ordered
online. It stays in the short description, where the shop puts it.

Where a variation's label disagrees with what it charges, **the charged price
wins** — that is what the shop actually takes — except where the charge is zero,
which cannot be a real price. Every instance is listed below.

**English.** The site runs TranslatePress, so it already has an English copy at
`/en/`, and that is the source: it is the shop's own English, not a translation
made here. Two things were done to it.

1. Product titles, short descriptions and both meta fields were **rewritten** as
   equivalents rather than carried over, because the machine output was often
   wrong about the domain rather than merely clumsy.
2. Everything else was carried through a correction pass for mistakes of fact:
   `£` → `€` (five prices were in the wrong currency), `high chair` →
   `care chair` (a "seggiolone polifunzionale" is a tilt-in-space care chair, not
   a baby's seat — 31 occurrences), `pram`/`pushchair` → `wheelchair`,
   `Mia Medical Italy` → `Mia Medical Italia` (25 occurrences).

⚠️ **The long English descriptions are still machine translation underneath.**
The correction pass fixed errors of fact, not of grammar, and roughly 200
sentences across the catalogue carry TranslatePress's habit of doubling the
subject ("The wheelchair hire MIA Medical Italia it is a professional service")
or dropping a verb mid-sentence. They read as translated. A native pass over
`translations.en.description` is worth doing before the English storefront goes
live; the Italian, which is the language that governs, is verbatim and clean.

**Links inside descriptions** were kept but re-pointed at the new storefront's
routes, from `apps/website/src/lib/routes.ts`. `/prodotto/<slug>/` is unchanged
on both sites so those links survive untouched; the old per-category URLs have
no equivalent, so `/categoria/affitto-e-noleggio-ausili/…` became
`/catalogo-noleggio/` and `/categoria/vendita-ausili/…` became
`/catalogo-vendita/`, with the `/en/` variants mapped to their English routes.

## Source defects found

Each of these is in the data as the site has it, with a `⚠️` note in the product
file saying so. They are the shop's to fix on the live site.

### Prices

| Product | Problem | What was recorded |
|---|---|---|
| 8947 `slim-self-propelled` | The 90-day variation (13614) is priced **0 €**. Its label says 100 €, and all nine sibling chairs price 90 days at 100 €. | 100 €, from the label |
| 8853 `electric-standing-hoist` | Label "90 giorni 360 €", charges 390 € | 390 € |
| 9603 `powerpress-4` | Label "60 giorni - 240 €", charges 250 € | 250 € |
| 11090 `seated-hoist` | Label "30 giorni - 240 €", charges 260 € | 260 € |
| 9444 `kinetec-and-wheelchair` | Attribute term says "30 giorni - 290 €", charges 296 € | 296 € |
| 13504 `starlight-ultralight` | `Opzione di acquisto` attribute says 1690 €, the product price is 1490 € | 1490 €, the price a customer is charged |

### Labels and durations

| Product | Problem |
|---|---|
| 8988 `ramp` | A variation labelled **"32 giorni - 25 €"**. 25 € is every sibling's *three*-day price, and the ladder runs 7/15/30/45/60/90 around it, so the 32 is near-certainly a typo for 3. Recorded as 32. |
| 12321 `pediatric-wheelchair` | Label "45 giorni 65 - €" — the euro sign has slipped past the number. The charge, 65 €, is right. |

### Broken HTML in the source descriptions

WordPress's editor left unbalanced markup in eight products' descriptions. This is
the one defect class that was **repaired rather than recorded**: malformed markup has
no faithful reading — the shop's intent is unambiguous in each case, and reproducing
the breakage would corrupt whatever the storefront renders after it. Every repair only
balances tags; not one word of copy changed.

| Product | What the source has | Repair |
|---|---|---|
| 8793 `padded-commode-chair` | The Vermeiren dimensions table is truncated mid-row and spans 37 array entries, using `</p>` where `</td>` belongs and never closing `td`/`tr`/`tbody`/`table`/`figure`. | Rewritten as one well-formed table carrying the same 12 diagram images and the same 12 values (820, 950, 560, 420, 528, 420, 375, 226, 1530, 5 l, 13, 120). |
| 9486 `walker-wheelchair-and-bed` | `<figure><table>…</table>` with no `</figure>` | `</figure>` added |
| 9699 `high-cure-90` | same | `</figure>` added |
| 9030 `high-risk-mattress` | same | `</figure>` added |
| 15557 `easystep-wheelchair-stairlift` | `<blockquote><p>…</p>` with no `</blockquote>` | `</blockquote>` added |
| 8852 `boom-hoist` | same | `</blockquote>` added |
| 12347 `soft-bath-hoist` | same | `</blockquote>` added |
| 14188 `globus-premium-400-sale` | Tags shifted by one: the two "Come funziona" bodies open `<h4>` and close `</p>`, while the `EMS` and `IONOFORESI` headings open `<p>` and close `</h4>`. | Restored to the pattern the same description uses correctly for `IONOFORESI`'s body and `MICROCORRENTI`'s heading |

Unbalanced markup is now checked, not trusted: all 496 rich-text fields in the
catalogue parse with every container closed.

Consequence while it was unfixed: the truncated table in 8793 swallowed every later
page into a zero-width `<td>`, because the preview renders all 143 pages as siblings
in one document. 65 of them rendered blank — every page from `wheelchairs-sale`
onward, which is the page right after the broken one.

### Images hotlinked from a manufacturer

8793 `padded-commode-chair` and 12321 `pediatric-wheelchair` embed 12 dimension
diagrams each, served from `www.vermeiren.it`. Nothing was re-hosted — the refs are
left exactly as the shop wrote them — but they are a third-party dependency inside our
own product copy, and they are the only images in the catalogue that need the network.

### Figures that contradict each other

| Product | Problem | What was recorded |
|---|---|---|
| 8842 `electric-bed-90` | Prose says 212 cm long and 30–80 cm high; the attribute table says 210 cm and 30–70 cm. Its `Maximum capacity` attribute lists **eight** values (100/115/120/130/150/180/200/250 kg) — the shop's global term list showing through. | The prose, which is what a customer sees: 212 cm, 30–80 cm, 130 kg patient / 180 kg safe working load |
| 8853 `electric-standing-hoist` | Attribute table 180 kg, prose 200 kg | 180 kg — the lower, because a load limit is a safety figure |
| 14542 / 14602 Superwheel | **Both** pages carry both figures, swapped: the hire page's selling point says 150 kg and its spec block says 135 kg, while the sale page's selling point says 135 kg and its spec block says 150 kg | Each takes its own spec block: 135 kg on hire, 150 kg on sale. One machine, two ratings — the shop needs to settle which |
| 15557 / 15569 Easystep wheelchair climber | Hire page 160 kg ("una delle più alte della categoria"), sale page 200 kg | Each carries its own page's figure |
| 15094 `fantastica-electric` | Opening paragraph "soli 16 kg senza batteria", bullet beneath "appena 18 kg", spec list "Peso: 18 kg" | 18 kg, from the spec list. Both sentences stay in the description. |
| 8801 `fantastica-power-smart` | `Maximum capacity` attribute lists 130 Kg and 150 Kg | 130 kg, the lower |
| 9085 `aluminium-rollator` | `Seating height` attribute lists four values at once (45-50, 49-50, 53, 54 cm) — the global term list again | 54 cm, which its own `Altezza sedile da terra` row states |
| 14363 / 14371 used Fantastica | One page says 16 kg without the battery, its sibling says 18 kg | Each carries its own page's figure |
| 9085 `aluminium-rollator` | Attribute table says 150 kg; the page's own selling points say 136 kg, and so does the sale twin (8996) | 136 kg — the lower, and the corroborated one |
| 8842 `electric-bed-90` | Attribute `Superficie per degenza` says 195 × 90 cm; the prose says "Superficie netta 195×95 cm" | 195 × 95 cm, from the prose |
| 8793 `padded-commode-chair` | Its `Maximum capacity` attribute says **100 kg**; the Vermeiren dimensions table embedded in its own description says users weight **120 kg** — and those diagrams are captioned "Toilet chair wheels", a different model from the one being sold. | 100 kg, from the shop's own attribute table |

### Duplicate listings

| Products | Problem |
|---|---|
| 9603 and 12141 | The **same pressotherapy machine listed twice**, same name, same accessories. 15- and 30-day prices match; the 60-day is 250 € on one and 240 € on the other. Both carried. |
| 12465 and 13274 | The **same Cryopush listed twice**, with different package ladders — 15/20/30 days at 150/190/260 € against 10/20/30 days at 160/280/360 €. Both carried. |
| 8988 and 12361 | The long ramp and the "short" one print **identical figures** — 91 × 73 cm, 7 kg, 272 kg. The copy is duplicated on the live site. |

### Copy that does not match its product

| Product | Problem |
|---|---|
| 14723 `therapist-150-plus-sale` | Its Yoast description is the **hire** listing's, word for word: "da soli 2,90€ al giorno. Trasporto gratuito. Nessun Deposito" — on a page that sells the device outright. |
| `magnetotherapy-sale` category | Description says "Acquista subito i dispositivi a partire da € 1.490"; its two products are 499 € and 650 €. |
| `tens-sale` category | Description says "a partire da € 249"; its one product is 379 €. |
| 8801 `fantastica-power-smart` | Its attribute table carries a `COSTO` row of **rental** prices ("7 GG 70€ - 15 GG 130€ - 30 GG 240€ - 45 GG - 350€") on a page that sells outright. Not recorded as packages: the product is `pricingMode: 'fixed'`, which is what the site sells it as. |
| 14191 `globus-medisound-3000` | Its category says "a partire da 4,60 € al giorno", its own page says "4,00 Euro al giorno". |
| 15102 / 15569 | Their EN titles come out as "Motorised Crawler Chair" — TranslatePress reading *cingoli* (tracks) as *crawler*. Corrected in the English written here. |

### Products with no category on the live site

| Product | Filed under | Why |
|---|---|---|
| 15839 Vendita Carrozzina SLIM da transito | `wheelchairs-sale` | No `product_cat` term at all; placed from its title |
| 15650 Vendita Scooter Elettrico Maximo | `mobility-scooters-sale` | No term at all; placed from its title |
| 8801 Fantastica Power Smart | `electric-wheelchairs-sale` | Only the `Vendita` container, no leaf |

### Out of stock

Five products are out of stock on the live site and carry `stock: 0`: 8801,
14363, 14380, 14386, 14395. Two of the three used Tommy scooters and two of the
three used Fantasticas are gone.

## What the schema cannot hold

These are real facts on the live site with nowhere to go in
`packages/db/src/schema/catalog.ts`. Each survives in the product's copy, but
nothing can query or total it.

**A deposit amount.** `categories.requiresDeposit` is a category-wide boolean.
The live deposits are per product and differ: **300 €** on both seggioloni, on
the S19, Deluxe and One scooters and on the Fantastica chair; **400 €** on the
Maximo scooter and the Superwheel chair; nothing at all on the wheelchairs, the
walkers, the beds, the hoists or any combined package. `requiresDeposit` is
therefore `true` only on `electric-wheelchairs-and-scooters-hire`, where every
one of the six products takes one. In `wheelchairs-hire` it is `false` even
though the two seggioloni take 300 €, because setting it would put a deposit on
all eleven products. **A per-product `deposit` column would fix this.**

**An extra that cannot be declined.** Add-ons are always optional, by design,
and rightly so. But two hire products require the electrode pack — WooCommerce
makes it a second variation axis, so a 10-day hire of 9455 listed at 110 €
charges 118 € or 123 €. They are modelled as two add-ons carrying the 8 € and
13 € difference, which makes the total right when a customer picks one, but the
site's *compulsion* is lost. The two pressure-relief mattresses have the same
problem with their 150 € mattress protector, which their pages require for
hygiene.

**A minimum hire period.** `kinetec-and-wheelchair` states "Periodo minimo di
noleggio: 15 giorni". Its shortest package is 15 days, so the effect holds by
accident rather than by constraint.

**Free delivery above a threshold.** Fourteen products offer free delivery on
hires over 30, 45 or 60 days. The delivery add-on has one price and no
condition, so the threshold lives only in the copy.

## How accurate is it

Measured, not asserted. The authored catalogue was dumped back to JSON and
diffed field by field against `docs/catalog/source/`.

**The Italian is verifiably 1:1.** Out of 108 products:

| Field | Exact match |
|---|---|
| `title` | 108 / 108 |
| `slug` | 108 / 108 |
| `metaTitle` | 108 / 108 |
| `metaDescription` | 108 / 108 |
| `basePrice` / `pricingMode` | 108 / 108 |
| Packages — every duration and price | 108 / 108 |
| Photo count per product | 108 / 108 |
| `description` — no word lost | 104 / 108 |
| `shortDescription` | 105 / 108 |

The four description differences are the `www.miamedicalitalia.it` and `https`
tokens dropped when absolute links became relative — deliberate. The three
short-description differences are the three that exceeded the schema's 500-char
cap and were trimmed at a sentence boundary; each is named in the product file.

**Specs: 404 of 404 numeric values trace to a literal figure printed on that
product's own page.** Not a sibling's page, not a category's — its own. Across
all types, 608 of 622 checkable values trace mechanically; the remaining 14 were
checked by hand, 13 of them correct with wording the checker's patterns missed
("Entrambi removibili", "rollator con seduta", "trattamento simultaneo di due
zone"). The 101 `single_select` values are word-judgements rather than literals —
"autospinta" → `self-propelled` — and were read one by one.

That pass caught five real over-claims, since fixed:

| Product | Was | The page actually says |
|---|---|---|
| `underarm-walker` | `foldable` | "struttura in acciaio **smontabile**" — it comes apart, it does not fold. Now `dismountable`. |
| `superwheel-electric` (both) | `removable-armrests` | "braccioli **regolabili**" — adjustable, not removable |
| `deluxe-folding-scooter` (both) | `removable-armrests` | "**Braccioli integrati**" — the opposite |
| `albatros-2` (both) | `includes-sling` | neither page mentions a sling |

One spec is knowingly weak and says so in its file:
`ultralight-aluminium-walker-sale`'s `has-seat` comes from the shop's Yoast
description, not from the page body.

**The English is the weak half.** Titles and meta are authored equivalents —
105/108 titles, 103/108 meta titles and 108/108 meta descriptions were rewritten
rather than carried; the 67 short descriptions kept verbatim were already sound.
The long descriptions are still the site's machine translation with errors of
fact corrected, and across ~2,200 sentences the residual roughness measures:

| | |
|---|---|
| Doubled subject ("… **it is** a professional service") | 60 hits in 41 products |
| Sentence starting lower-case | 11 hits in 10 products |
| Half-translated Italian word | 3 remaining, all inside link text the site itself left as a URL |
| Wrong currency, "high chair", "pram" | 0 |

So: **treat the Italian, the prices, the packages and the specs as production
data. Treat `translations.en.description` as a good draft that still needs a
native reader.** Everything else in English is written.

## Before this can be written to the database

`pnpm catalog:sync --dry-run` reports:

```
validation           every value passes the API schemas
42 conflicts with rows already in the database
```

The first line is the catalogue: all 34 categories, all 108 products, all 283
packages, all 355 photos — every value passes. The second line is **database
state, not data**. The local database still holds a previous import of 107
products whose Italian slugs are the live site's, under different uuids; 42 of
those slugs are claimed by this catalogue too, and a slug is unique per
language, so the write would break the index halfway through.

The old rows have to go first. That is a destructive change to the database and
is deliberately left for you to run:

```
# check what is there
psql "$DATABASE_URL" -c 'select count(*) from products'

# clear the previous import, then write this one
psql "$DATABASE_URL" -c 'truncate products, categories, terms_documents cascade'
pnpm catalog:sync
```

Confirm nothing else depends on those rows before truncating — orders reference
products.
