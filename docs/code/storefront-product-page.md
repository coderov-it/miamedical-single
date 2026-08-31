# Storefront product page — the hero

`/prodotto/<slug>/`, above the numbered sections. Everything below the hero
(`01 Configura`, `02 Extra`, `03 Per la consegna`, `04 Scheda tecnica`, the info
tabs and the order panel) is unchanged by this document and lives in
`views/product/ProductBody.astro`.

## Three zones, and they line up

```
┌──────────────┐ ┌────────────────────────┐   ┌────────────┐
│              │ │ AUSILI · VENDITA       │   │ TOTALE     │
│  photograph  │ │ Product title          │   │ 1 843,00 € │
│              │ │ 1 843,00 €  IVA inclusa│   │ Quantità   │
└──────────────┘ └────────────────────────┘   │ [Richiedi] │
┌──────────────────────────────────────────┐  │ [Aggiungi] │
│ [chip] [chip]   short description …      │  │ ★ 4,9      │
└──────────────────────────────────────────┘  └────────────┘
    the left content column (732 px)            panel (400)
```

The page keeps its **three columns** — that was never the problem (owner,
2026-09-01). What was wrong is that the third of them kept going after the other
two had stopped.

## What was wrong

The photograph sat in a 300 px column beside a column carrying the kicker, the
title, the price, the chips **and** the whole short description. On the
catalogue's longest title — `vendita-montascale-easystep`, 88 characters, 493
characters of `shortDescription` — measured at a 1440 viewport:

|                      |                                             |
| -------------------- | ------------------------------------------- |
| identity column      | 396 px, narrower than the buy box beside it |
| title                | 5 lines, 195 px                             |
| photo well           | 300 × 225                                   |
| white under the well | **296 px**                                  |
| hero                 | 521 px                                      |

A flex row stretches its items, so the gallery `div` was 521 px tall around a
225 px well. The picture was the smallest thing on a page selling a €1 843
machine, and the emptiest region on the screen was directly under it.

## The two rules that fix it

### 1. The prose leaves the column

Chips and the short description drop to a row spanning both cells. The band above
then holds only the three facts that **identify** the product — what kind, what
it is called, what it costs.

Nothing is hidden and nothing is clamped: the paragraph simply gets ~730 px
instead of 396 and reads in four lines instead of nine. `max-w-[68ch]` keeps it
off a 95-character measure.

### 2. The well stretches to the band

The grid rows are `stretch` and the well is `flex-1`, so it takes its height from
whichever cell is taller. From `mid` up the well drops its `aspect-4/3` for
`min-h-72` + `max-h-(--pdp-well)`; on a phone there is no second cell to match, so
the ratio stays.

**A longer title therefore makes the photograph bigger rather than making a hole
beside it.** The worst case feeds the image instead of starving it — which is the
whole reason this is a grid and not two flex columns.

`--pdp-well` (25rem) is the ceiling on that. Past it a runaway title would keep
growing the well and start floating a small photograph in a large grey field,
which is the bug this layout exists to remove.

## What it measures now

Same page, same viewport:

|                      | before            | after                          |
| -------------------- | ----------------- | ------------------------------ |
| photo well           | 300 × 225         | **336 × 290**                  |
| painted photo width  | 260 px            | **304 px** (+17 %, +37 % area) |
| white under the well | 296 px            | **0**                          |
| description          | 9 lines in 396 px | 4 lines in 730 px              |
| hero                 | 521 px            | 460 px                         |

The extra painted width is two things: the wider column, and the well's inner
padding going `p-5` → `p-4`. Thumbnails step `w-17` → `w-19` from `mid` up so they
do not read as undersized under a bigger well.

### Why the gallery column is 21rem

`minmax(0, 21rem)` is a balance, and moving it trades one complaint for the other:

- **22rem** gave the Easystep photo another 16 px and pushed
  `noleggio-carrozzina-elettrica-fantastica` (51 characters) from three title
  lines to five.
- **20rem** kept every title short and gave back most of the size gain.

21 rem holds Fantastica at three lines and Easystep at five, which is what it
already wrapped to at 396 px.

## What the layout has to survive

- **No image.** The well is still painted, as an empty `bg-tint` plate. That is
  deliberate — a missing photo must not collapse the row and misalign the band.
- **Out of stock.** The hero renders identically; only the panel changes (there is
  no `<form>` around the columns). Verified on Fantastica.
- **1 image / 4 images.** With thumbs the gallery cell is `well + 76 px row`, and
  `flex-1` on the well absorbs the difference, so the cells stay level.
- **No chips and no description.** The prose row is not rendered at all rather
  than rendered empty — otherwise `gap-y-7` would leave a phantom band.
- **Below `mid` (45rem).** The grid is not applied; the section is a plain
  `flex-col` and the well returns to `aspect-4/3`. Checked at 719/720 — no jump,
  no horizontal scroll.
- **760–1100.** The order panel wraps below and the left column takes the full
  page; the hero grid is unaffected.

Whichever of these changes, the check is the same: the well and the identity band
must end on the same line. If they do not, something has been added back into the
identity column that belongs in the prose row.

## Still open

The 493-character `shortDescription` repeats the opening of the Descrizione tab,
so the page says the same thing twice. That is a back-office rule to write — one
sentence, ≤ 200 characters, must not repeat the description — not a layout
problem, and the hero now reads well enough that it can wait.
