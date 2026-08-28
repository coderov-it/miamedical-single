# WordPress/WooCommerce → PostgreSQL migration

Covers `apps/server/script/wp-migrate/`:

```
extract.ts          MySQL → JSON chunks
load.ts             the plan: flags, chunks, scope, order
load/validate.ts    every check, against the real API schemas
load/rows.ts        the row writes, phase by phase
load/media.ts       the two phases that touch R2
load/progress.ts    what it prints, and how wide it runs
```

## Shape

```
MySQL (WordPress + WooCommerce)
      │
      │  pnpm --filter @mia/server wp:extract
      ▼
docs/migration/wp/*.json          ← REVIEW / EDIT HERE (git-ignored)
      │
      │  pnpm --filter @mia/server wp:load -- --dry-run --skip-media
      │  pnpm --filter @mia/server wp:load -- --truncate
      ▼
PostgreSQL + Cloudflare R2
```

Two phases with a human checkpoint, because too much of the source needs a decision:
no product has a stock count, three rental rates are unparseable prose, specs are
inferred from
free text, and six products sit in both the rental and sale trees while `products` allows
one category and one mode.

`extract` writes nothing but JSON. `load` writes nothing that has not validated against the
real API schemas first.

## Running it

```bash
# 1. extract (read-only on MySQL)
WP_MYSQL_PASSWORD='…' pnpm --filter @mia/server wp:extract

# 2. read this first
$EDITOR docs/migration/wp/report.json

# 3. validate the chunks without writing
pnpm --filter @mia/server wp:load -- --dry-run --skip-media

# 4. load rows only, then media on a second pass
pnpm --filter @mia/server wp:load -- --truncate --skip-media
pnpm --filter @mia/server wp:load
```

Connection comes from `WP_MYSQL_*` in the environment (see `.env.example`), read straight
from `process.env` rather than the app's env schema — nothing in the running server touches
MySQL, so it has no business in `config/env.ts`.

Flags: `--dry-run` validates and prints planned counts; `--skip-media` writes rows without
downloading; `--truncate` clears the catalog and orders first, **keeping `admin_users` and
`admin_sessions`** so the admin login survives; `--only-categories=<code[,code]>` loads one
category and nothing else.

### One category at a time

The catalog goes live per category, not in one 98-product drop — fifteen wheelchairs whose
specs and packages have actually been read beat a full catalog nobody has checked:

```bash
pnpm --filter @mia/server wp:load -- --only-categories=carrozzine --dry-run
```

The filter is applied to every chunk **before** validation, not during the writes. So a
scoped run validates exactly the rows it will write, its dry-run counts are the real ones,
and an out-of-scope product cannot fail the run for a category nobody is loading yet.
Cascade: category → its specs → its products → their spec values, media and
addons. An unknown code is a hard exit with the list of known ones — a typo must not
quietly load nothing.

Addons are the one non-obvious edge: an addon bound to products on both sides of the filter
keeps only the in-scope bindings, one that loses all of them drops out, and one that arrived
with none stays — that last group is the YITH backlog the run is meant to keep reporting.

## Latency, not hanging

Against a remote database every statement is a round trip — 274 ms to the dev box — and a
full load is about 1,300 of them. Run serially that is thirteen minutes, and the loader used
to print one line per phase _after_ the phase finished, so it read as a hung process. It was
not; it was waiting.

Two changes, both in `load/progress.ts`:

- **`runPhase` spends the latency in parallel.** Writes inside a phase run 10 at a time,
  matched to `createDatabase`'s default pool. Safe because every id is a UUIDv5 fixed by
  `ids.ts` and every write is an upsert on it, so items in a phase are independent and order
  cannot matter. Phases stay sequential — each points at the one before it.
- **It says where it is.** An interim line at most once a second during row phases, and one
  line per object during the media phases, where each item is seconds of network rather than
  milliseconds:

