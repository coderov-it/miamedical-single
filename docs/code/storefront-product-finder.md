# Aiutami a scegliere — the guided selector

Three one-tap questions that turn "my mother needs something, I don't know what
it's called" into a shortlist of real products. Ported from the live site's
`/aiutami-a-scegliere/`, which is where the copy, the questions and the fallback
behaviour come from.

|              |                                                                                |
| ------------ | ------------------------------------------------------------------------------ |
| Route        | `/aiutami-a-scegliere/` · `/en/help-me-choose/`                                |
| Page         | `apps/website/src/pages/aiutami-a-scegliere.astro` (route shim)                |
| View         | `apps/website/src/views/finder/`                                               |
| Rules        | `apps/website/src/lib/product-finder.ts`                                       |
| Entry points | home page, catalogue directory (`components/global/FinderEntry.astro`), footer |

## The flow is the URL

Every answer is a plain `<a>` that adds one query parameter. There is no client
JavaScript, no form and no submit button.

```
/aiutami-a-scegliere/                                     → question 1, Attività
/aiutami-a-scegliere/?activity=move                       → question 2, Dove
/aiutami-a-scegliere/?activity=move&place=home            → question 3, Durata
/aiutami-a-scegliere/?activity=move&place=home&duration=weeks   → 15 prodotti trovati
                                                    &all=1 → the same 15, none held back
```

`currentStep()` reads the answers **in order and stops at the first gap**, so a
hand-edited URL that skips a step re-asks it instead of quietly answering it. An
unknown value (`?activity=banana`) is treated as no answer for the same reason.

One answer is one step, and one step is one history entry — so the browser's own
back button walks the flow backwards, which is why "Indietro" is a link to the
previous URL rather than a script.

`noindex` is set on every state but the bare page: the 72 answer combinations
under it are the same products in a different order.

## The rules

Three questions, and only the first and third change what comes back.

**1 · Attività → a set of categories.** Six activities, each naming the category
codes it means. `ACTIVITY_RULES` in `product-finder.ts` is the whole table.

**2 · Dove → a narrowing, for mobility only.** Indoors means a manual chair,
outdoors a powered one. The other five activities ignore the answer — the live
site does the same, and the question is still asked of everyone because dropping
it for five of six would make the step bar lie about how far along the customer
is.

**3 · Durata → a pricing mode.**

| answer           | means           |
| ---------------- | --------------- |
| Poche settimane  | rental only     |
| Qualche mese     | rental only     |
| A lungo termine  | rental and sale |
| Non lo so ancora | rental and sale |

### Worked example

```
answers   activity=move   place=home   duration=weeks

1. activity 'move'   → carrozzine · carrozzine-elettriche-e-scooter · ausili-per-la-mobilita
2. place 'home'      → narrows to  carrozzine
3. duration 'weeks'  → mode        rental
4. match             → 15 products, in stock first
5. render            → 12 cards + "Vedi tutti i 15 risultati"
```

And the fallback, when a narrowing leaves nothing:

```
answers   activity=stairs   place=home   duration=weeks

1. activity 'stairs' → montascale
2. place 'home'      → no narrowing for this activity
3. duration 'weeks'  → mode rental                        → 4 products ✓
```

```
hypothetical: an activity whose place narrowing matches nothing

1. exact (narrowed categories + mode)   → 0   drop the place narrowing
2. all the activity's categories + mode → 6   ✓  relaxed: 'place'
                                                 the results say so
```

Results never come back empty on a technicality. `matchProducts()` drops the
place narrowing first, then the mode filter, and reports which one it dropped so
the results screen can print the notice. Showing someone the whole category
after they asked for outdoors is fine; not telling them is not.

## Two taxonomies at once

`ACTIVITY_RULES` names category codes from **both** taxonomies on purpose:

- the eighteen Italian-coded categories the database still carries
  (`carrozzine`, `deambulatori-e-rollatori`, …)
- the thirty-four English-coded ones `packages/catalog` was rebuilt around
  (`wheelchairs-hire`, `walkers-sale`, …), which nothing has synced yet

A code that is not in the catalogue costs nothing: `categorySlugs()` keeps only
what `/api/categories` actually returned for this request. So the table answers
correctly today and keeps answering correctly the day `pnpm catalog:sync` runs.
**Drop the Italian half once that has happened.**

The match is by category **slug**, not code, because a product summary
(`PublicProductSummaryDto`) names its category by slug and the slug is
localized. Codes are translated through the categories fetched for the same
request rather than assumed to be spelled the same.

## What it costs

Nothing. Both reads reuse the home page's cache keys —
`catalog:products:<locale>` and `catalog:categories:<locale>`, under
`CATALOG_POLICY` — so a visit to the finder is served from the same memory the
home page filled. Both go through `safely()`: with the API down the questions
still render and the shortlist comes back empty with its "call us" card.

## Layout

The desktop screen is one white panel: title, step bar, question or results,
actions. **The panel stops at `mid`** — on a phone the content sits straight on
the grey ground, which is the reference's own arrangement at 390px and not a
style preference: the panel's 20px of inner padding came out of the width the
option rows and product cards share with the page gutter, and at 310px a card's
price collides with its action pill.

An option is a card in a three-column grid above `mid` and a full-width row
below it — photo, text, chevron — the same pattern as `ProductCard`, documented
in `storefront-mobile.md`. The row's grid template follows whether the question
has photos: the text must occupy the `1fr` column, or a two-child row parks the
chevron against the text with the rest of the row empty beside it.

Results reuse `ProductCard` unchanged, so a product found here and one found by
browsing are the same object.

## Differences from the live site

|                  | live site                               | here                                       |
| ---------------- | --------------------------------------- | ------------------------------------------ |
| State            | client-side, one screen                 | URL query, server-rendered                 |
| Results shown    | 6                                       | 12, then "see all N" on the same page      |
| "See all" target | catalogue narrowed by need + sub + mode | this page, unpaginated                     |
| Closing help     | WhatsApp                                | the free phone number, this site's channel |

The "see all" difference is forced: our catalogue filters **one** category at a
time and an activity spans several, so a catalogue link could not show the set
the finder counted. Listing them here keeps the count above the grid and the
products under it the same set. A quiet link to the whole catalogue sits beside
it.

## Known gaps

- **The header nav does not carry the finder.** A seventh item overflows the bar
  by ~69px between 720 and 1100, where the icon cluster has no slack. It is
  reached from the home band, the catalogue directory band and the footer. Making
  it a nav item means giving up one of the six slots — an owner decision.
- **"Dove" only narrows mobility**, inherited from the live site. If the
  catalogue ever splits stairlifts from ramps, that is the second rule to add.
