# WordPress/WooCommerce → PostgreSQL migration

Covers `apps/server/script/wp-migrate/`.

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
no product has a SKU, three rental rates are unparseable prose, specs are inferred from
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
downloading; `--truncate` clears the catalog and orders first, **keeping `users` and
`sessions`** so the admin login survives.

## Idempotency

Every id is a UUIDv5 of the WordPress row (`ids.ts`), not `defaultRandom()`. Three things
depend on that:

- chunks cross-reference each other before anything is written;
- R2 keys are stable, so a re-run does not orphan a bucket of uploads under a new id;
- `load` uses `onConflictDoUpdate` throughout, so a second run updates instead of
  duplicating. Edit a chunk, re-run, only what changed changes.

Verified: two consecutive loads produce identical row counts.

`pricing_mode` is deliberately absent from every `SET` list — it is write-once everywhere
else in the codebase, and a re-run must not flip a product's mode underneath the addons and
SKUs already priced against it.

## The chunks

| File | Rows | What it holds |
| --- | --- | --- |
| `01-categories.json` | 18 | leaf `product_cat` terms → `categories` + `category_translations` |
| `02-category-specs.json` | 217 | inferred spec definitions, with the reason for each shape |
| `03-products.json` | 98 | products, Italian translation, **`rentalPackages`** |
| `04-product-specs.json` | 430 | coerced spec values, each keeping its `rawValue` |
| `05-variants.json` | 1 | SKU-affecting variant groups |
| `06-media.json` | 291 | download manifest: source URL → role |
| `07-addons.json` | 7 | priced extras |
| `report.json` | 80 entries | **every judgement call and every dropped row** |

`report.json` is the point of the whole split. Read it before loading.

## Mapping decisions

### Pricing mode comes from the tree, not a column

WooCommerce has two roots: *Affitto e noleggio* (260) and *Vendita* (261). The new
`categories` table is flat and has no `parentId`, so the roots do not survive as
categories — they survive as `products.pricing_mode`, which is all they ever encoded. The
18 leaves become the category list.

Six products sit in both trees (the *Occasione usato* second-hand items). The tie-break is
whether the product actually sells rental periods: duration tiers → rental, otherwise
fixed. All six resolved to fixed and are flagged `needsReview: ["pricingMode","categoryId"]`.

### Rental packages are copied, never computed

WooCommerce encodes a rental as variation attributes whose label carries the period:
`attribute_quanto-costa = "15 giorni 120 €"`. Each becomes one `RentalPackage`.

Only the **duration** is parsed from the label. The price comes from the variation's own
`_price`, which is authoritative — the number in the label is decorative and inconsistently
formatted (`"100€"`, `"100 €"`, `"- 100 €"`).

Nothing derives a discount. A package price is a total the shop set; whether it beats the
per-day rate is a business fact, not a computation.

`basePrice` for a rental is the ACF `prodotto_prezzo_a_partire_da` (`"1,11€ al giorno"` →
`1.11`), which is the rate the old site advertised. Results: 58 products with packages,
3–7 packages each, 278 in total, none over the 15 cap.

### Duration vs. a real product option

`parseDuration()` returning null *is* the discriminator — no list of attribute names to
maintain:

```
"15 giorni 120 €"                → duration  → rental package
"Doppia batteria - 320€"         → null      → product option
"Conf. 4 pz 5cm x 5cm - 8€"      → null      → product option
```

A product option then splits by mode:

- **fixed product** → a SKU-affecting `single_select` variant group. Each label states an
  absolute price, so the cheapest becomes `basePrice` and the rest become non-negative
  modifiers. `basePrice + modifier` reproduces each option's price exactly, which is what
  `resolveSkuPrice` computes.
- **rental product** → `product_addons` in fixed mode. *"Acquista gli elettrodi"* is an
  extra you add to a rental, priced once — not an axis of the thing being rented. Modelling
  it as a variant would multiply the SKU matrix by the tier count for something the
  warehouse does not track separately, and the schema explicitly permits a fixed addon on a
  rental product.

