# Catalogue preview

The hand-written catalogue in `packages/catalog/src/data/` as a browsable
one-product-per-page site, in a single self-contained HTML file. Code lives in
`packages/catalog/src/script/preview/`, entry point `index.ts`.

```
pnpm catalog:preview                        write it, then open it
pnpm catalog:preview --only=wheelchairs     one category
pnpm catalog:preview --assets=/mnt/photos   take the images from somewhere else
pnpm catalog:preview --out=/tmp/x.html      write it somewhere else
```

The default output is `docs/assets/catalog/preview.html` — inside the assets
root, which `.gitignore` already covers, so the file is never committed and
every `<img src>` is a plain relative path. Open it with `file://`; there is no
server, no build step, no webfont and no network.

Nothing here touches PostgreSQL or R2. The page is built from the same
TypeScript objects `pnpm catalog:sync` reads, which is the point: it answers
"is the data right" before a database is involved.

## The layout

One product fills the screen; the rest are hidden. Routes are hash-based, so
every product has a copyable deep link and the back button works:

```
#/wheelchairs                             category overview + spec declarations
#/wheelchairs/slim-self-propelled          one product
#/terms                                    the terms documents
```

A product page runs in this order, and the order is the design — picture first,
machine values last:

```
1  title            code, status, stock, featured, then the title and chips
2  gallery          big viewer + thumbnail strip, caption with size and pixels
3  price packages   headline, the packages table, then the add-ons table
4  description      short description above the rendered rich description
5  specifications   values read back through the category's declarations
6  questions        what the customer is asked at checkout
7  FAQs             collapsed
8  metadata         identity, slugs and SEO, terms linked, media files
```

Anything that is a fact about the **row** rather than about the product — the
code, the slug, the file names — is held back to step 8, so opening a product
does not open onto a wall of identifiers.

## The chrome

**Top left, floating:** a category picker and a menu button. The button opens
the outline — the full product titles of the selected category, numbered, each
free to wrap onto as many lines as it needs. Truncating them would defeat the
purpose: half these titles differ only in their last two words
(`… ad autospinta - SLIM` vs `… di transito – SLIM`), so a clipped list is a
list you cannot navigate. Escape or a click outside closes it.

**Top right, floating:** `IT` / `EN`.

Both languages are in the DOM, tagged `data-lang`, and the toggle flips one CSS
rule on `<html>`. Nothing is re-rendered and nothing is fetched — which is what
lets a **missing** translation be visible at all: a value with no `en` still
emits an English span holding the Italian, marked with an amber dotted
underline. That mirrors the database, where Italian is the only guaranteed
language and the storefront falls back to it.

## What it exits with

```
$ pnpm catalog:preview
categories           2
products             16
assets               docs/assets/catalog
written              docs/assets/catalog/preview.html

Every media ref resolves to a file.                       → exit 0
```

```
$ pnpm catalog:preview
…
2 missing file(s):
  wheelchairs: "carrozzine.png" — nothing at docs/assets/catalog/wheelchairs/carrozzine.png
  used-equipment: "used-fantastica-1.jpg" — nothing at docs/assets/catalog/used-equipment/used-fantastica-1.jpg

The page was written and marks each one in red.           → exit 1
```

The page is written **before** the exit code is decided, so a catalogue with a
broken ref is always inspectable rather than merely reported. The banner at the
top of the page opens by default up to six problems and stays collapsed beyond
that, so a badly-pointed `--assets` cannot bury every product below the fold.

## What is drawn in colour

| Colour                            | Means                                                        |
| --------------------------------- | ------------------------------------------------------------ |
| red dashed viewer / red thumbnail | the ref resolves to no file — the path searched is on it     |
| red text in a table               | a spec key or select option the category never declared      |
| amber `no alt text`               | an image with no alt; it still imports, so this is a warning |
| amber dotted underline            | no English written — the Italian is being shown instead      |

Pixel dimensions in the gallery caption come from the browser's `naturalWidth`,
which is what makes a 1000×1000 photo visible as square when the storefront
wants 3:2. Nothing in the gallery is ever cropped — thumbnails and the viewer
are both `object-fit: contain`, because the shape of the picture is one of the
things this page exists to show.

## Media refs resolve exactly as the importer resolves them

`assets.ts` repeats the two-step lookup in
`script/sync/resolve.ts` rather than importing it, because the preview must
run in a browser and the sync drags Drizzle in:

```
'transit-folding-1.jpg'          bare name  →  <assets>/<categoryCode>/transit-folding-1.jpg
'shared/pedane-elevabile-1.jpg'  has a /    →  <assets>/shared/pedane-elevabile-1.jpg
'/mnt/photos/x.jpg'              absolute   →  used as written
```

The rule is written in two places, so the two must change together. Getting it
wrong here shows a broken photo for a ref the importer would have found, which
is worse than having no preview.

## The one computed number

The `≈ per unit` column in the packages table is the only arithmetic on the
page. It exists to catch a mistyped package: 7 days at 30,00 € is 4,29 € a day
and 15 days at 35,00 € is 2,33 €, so a 15-day package priced at 350,00 € stands
out at a glance in a way a column of totals does not.

It is a review aid and nothing else. `packages/catalog/src/lib/money.ts` is
emphatic that no total is ever derived from an authored amount, and this figure
is printed into an HTML file and never written anywhere.

## The visual style

Canvas and surface: depth comes from lightness, never from a shadow. Cards are
the whitest thing on the page, the page sits a shade below them, recessed
elements (table headers, chips, inline code) a shade below that, and the
faintest neutral is spent only on hairlines. There is no `box-shadow` in the
file — remove the off-white page background and every card dissolves, because
nothing else is holding it up.

The accent marks state only (selected, active, featured, links). Red means
broken and nothing else; amber means incomplete but valid. Everything else is
one of four neutrals.

## Files

| File          | Holds                                                       |
| ------------- | ----------------------------------------------------------- |
| `index.ts`    | flags, scope, the write, the summary and the exit code      |
| `page.ts`     | the document shell and the problems banner                  |
| `style.ts`    | the stylesheet                                              |
| `client.ts`   | routing, the rail, the gallery and the language toggle      |
| `nav.ts`      | the floating category rail, outline and language buttons    |
| `assets.ts`   | ref → file on disk and href, mirroring the importer         |
| `html.ts`     | escaping, the two-language spans, `it-IT` money and numbers |
| `category.ts` | the category page, and the product pages under it           |
| `product.ts`  | one product page — the running order above                  |
| `pricing.ts`  | price headline, packages table, add-ons table, chips        |
| `specs.ts`    | spec values, and the declarations they are read through     |
| `intake.ts`   | questions table and FAQs                                    |
| `metadata.ts` | the closing panel — identity, SEO, terms, media files       |
| `media.ts`    | the gallery viewer and thumbnail strip                      |
| `terms.ts`    | the terms documents page                                    |

## Sending it to someone

The page is self-contained — one inline `<style>`, one inline `<script>`, system
fonts, no CDN — and it sits in the assets root next to the photos it names, so the
whole folder is the deliverable:

```sh
tar czf ~/catalog-preview.tar.gz -C docs/assets catalog
```

~117 MB. The recipient extracts it and opens `catalog/preview.html`; no server, no
network, no repo. Run `pnpm catalog:preview` first if the data has changed.

Two products (8793, 12321) embed dimension diagrams hotlinked from `vermeiren.it`.
Those are the only images that need the network, and they are left as the shop
wrote them.
