# Catalogue sync

The hand-authored catalogue in `packages/catalog/src/data/` → PostgreSQL and R2.
Code lives in `packages/catalog/src/script/sync/`, entry point `index.ts`.

```
pnpm catalog:sync --dry-run           validate and report, write nothing
pnpm catalog:sync                     write rows, then upload media
pnpm catalog:sync --skip-media        rows only
pnpm catalog:sync --only=wheelchairs  one category and nothing else
pnpm catalog:sync --assets=/mnt/pics  take the images from somewhere else
```

The source is **TypeScript values**, not files read off disk. `data/index.ts`
exports `categories` and `termsDocuments`, this script imports them, and that is
the entire read step. There is no parsing, no schema for a file format, and no
directory to point at.

That is the whole design. `pnpm check` runs `tsc --noEmit` over the package, so
a misspelled spec key, a rental product carrying a `basePrice`, a select value
the category never declared, or a `shortDesciption` are all **compile errors**,
hours before a database is involved:

```
$ pnpm check
src/data/wheelchairs/slim-transit.ts(94,5): error TS2353:
  Object literal may only specify known properties,
  and 'seat-widht' does not exist in type 'SpecsOf<{ … }>'.
```

What is left for this script is only what the compiler cannot see: string
lengths, uniqueness across the whole registry, rows already in the table, and
whether the photos exist on disk.

## The order a run goes in

```
1  plan       every value → the rows it becomes; ids derived, slugs filled
2  validate   the API schemas from @mia/validators, plus registry-wide rules
3  preflight  the two checks that need the database open  → stops on conflict
4  write      terms → categories → specs → products → details → terms links
5  media      encode, upload, patch the key onto the row
```

Steps 1–3 write nothing. `--dry-run` stops after 3 and prints the counts.

Terms documents go **first** and their product links **last**: a document has to
exist before `product_terms` can reference it, and a product has to exist before
it can sign one.

## `code` is identity, `slug` is a URL

Every id is a UUIDv5 of a hand-written `code` (`ids.ts`), so the code is what
makes a re-run an UPDATE rather than a second copy. It is deliberately not the
slug: a slug is public and gets rewritten for SEO, and rewriting one must never
mint a second product.

- **Rename a `code`** and the next run creates a NEW row and leaves the old one
  behind. Don't, unless that is what you meant.
- **Rename a `slug`** and the same row keeps its identity and changes its URL.
- A row that already exists under a different id — anything this pipeline did
  not write — collides on `categories.code`, on `terms_documents.code` or on
  `(language_code, slug)`. The run stops before writing anything:

  ```
  category "wheelchairs": the it slug "carrozzine" already belongs to
  category 21a7ea8a-eb71-52de-ab8f-1db901e077a0
  ```

  Either change the code, or clear the row. There is no `id` override: the
  authoring API has no field for one, because a catalogue whose ids come from
  two places is a catalogue that cannot be re-run.

A slug nobody pinned is derived from the title and **printed every time**, since
"it appeared in the database and nobody chose it" is how a catalogue ends up
with URLs that need a redirect to change:

```
slugs derived        15
  slim-self-propelled (en) → small-self-propelled-wheelchair-for-hire-slim
```

## What a run deletes

The data files are the source of truth for the lists inside them, so a row taken
out of a file is taken out of the database:

| Reconciled (deleted when absent)                  | Never deleted   |
| ------------------------------------------------- | --------------- |
| category specs, spec options                      | categories      |
| product spec values, spec-value options           | products        |
| add-ons, FAQs, intake questions, question options | terms documents |
| terms links (`product_terms`)                     |                 |
| terms translations                                |                 |
| the whole `products.media` blob                   |                 |

Categories and products stay because an order line points at a product — a run
reports the ones no data file mentions and leaves them alone:

```
orphans              1
  wheelchairs: "Carrozzina elettrica" (0c7f…) is in the database but in no data file
                     NOT deleted — a person decides.
```

A terms document is never deleted either: `product_terms` has
`onDelete: 'restrict'` on it, which is the schema saying the same thing.
Deleting a spec cascades to every product's value for it. `--dry-run` reports
the counts first; there is no undo.

## Spec values

A product names its specs by the category's key, and the declared `valueType`
decides which column the value lands in:

| `valueType`     | write this                     | lands in                             |
| --------------- | ------------------------------ | ------------------------------------ |
| `number`        | `45`                           | `number_value`                       |
| `number_range`  | `{ min: 14, max: 16 }`         | `number_min` / `number_max`          |
| `number_range`  | `15`                           | `number_value` (single reading)      |
| `boolean`       | `true`                         | `boolean_value`                      |
| `string`        | `'Nero'` or `{ it: …, en: … }` | `text_value` jsonb                   |
| `single_select` | `'aluminium'`                  | one `product_spec_value_options` row |
| `multi_select`  | `['aluminium', 'steel']`       | one row per value                    |

All seven are checked by the compiler where the file is written. They are
checked again here because `data/index.ts` types the registry as
`readonly Category[]` — that is `Category<SpecMap>`, so by the time this script
receives a category the literal option keys have widened back to `string`. The
runtime check is that boundary, not a second opinion about it.