```
spec_values          180/430
spec_values          430

media                291 objects to check in R2
media  [ 38/291] up     products/8f2…/12524-Cuscino.webp  142 KB  1.2s
media  [ 39/291] reuse  products/8f2…/12518-Rialzo.webp
```

Full catalog, rows only, against a local database: 2.5 s for the same 1,300 statements.

An interrupted media pass is resumed by re-running **without** `--truncate` — `head()` finds
every object already uploaded, so the run picks up where it stopped.

## Idempotency

Every id is a UUIDv5 of the WordPress row (`ids.ts`), not `defaultRandom()`. Three things
depend on that:

- chunks cross-reference each other before anything is written;
- R2 keys are stable, so a re-run does not orphan a bucket of uploads under a new id;
- `load` uses `onConflictDoUpdate` throughout, so a second run updates instead of
  duplicating. Edit a chunk, re-run, only what changed changes.

Verified: two consecutive loads produce identical row counts.

`pricing_mode` is deliberately absent from every `SET` list — it is write-once everywhere
else in the codebase, and a re-run must not flip a product's mode underneath the addons
already priced against it.

## The chunks

| File                     | Rows       | What it holds                                                     |
| ------------------------ | ---------- | ----------------------------------------------------------------- |
| `01-categories.json`     | 17         | leaf `product_cat` terms → `categories` + `category_translations` |
| `02-category-specs.json` | 217        | inferred spec definitions, with the reason for each shape         |
| `03-products.json`       | 98         | products, Italian translation, **`rentalPackages`**               |
| `04-product-specs.json`  | 430        | coerced spec values, each keeping its `rawValue`                  |
| `06-media.json`          | 291        | download manifest: source URL → role                              |
| `07-addons.json`         | 8          | priced extras                                                     |
| `report.json`            | 99 entries | **every judgement call and every dropped row**                    |

`report.json` is the point of the whole split. Read it before loading.

## Mapping decisions

### Pricing mode comes from the tree, not a column

WooCommerce has two roots: _Affitto e noleggio_ (260) and _Vendita_ (261). The new
`categories` table is flat and has no `parentId`, so the roots do not survive as
categories — they survive as `products.pricing_mode`, which is all they ever encoded. The
18 leaves become 17 categories — see the naming rule below.

### A category is named for the thing, never for how it is sold

WooCommerce put the commercial arrangement in the name and in the URL of every leaf. That is
the one thing `pricing_mode` already carries, so it comes off both:

```
term 68   name "Carrozzine"                  slug "affitto-e-noleggio-carrozzina"
          →  name "Carrozzine"               code/slug "carrozzine"

term 20   name "Vendita Ausili per la mobilità"
          →  name "Ausili per la mobilità"   code/slug "ausili-per-la-mobilita"

term 440  name "Occasione Usato in Vendita"
          →  name "Occasione usato"          MERGED into term 93's category
```

`code` and `slug` follow the cleaned name, never `wp_terms.slug` — `stripSalesMode()` in
`mapping.ts` does the stripping, and every rename lands in `report.json` with the URL
WordPress served it at, so a redirect can be written later if that URL is worth keeping.

The merge is the point of doing this at the name and not just the slug: _Occasione usato_
existed twice, once per tree, and those are not two product families. They become one
category whose products carry their own `pricing_mode` — 6 second-hand products, all
`fixed`. 18 leaves, 17 categories.

Six products sit in both trees (the _Occasione usato_ second-hand items). The tie-break is
whether the product actually sells rental periods: duration tiers → rental, otherwise
fixed. All six resolved to fixed and are flagged `needsReview: ["pricingMode","categoryId"]`.

### Rental packages are copied, never computed

WooCommerce encodes a rental as variation attributes whose label carries the period:
`attribute_quanto-costa = "15 giorni 120 €"`. Each becomes one `RentalPackage`.

Only the **duration** is parsed from the label. The price comes from the variation's own
`_price`, which is authoritative — the number in the label is decorative and inconsistently
formatted (`"100€"`, `"100 €"`, `"- 100 €"`).

