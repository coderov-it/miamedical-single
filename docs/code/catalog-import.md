# Catalogue import

Hand-written JSON in `docs/catalog/` → PostgreSQL and R2.
Code lives in `apps/server/script/catalog/`, entry point `import.ts`.

```
pnpm catalog:import -- --dry-run          validate and report, write nothing
pnpm catalog:import                       write rows, then upload media
pnpm catalog:import -- --skip-media       rows only
pnpm catalog:import -- --only=carrozzine  one file and nothing else
```

## The smallest file that works

`docs/catalog/carrozzine.json`:

```json
{
  "code": "carrozzine",
  "name": { "it": "Carrozzine" },
  "products": [
    {
      "code": "carrozzina-da-transito",
      "pricingMode": "rental",
      "rentalUnit": "day",
      "rentalPackages": [
        {
          "code": "7-giorni",
          "name": { "it": "7 giorni" },
          "price": "39.00",
          "duration": 7,
          "unit": "day"
        }
      ],
      "title": { "it": "Carrozzina da transito" }
    }
  ]
}
```

`pnpm catalog:import` on that file writes:

```
categories              1   code carrozzine, id 8f2c… (a uuid5 of "category:carrozzine")
category_translations   1   it · name "Carrozzine" · slug "carrozzine" (derived from the name)
products                1   id 4b91… (uuid5 of "product:carrozzina-da-transito"), status draft
product_translations    1   it · title + slug "carrozzina-da-transito" · search_vector
```

Two slugs were invented, so the run says so before it writes:

```
slugs derived        2 not pinned in a file:
  carrozzine (it) → carrozzine
  carrozzina-da-transito (it) → carrozzina-da-transito
```

Run it a second time unchanged and the same four rows are updated in place —
nothing is duplicated. That is the whole point of `code`, below.

## `code` is identity, `slug` is a URL

Every id is a UUIDv5 of the `code` (`ids.ts`), so the code is what makes a
re-run an UPDATE. It is deliberately not the slug: a slug is public and gets
rewritten for SEO, and rewriting one must never mint a second product.

- **Rename a `code`** and the next run creates a NEW row and leaves the old one
  behind. Don't, unless that is what you meant.
- **Rename a `slug`** and the same row keeps its identity and changes its URL.
- A category or product that already exists in the database under a different
  id (anything the WordPress migration loaded) collides on `categories.code` or
  on `(language_code, slug)`. The run stops before writing anything and prints
  the id to adopt:

  ```
  carrozzine.json › category "carrozzine": the database already has this code on
  21a7ea8a-…. Add "id": "21a7ea8a-…" to adopt that row, or change the code.
  ```

## What a run deletes

The files are the source of truth for the lists inside them, so a row you take
out of a file is taken out of the database:

| Reconciled (deleted when absent)                  | Never deleted |
| ------------------------------------------------- | ------------- |
| category specs, spec options                      | categories    |
| product spec values, spec-value options           | products      |
| add-ons, FAQs, intake questions, question options |               |
| the whole `products.media` blob                   |               |

Categories and products stay because an order line points at a product — a run
reports the ones no file mentions and leaves them alone:

```
orphans              1 in the database, in no file — NOT deleted:
  carrozzine: "Carrozzina elettrica" (0c7f…) is in the database but in no file
```

Deleting a spec cascades to every product's value for it. `--dry-run` reports
the counts first; there is no undo.

## Spec values

A product names its specs by the category's `key`, and the declared `valueType`
decides which column the value lands in:

| `valueType`     | write this                                    | lands in                             |
| --------------- | --------------------------------------------- | ------------------------------------ |
| `number`        | `45`                                          | `number_value`                       |
| `number_range`  | `{ "min": 14, "max": 16 }`                    | `number_min` / `number_max`          |
| `number_range`  | `15`                                          | `number_value` (single reading)      |
| `boolean`       | `true`                                        | `boolean_value`                      |
| `string`        | `"Nero"` or `{ "it": "Nero", "en": "Black" }` | `text_value` jsonb                   |
| `single_select` | `"aluminium"`                                 | one `product_spec_value_options` row |
| `multi_select`  | `["aluminium", "steel"]`                      | one row per value                    |

A key the category does not declare, or a select value the spec does not list,
fails validation and names both the key and what was available. A spec marked
`isRequired` that a product omits fails too.

Spec keys and select values are machine tokens and stay untranslated —
`seat-width`, not `larghezza-seduta`; the human-readable half is `label`.

## Media

Files live under `docs/assets/catalog/<category-code>/` and are named by file
name alone. A ref containing a `/` is taken from the assets root instead, so a
file shared by several categories needs no copy per category. Point the run
somewhere else entirely with `--assets=/mnt/photos` when the images are too
heavy to commit.

```json
"media": {
  "thumbnail": "carrozzina-1.jpg",
  "cleanPng": "carrozzina-scontornata.png",
  "gallery": ["carrozzina-2.jpg", { "file": "carrozzina-3.jpg", "alt": { "it": "Ripiegata" } }],
  "videos": ["demo.mp4"],
  "documents": ["scheda-tecnica.pdf"]
}
```

Images go through the same sharp encoder and the same `MEDIA_PROFILES` rules as
the admin panel's uploader: raster → WebP, product images capped at 2048px,
icons squared (256 for categories and specs, ≤1024 for add-ons). SVG is stored
byte-for-byte, video and PDF pass through after a mime and size check.

The R2 key carries a hash of the file's contents:

```
products/4b91…/1a2b3c4d-carrozzina-1.webp
         ^ product id  ^ sha256 of the source file
```

So an unchanged photo costs one `head()` and no upload on a re-run, and editing
a photo under the same file name produces a different key and really does
replace what the product shows. The superseded object stays in the bucket —
the hourly sweep only covers `_staging/`.

A file that will not encode is reported, counted, and skipped: one broken JPEG
does not cost the other ninety-seven products their import. Re-run to retry.

## Everything a file may contain

`apps/server/script/catalog/authored.ts` is the reference — every field, every
default, in one screen. `docs/catalog/_example.json` is the same thing as a
working file, exercising all seven spec types, both pricing modes, add-ons,
FAQs and intake questions. Files starting with `_` are never loaded.

Defaults worth knowing: `status` is `draft`, `stock` is `0`, `currency` is
`EUR`, `position` follows the order things appear in the file, and an English
translation row is written only when `title.en` (or `name.en`) exists —
untranslated stays untranslated rather than falling back to Italian.

## Validation

`--dry-run` checks the files against the real API schemas from `@mia/validators`
— the same contract the admin panel posts against — plus the cross-file rules a
schema cannot see: duplicate codes, two rows claiming one slug, missing image
files, an add-on whose mode its product forbids. Problems are collected, not
thrown, so one run reports every bad row in every file.

The only checks that need the database open are the identity collisions and the
orphan report (`conflicts.ts`). Everything else runs on the files alone.

## Not this pipeline

`apps/server/script/wp-migrate/` is the one-shot WordPress import and shares no
code with this. Its ids come from `wp_posts.ID`, this one's from the codes you
write, and the two namespaces are deliberately separate — which is exactly why
a category loaded by that pipeline and re-authored here collides on its code and
has to adopt the existing id.
