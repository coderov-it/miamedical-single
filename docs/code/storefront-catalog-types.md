# Product types — the catalogue's top layer

The strip of tiles across the top of `/catalogo/` ("Muoversi", "Letto e
riposo", …) and the row of pills that opens under a selected one. Ported from
the owner's reference site, measured 2026-09-05.

**A type is a static set of category codes and nothing else.** No table, no
endpoint, no id. `apps/website/src/lib/product-types.ts` holds the whole
mechanism:

```
Muoversi                                    ← catalog.type.move
├── Carrozzine                              ← catalog.group.wheelchairs
│     carrozzine · wheelchairs-hire · wheelchairs-sale
└── Carrozzine elettriche e scooter         ← catalog.group.powered-wheelchairs
      carrozzine-elettriche-e-scooter · electric-wheelchairs-and-scooters-hire
      · electric-wheelchairs-sale · mobility-scooters-sale
```

Re-cutting the merchant's grouping means editing that table and adding the
matching `catalog.type.*` / `catalog.group.*` keys to both message catalogues.
`StorefrontLabelKey` is generated from `it.json`, so a type added without its
three keys fails the build rather than rendering a raw id.

## URL state

| parameter | means | example |
| --- | --- | --- |
| `type` | a product type | `/catalogo/?type=move` |
| `group` | a subdivision of that type | `/catalogo/?type=move&group=wheelchairs` |
| `category` | one category code, the old way in | `/catalogo/?category=carrozzine` |
| `q` | a typed query | `/catalogo/?q=carrozzina` |
| `stock` | `1` for "solo disponibili" | `/catalogo/?type=bed&stock=1` |
| `layout` | `list`; `grid` is the default and never written | `/catalogo/?layout=list` |

**One narrowing at a time**, decided in `readCatalogQuery` and nowhere else:

1. `q` beats `type` — search is answered by Postgres over the whole catalogue,
   and there is no honest way to run it inside a set of categories without
   reimplementing Italian stemming in the browser.
2. `type` beats `category` — the strip is on screen and the category dropdown is
   not, so the control the customer can see wins. (The dropdown is gone; the
   parameter stays for deep links from the directory tiles and the home page.)
3. `group` is read only when its `type` is, because it names nothing on its own.

A parameter that loses is dropped from the model, not merely ignored, so nothing
downstream can revive it and disagree with the page.

## Two category taxonomies at once

Every group names codes from **both**. The database still carries the eighteen
Italian-coded categories the site launched with; `packages/catalog` holds
thirty-four English-coded ones that nothing has synced yet. A code that names
nothing costs nothing — every lookup keeps only what the API returned — so the
table answers correctly today and keeps answering after the sync. Drop the
Italian half once that has run.

One deliberate re-filing: `ausili-per-la-mobilita` sits under **`daily`**, not
`move`. The four products the shop filed in it are a WC riser, a padded commode
chair, a pressure-relief cushion and a recliner. Reading its name instead of its
contents is what used to put a toilet riser under "Spostarsi" in the guided
selector, which reads this same table (`ACTIVITY_RULES` is now derived from it,
so the shortlist for "spostarsi" and the listing behind the "Muoversi" tile can
no longer answer differently).

## Where the products come from

`/api/products` filters by **one** category at a time, and a type is several. So
the catalogue page answers every narrowing except `q` out of the whole catalogue
it already caches:

```
cached('catalog:products:<sort>:<locale>')      ← listAllProducts({ sort })
  → onPricingSurface(mode)                      ← /catalogo-noleggio/ etc.
    → filter inStock                            ← stock=1
      → selectProducts(type slugs)              ← ?type=
        → selectProducts(group slugs)           ← &group=
          → slice(page)
```

The filters only ever **remove** rows, so the API stays the authority on order
and every sort option keeps working — which matters, because "i più richiesti"
and "più recenti" rank on `order_count` and `created_at`, and the product
summaries on the wire carry neither.

The read is keyed by sort as well as locale. The home page and the guided
selector hold their own key, so this is one more list of ~110 summaries in
memory, paid once every four minutes rather than once per visitor.

## Counts

Group pill counts come from the products the page has already selected, never
from `category.summary.productCount` — that counts both pricing modes, so it
would offer "Sollevatori 5" beside a sale listing holding two of them. Same rule
drops an empty group instead of linking it, and drops a type the current surface
cannot answer at all (`daily` and `used` have no rentals, so neither tile
appears on `/catalogo-noleggio/`).

A type whose subdivisions collapse to one stocked group shows no pill row: a row
of one pill restates the tile above it.

## Known gap

`listAllProducts` walks pages, and `sort=newest` orders by `created_at` with no
tiebreak. The catalogue was seeded in bulk, so rows sharing a timestamp move
between page 1 and page 2 — 107 products come back as 101 unique plus 6 repeats.
The walk de-duplicates, so nothing renders twice, but the rows the repeats
displaced are still missing on that one sort. The fix is an id tiebreak in
`apps/server/src/modules/products/catalog/repo.ts` → `orderBy`. Every other sort
walks cleanly, and `popular` is the catalogue's default.