Nothing derives a discount. A package price is a total the shop set; whether it beats the
advertised daily rate is a business fact, not a computation — and since packages became the
ONLY way a rental is priced, there is no per-day rate for it to be measured against.

`marketingRate` for a rental is the ACF `prodotto_prezzo_a_partire_da` (`"1,11€ al giorno"`
→ `1.11`), which is the rate the old site advertised. It stays display copy: a rental's
`basePrice` is NULL and its packages are its price. Results: 58 products with packages,
3–7 packages each, 278 in total, none over the 15 cap — and, checked against the extract,
all 58 rentals have at least one, which `products_rental_packages_check` now requires. A
future extract that produced a package-less rental would fail loudly at
`check(RentalPackagesSchema, …)` in the loader rather than reaching the database.

### Duration vs. a real product option

`parseDuration()` returning null _is_ the discriminator — no list of attribute names to
maintain:

```
"15 giorni 120 €"                → duration  → rental package
"Doppia batteria - 320€"         → null      → product option
"Conf. 4 pz 5cm x 5cm - 8€"      → null      → product option
```

A product option becomes `product_addons` in fixed mode, in **either** mode of the parent
product. _"Acquista gli elettrodi"_ is an extra you add to what you came for, priced once —
not an axis of the thing itself. A product has no configurable axes (one product is one
stock-keeping unit), and the schema explicitly permits a fixed addon on a rental product as
well as a fixed one.

This used to split by mode: a fixed product's options became a `single_select`
variant group whose cheapest label set `basePrice`, and only a rental product's became
addons. Variants are gone, so both sides now land the same way.
The cheapest label still sets `basePrice` on a fixed product, so the figure the old shop
showed is preserved.

Two products carry a duration **and** an option on the same variation. There, `_price` is
the combined total, so the option's price is read from its own label
(`parsePriceFromLabel`) and the tier is recorded once. Those variations also repeat every
option once per tier — ten rows for two real choices — so options are deduplicated by value
before emission.

### Specs: curated first, attributes second

Per the project rule, a spec is either comparable or filterable, and the closest
specification for the category wins.

1. **`wp_mia_compare_excel_*`** — hand-built for comparison, clean Italian labels. Its nine
   groups map to categories through an explicit table in `mapping.ts`, written out rather
   than fuzzy-matched: nine groups, eighteen categories, not one-to-one, and a wrong silent
   match would attach bed specs to wheelchairs. These become `is_comparable` specs (159).
2. **WooCommerce attributes** fill the rest (58). Local ones carry proper Italian labels
   inline in `_product_attributes`; taxonomy ones only have English machine names.

The curated tables describe _models_ ("Fantastica", "1 Piazza (90 CM)"), not posts, so
their values reach a product by matching every model token against the product title. This
is the least certain step in the migration and every match, miss and over-broad match is in
the report.

`valueType` is inferred from a spec's whole column, preferring shapes that keep filtering
honest — `boolean` and `number` are index-backed and lossless where they apply, a small
closed set becomes a facet, everything else stays text and simply does not filter. A spec
whose values use mixed units falls back to text rather than pretending to be comparable.
Result: 21 boolean, 47 number, 24 single_select, 6 number_range, 119 string; 92 filterable.

### Stock

There is no SKU anywhere in the model — not on a product, not on an add-on, not on an
order line. WooCommerce had none either (every `_sku` was empty), so nothing was lost in
dropping the concept; a product is named by its title and identified by its id.

Stock comes from `_stock`, but only where `_manage_stock` is `yes`. WooCommerce keeps no
count on anything else — it reports availability through `_stock_status` — so an unmanaged
product lands at `0` and is flagged in `needsReview`. "We never counted these" and "there
are none left" must not look the same to whoever reviews the import, and `0` is the safe
default of the two: the storefront refuses to sell it until someone types a real figure.

### Text and language

Product descriptions are Gutenberg block HTML (~6.5 KB average). Block comments
(`<!-- wp:… -->`) are stripped and the markup kept. `post_excerpt` → `shortDescription`,
Yoast fields → `metaTitle` / `metaDescription`.