Two products carry a duration **and** an option on the same variation. There, `_price` is
the combined total, so the option's price is read from its own label
(`parsePriceFromLabel`) and the tier is recorded once. Those variations also repeat every
option once per tier — ten rows for two real choices — so options are deduplicated by value
before emission, or `unique(group_id, value)` would reject them on load.

### Specs: curated first, attributes second

Per the project rule, a spec is either comparable or filterable, and the closest
specification for the category wins.

1. **`wp_mia_compare_excel_*`** — hand-built for comparison, clean Italian labels. Its nine
   groups map to categories through an explicit table in `mapping.ts`, written out rather
   than fuzzy-matched: nine groups, eighteen categories, not one-to-one, and a wrong silent
   match would attach bed specs to wheelchairs. These become `is_comparable` specs (159).
2. **WooCommerce attributes** fill the rest (58). Local ones carry proper Italian labels
   inline in `_product_attributes`; taxonomy ones only have English machine names.

The curated tables describe *models* ("Fantastica", "1 Piazza (90 CM)"), not posts, so
their values reach a product by matching every model token against the product title. This
is the least certain step in the migration and every match, miss and over-broad match is in
the report.

`valueType` is inferred from a spec's whole column, preferring shapes that keep filtering
honest — `boolean` and `number` are index-backed and lossless where they apply, a small
closed set becomes a facet, everything else stays text and simply does not filter. A spec
whose values use mixed units falls back to text rather than pretending to be comparable.
Result: 21 boolean, 47 number, 24 single_select, 6 number_range, 119 string; 92 filterable.

### SKUs

WooCommerce has none — every `_sku` is empty. `baseSku` is derived from the title,
uppercased, capped at 48 chars and deduplicated. The cap is applied *inside*
`skuFragment()`, because slicing afterwards is what leaves a trailing hyphen, which
`SkuFragmentSchema` rejects — a bug the dry-run caught on four products.

SKU rows are generated through the app's own `generateCombinations` / `composeSku`, so the
strings match what the admin would produce for the same groups. A product with no
SKU-affecting group gets no `product_skus` rows, matching `regenerate()`'s behaviour.

### Text and language

Product descriptions are Gutenberg block HTML (~6.5 KB average). Block comments
(`<!-- wp:… -->`) are stripped and the markup kept. `post_excerpt` → `shortDescription`,
Yoast fields → `metaTitle` / `metaDescription`.

Italian only: every TranslatePress dictionary table in the dump is empty, so there is no
English to migrate. Translation rows are written for `it`; `en` is left absent and the
existing `en → it` fallback covers it. `search_vector` is written through
`searchVectorFor()` — never by hand.

### Media

Files are not in the dump, but the live site still serves them. The loader downloads each
referenced file, converts images through the same `SharpImageConverter` the upload route
uses, and stores them at `products/<uuid>/<attachmentId>-<name>.webp`. PDFs and MP4s pass
through untouched, per `MEDIA_PROFILES`.

`head()` runs before every upload, so a re-run costs one HEAD per object instead of a fresh
download. 291 objects across 96 thumbnails and 195 gallery images.

Note: very small, already-compressed JPEGs can grow slightly as WebP at q95. That is the
project's existing "visually lossless" choice, not a migration artefact.

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
- Product 15101 (*Vendita Carrozzina Elettrica "Passe-partout"*) has no `product_cat` under
  either root and is skipped. It is a real product — give it a category in WordPress and
  re-extract, or add it by hand.
- Product 12590 is a plugin artefact (*"Sold Individually -- YITH WooCommerce…"*) that
  acquired a product category. It arrives at `0.00` and should probably be deleted.
- One product's `basePrice` is taken from its cheapest option rather than WooCommerce's
  `_price`, because one "option" is a spare battery rather than a configuration. Flagged.