**Keys are lowercase with `-` or `_`** — `seat-width`, never `seatWidth`.
`CodeSchema` in `@mia/validators` is what they are checked against, and it is
the same rule for a spec key, a question key, a package code and a category
code. Numbers pass through `parseSpecNumber`, so a fifth decimal is rejected
rather than silently rounded by `numeric(14,4)`.

## Money

Every price is written as a plain number and parsed exactly once into the string
the `numeric` column wants (`lib/money.ts`):

```
authored   parsed     column          note
90         '90.00'    numeric(12,2)
0.1        '0.10'     numeric(12,2)
20.005     REJECTED   numeric(12,2)   Postgres would have stored 20.01, silently
```

Nothing derives a total from an authored amount. A rental product's price is its
packages; `marketingRate` is display copy and no arithmetic reads it.

## Media

Files live under `docs/assets/catalog/<category-code>/` and are named by file
name alone. A ref containing a `/` is taken from the assets root instead, so a
file shared by several categories needs no copy per category. Point the run
elsewhere with `--assets=/mnt/photos` when the images are too heavy to commit.

```ts
media: {
  thumbnail: 'slim-self-propelled-1.jpg',
  gallery: [{ file: 'slim-self-propelled-2.jpg', alt: { it: 'Vista posteriore' } }],
  documents: ['scheda-tecnica.pdf'],
}
```

Images go through the same sharp encoder and the same `MEDIA_PROFILES` rules as
the admin panel's uploader — both call `@mia/media`, which exists so the two
cannot drift. Raster → WebP, product images capped at 2048px, icons squared (256
for categories and specs, ≤1024 for add-ons). SVG is stored byte-for-byte; video
and PDF pass through after a mime and size check.

The R2 key carries a hash of the file's contents:

```
products/4b91…/1a2b3c4d-slim-self-propelled-1.webp
         ^ product id  ^ sha256 of the source file
```

So an unchanged photo costs one `head()` and no upload on a re-run, and editing
a photo under the same file name produces a different key and really does
replace what the product shows. The superseded object stays in the bucket — the
hourly sweep only covers `_staging/`.

A file that will not encode is reported, counted and skipped: one broken JPEG
must not cost the other ninety-seven products their sync. Re-run to retry.

## Terms documents

A terms document is a row two products may both point at, never a field either
of them owns. `defineTerms` returns a branded value, `data/index.ts` lists it in
`termsDocuments`, and a product names it in `terms`:

```ts
export const generalRental = defineTerms({ code: 'general-rental', … });

export const slimSelfPropelled = wheelchairs.rental({
  terms: [generalRental],
  …
});
```

A product signing a document the registry does not list is a validation failure,
because an unlisted document has no row and `product_terms` would fail its
foreign key mid-write.

`publishedAt` is stamped the first time a document is written as `published` and
never moved after. It is when those conditions took effect — the date a dispute
turns on — so a re-run must not quietly restamp it to today.

## Validation

`--dry-run` checks the plan against the real API schemas from `@mia/validators`
— the same contract the admin panel posts against — plus the registry-wide rules
no single file can see: duplicate codes, two rows claiming one slug, a missing
image file, an add-on whose mode its product forbids. Problems are collected,
not thrown, so one run reports every bad row rather than the first:

```
28 validation failed:

  category "wheelchairs" › spec "closedWidth": key: Use lowercase letters, numbers, - and _.
  wheelchairs › product "reclining-wheelchair": chips.0.it: Invalid length: Expected <=20 but received 21
  …

Nothing was written. Fix the data files and run again.
```

The only checks that need the database open are the identity collisions and the
orphan report (`conflicts.ts`).

## Files

| File              | Holds                                                    |
| ----------------- | -------------------------------------------------------- |
| `index.ts`        | flags, scope, order, the summary and the exit code       |
| `report.ts`       | the summary lines, the failure lists, media progress     |
| `plan.ts`         | categories, their specs, and the terms documents         |
| `plan-product.ts` | one product — every row it owns                          |
| `planned.ts`      | the resolved shapes, and where-am-I message prefixes     |
| `resolve.ts`      | translation rows, and a file name → a path on disk       |
| `spec-values.ts`  | one spec value → the typed column it belongs in          |
| `ids.ts`          | every primary key, as a UUIDv5 of a `code`               |
| `validate.ts`     | the API schemas, uniqueness, missing assets              |
| `conflicts.ts`    | the two checks that need the database open               |
| `rows.ts`         | categories, specs, products, and the reconciling `prune` |
| `rows-details.ts` | spec values, add-ons, FAQs, intake questions             |
| `rows-terms.ts`   | terms documents, their translations, and `product_terms` |
| `media.ts`        | the R2 pass — encode, upload, patch the key onto the row |
| `infra.ts`        | the encoder and the bucket, from `process.env`           |

The authoring API those files are written against is `src/lib/types.ts`; the
catalogue itself is `src/data/`. `pnpm catalog:preview` renders the same values
as a browsable HTML page without touching a database — see
[catalog-preview.md](catalog-preview.md).