Italian only: every TranslatePress dictionary table in the dump is empty, so there is no
English to migrate. Translation rows are written for `it`; `en` is left absent and the
existing `en → it` fallback covers it. `search_vector` is written through
`searchVectorFor()` — never by hand.

### Category images

A `categories` row has exactly one image, `icon` — an R2 key holding a 256×256 WebP.
WooCommerce keeps the same thing in `wp_termmeta.thumbnail_id`, so that is where it comes
from, and the walk is:

```
wp_termmeta       term 68 → thumbnail_id 12260
wp_posts/postmeta 12260   → 2024/05/carrozzina-slim-MIA-MEDICAL-ITALIA-…jpg   (1000×1000)
extract           01-categories.json  iconSource: { wpAttachmentId, url, mimeType, alt }
load              toWebp(bytes, { square: true, edge: 256 })
R2                categories/21a7ea8a-eb71-52de-ab8f-1db901e077a0/icon-12260.webp
categories.icon   = that key
```

Same scope and same geometry the admin's own uploader commits, so a migrated icon and a
hand-uploaded one are indistinguishable afterwards. SVG is stored byte-for-byte, per
`icon_256`. Anything over the profile's `maxBytes` is left unset rather than written — the
admin could not have uploaded it, so neither does this.

17 of the 17 categories have a thumbnail; both wheelchair sources happen to be square
already (1000×1000 and 1200×1200), so the 256 is a clean downscale with nothing cropped.
A term without one keeps `icon: null`, and the home page falls back to the category's first
product image (`home-content.ts`) — the reason a missing icon is a note in `report.json`
rather than a failure.

### Media

Files are not in the dump, but the live site still serves them. The loader downloads each
referenced file, converts images through the same `SharpImageConverter` the upload route
uses, and stores them at `products/<uuid>/<attachmentId>-<name>.webp`. PDFs and MP4s pass
through untouched, per `MEDIA_PROFILES`.

`head()` runs before every upload, so a re-run costs one HEAD per object instead of a fresh
download. 291 objects across 96 thumbnails and 195 gallery images.

Note: very small, already-compressed JPEGs can grow slightly as WebP at q95. That is the
project's existing "visually lossless" choice, not a migration artefact.

Two of the wheelchair JPEGs decode with `"38 extraneous bytes before marker 0xc0"`, which
libvips fails on by default. `SharpImageConverter` therefore opens every image with
`failOn: 'truncated'`: a recoverable defect in real catalogue photography must not cost a
product photo, while genuinely truncated data still throws. It is a decode policy for the
whole app, admin uploads included — an admin should not be blocked by a byte of padding
either.

## PHP deserialization

`phpUnserialize()` parses over a **Buffer with byte offsets**, not a JS string, because
`s:N:"…"` counts N in bytes. This meta is full of `à`, `°` and `€` at 2–3 bytes each; a
character-indexed parser desynchronises on the first accent and produces silent garbage
from there on. Objects (`O:`) throw rather than being half-supported — none appear in the
meta this migration reads.

## Not migrated

No home in the schema, and outside the agreed scope: 56 blog posts, 16 pages, 109
`provincia` entries, 7 `mia_policy` documents. WooCommerce has zero orders and zero
customers, so there is nothing to migrate there.

## Known caveats

- The three YITH addons were global in WooCommerce, bound to no product. They come through
  with `productIds: []` and are **skipped on load** until filled in.
- Product 15101 (_Vendita Carrozzina Elettrica "Passe-partout"_) has no `product_cat` under
  either root and is skipped. It is a real product — give it a category in WordPress and
  re-extract, or add it by hand.
- Product 12590 is a plugin artefact (_"Sold Individually -- YITH WooCommerce…"_) that
  acquired a product category. It arrives at `0.00` and should probably be deleted.
- One product's `basePrice` is taken from its cheapest option rather than WooCommerce's
  `_price`, because one "option" is a spare battery rather than a configuration. Flagged.
