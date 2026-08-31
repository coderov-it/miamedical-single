# The storefront on a phone

Below `mid` (720px) the storefront is an app, not a narrower page. This is what
that means concretely, what it is matched against, and the one rule that keeps
it from becoming a second codebase.

## The rule

**CSS can restyle, reposition, reorder and hide. It cannot re-parent.**
Re-parenting is the only thing that earns a second block of markup.

So a section gets a phone treatment in one of three ways, in this order:

1. **Same DOM, different classes.** A grid becomes a column, a sidebar becomes a
   sheet, a card becomes a row. Almost everything.
2. **Same DOM, plus a small behaviour gate.** The rails destroy their carousel
   below the breakpoint rather than fighting the column layout.
3. **A second block.** Only `MobileNav`, and only because a bottom tab bar and a
   header nav genuinely differ in nesting, not merely in appearance.

The tripwire on (3): **if the block you are about to copy contains an `<h1>`,
body prose, a product image or a JSON-LD script, you are in the wrong tier.**
Every legitimate second block on this site is chrome. Duplicating chrome costs
about 40 DOM nodes and no index signal; duplicating content costs the page its
`<h1>`, its LCP candidate and possibly its rich result, and buys nothing —
repetition inside one URL is deduplicated, not rewarded.

Where a section shows less on a phone than on desktop (the rails, the
testimonials), the surplus is **hidden, not dropped**. The mobile page is the
indexed page, so cutting four product links out of the markup to save height
that `display:none` already saves is a straight loss.

## What it is matched against

miamedicalitalia.it at 390×844, computed styles read off its own DOM on
2026-08-31. Its phone treatment is a real one, not the `zoom:` wrapper its
desktop page uses. Measured:

```
header        sticky h69 · pad 10/16 · icon buttons 46×46 r12
tab bar       sticky bottom · pad 6/8/8+safe · 5 tabs flex-1
              icon pill 52×30 r999 · active fill #edf1fa
              shadow 0 -4px 16px rgb(27 36 55 / .07)
FAB           WhatsApp 52×52 circle · bottom 92px (tab bar + 16)
product row   flex gap14 pad14 r16 · img 92×92 r12 pad6 tint
              name 700 16.5/1.3 · sub muted · price 700 16 accent
filter row    flex gap8 overflow-x:auto · margin 0 -20px · padding 0 20px 4px
              pill h44 pad 0 18 r999 700/15
search        h56 r14 · pad 0 52 0 46 · 500 18px
hero CTAs     full-width stacked · primary h60 r14
trust strip   3 across on a white band · icon over 2-line centred label
FAQ           ONE white card, hairline-divided rows, all closed
```

Their home page is 6562px on a phone. Ours was 9393px and is now ~8200px; the
catalogue was 12286px and is now ~6900px.

## Where we deliberately differ

|                 | reference                | here                  | why                                                                                                  |
| --------------- | ------------------------ | --------------------- | ---------------------------------------------------------------------------------------------------- |
| tab labels      | 13.3px                   | 16px                  | the tab bar keeps 16px; the phone step is for prose, not chrome                                      |
| tab count       | 5                        | 4                     | four 16px labels fit 390px, five clip; their fifth is "Aiuto", which the support launcher already is |
| row photo       | 92px                     | 84px                  | our row carries an action column theirs does not; at 92 the price wrapped                            |
| row content     | name / blurb / price     | name / price / action | the action is the owner's, and it is the only word on the row that says what happens next            |
| secondary CTA   | white + 2px green border | green tint fill       | controls are fills, never borders                                                                    |
| control shape   | pills (`999px`)          | `rounded-field` 12px  | the pill is a desktop shape; on a phone it reads wrong (owner, 2026-08-31)                           |
| unselected pill | outlined                 | white fill            | same rule                                                                                            |

## The pieces

**`layouts/BaseLayout.astro`** — unchanged. The chrome it mounts does the work.

**`components/global/SiteHeader.astro`** — one trade at `mid`: search appears
below it, the phone pill disappears below it. Search gives up its tab slot to
Noleggio/Vendita and comes up here; the phone number is a tap inside the support
launcher, which is pinned to every phone screen.

**`components/global/MobileNav.astro`** — the only second block on the site.
Four tabs, server-rendered active state, no JavaScript.

**`components/global/SupportLauncher.astro`** — a 52px circle below `mid`, the
labelled pill above it. The wide pill covered a category tile, a product tile
and a review card on the three screens it was checked against.

**`components/catalog/ProductCard.astro`** — the biggest single win. A card
above `mid`, a list row below it, **same four children**, placed by explicit
`grid-area` coordinates on a three-column grid (photo · text · action). The name
spans columns two and three; the price and the action pill take one each, which
is what stops them overlapping. 336px → ~120px per product.

Keep those four children flat. Wrap the text in a div to "tidy it up" and the
row becomes impossible without a second copy of the card.

**`components/home/HomeHero.astro`** — three direct children rather than two, so
`order` can put the search card first on a phone. `order` only sorts siblings; a
booking card nested inside the grey field could not have been lifted without a
second copy. Desktop composition is unchanged — children two and three both
paint `--color-page`, so the field still reads as one ground.

Splitting that field in two cost the page a **white stripe** across the seam,
and it is the failure mode to watch for every time this pattern is used: the
trust strip's own top margin had nothing above it to collapse against, escaped
both wrappers, and turned 34px of grey into 34px of nothing between two grey
blocks. Each child of a shared ground carries its own `flow-root`. A margin that
leaves a painted box takes the paint with it.

The assurances list under the CTAs reads after the showcase card on a phone, and
that reorder is **`display: contents` again, not a lifted grid child.** Lifting
it out of the copy column made it row two of a two-row grid, where `items-center`
paid the showcase card's surplus height out as 66px of nothing between the CTAs
and the list — a grid row cannot hug the row above it. `max-wide:contents` on the
copy wrapper gets the same phone order out of a block that still sits inside the
column above `wide`. The reorder is visual only: the list stays ahead of the card
in the DOM, which is safe while it holds nothing focusable.

**`components/home/HomeBooking.astro`** — one field below `mid`. The three
context segments stand down (nothing here is `required`, so a search without
them is complete); the submit does not, because a search box whose only way
forward is the keyboard's Go key is the silent block CLAUDE.md forbids.

**`components/home/HomeProductRail.astro`** — no carousel below `mid`. The Embla
instance is created and destroyed on the same 45rem the `mid` variant uses,
which is `client:media` done by hand for markup rather than an island. Four rows
paint, the rest are hidden, and the browse tile becomes the full-width button.

**`views/catalog/CatalogPage.astro` + `CatalogFilters.astro`** — the phone
masthead is ONE WHITE TOOLBAR, and that is an organising change, not a cosmetic
one. It was a title, a search field, a scrolling pill row and a full-width
category select, in three different control shapes, all floating on the same
grey ground with nothing grouping them — "messy, spread out rather than
organised" (owner, 2026-08-31). Two moves fixed it:

1. **The masthead gets its own ground.** `CatalogPage` renders the crumb trail,
   the head and the filters in one block and the directory and listing in
   another. Above `mid` both are transparent and the split is invisible; below
   it the first is white with a hairline under it, bleeding past the gutter so
   it reads as chrome rather than as a card.
2. **The select joins the pills in one strip.** They do the same job — narrow
   the list — and looked unrelated. `display: contents` on their wrapper takes
   it back out of the box tree above `mid`, so the same markup is one scrolling
   strip on a phone and two flex items of the desktop row; `order` restores the
   desktop sequence.

The unselected fill inverts with the ground: `bg-white` above `mid`, `bg-tint`
below it. The dropdown's `pill` variant hard-codes white for the grey-ground
case, so it takes the inversion through its `class` prop — without it the
category control is white on white and disappears entirely.

The strip needs its explicit `w-[calc(100% + 2 * gutter)]`: its parent is a
wrapping column flex container, which sized the `overflow-x:auto` child to its
content (472px) instead of to the viewport, and the document scrolled sideways
instead of the row.

## A dropdown is a modal on a phone, not a popover

The catalogue's category list is 17–20 entries. Anchored under its filter pill
it covered the pills it was narrowing, ran off the bottom of the screen, and
each row was a rounded chip on its own fill — "messy, spread out rather than
organised" and then, on the second pass, "green pills type background" (owner,
2026-08-31). Below `mid` it is now a centred sheet:

```
box       90vw, centred, rounded-card, over a 42%-ink scrim
height    ITS ITEMS. `max-h: 72dvh` is a cap, not a height —
          a four-option list is four options tall, and only past
          the cap does the list scroll
rows      full-bleed white, 44px, 14px, 14px side padding,
          one hairline between them and no fill at all
selected  accent ink + a tick at the trailing edge
header    sticky caption bar — grey ground, 11px uppercase label,
          48px close; the scrim closes it too
```

The hairline is what buys the separation, which is why the padding does not
have to and why the rows carry no fill. The desktop popover is unchanged —
there the rows ARE floating chips in an 8px-padded box, and the `accent-tint`
fill is the only thing that could mark one.

**The title is not an item**, so it does not look like one: the caption bar sits
on the grey ground while every row is white, and takes the 11px uppercase
tracked tier rather than the row's 14px semibold ink (owner, 2026-08-31). It is
sticky, so it keeps naming the list once the rows scroll under it.

**The 44px row is the site's one exception to the 48px target floor**, taken
deliberately (owner, 2026-08-31, over the objection). It survives the reasoning
behind that floor because the target is 450x44: only the short side gives way,
an imprecise tap still cannot confuse two rows, and it is nearly twice WCAG
2.5.8's 24px. The caption bar's close button keeps 48, because a small icon
target is exactly what the floor is for. `app.css` records the exception beside
the rule.

### The three concerns, kept apart

The previous version had them tangled, and grew a `data-mobile-fullscreen`
attribute that nothing in the repo ever styled. They are now:

```
shape         Dropdown.astro — max-mid: classes, beside the desktop shape
presentation  scripts/primitives/surface.ts — anchored, or a locked sheet
position      scripts/primitives/floating.ts — anchored only, nothing else
```

`surface.ts` owns the one decision CSS cannot make: at this width, is this
surface tied to a trigger or is it a sheet? Both answers stay live while the
surface is open, so rotating the phone or dragging a desktop window narrow swaps
between them instead of leaving a popover pinned at coordinates that stopped
meaning anything. `DatePicker` runs on the same controller (`phoneSheet: true`)
and paints its own full-screen shape.

The scrim is server-rendered inside the dropdown and derived from
`aria-expanded`, which is already the single source of truth for open — no
second flag to keep in sync. Being inside the dropdown, it fails the
outside-click test, so `dropdown.ts` closes on it explicitly.

### `[&_button]` reaches the listbox

The catalogue was sizing its trigger with `max-mid:[&_button]:min-h-11
max-mid:[&_button]:rounded-field max-mid:[&_button]:px-3.5` and filling it with
`[&_button]:bg-accent-tint`. The `class` prop lands on the WRAPPER, so all four
also hit every option inside the listbox: the modal's rows came out 44px,
pill-cornered and accent-tinted while their own classes said 48px, square and
white. That is what the first screenshot was showing, not the row styles.

The shape moved into the `pill` variant, where it belongs — it is true of that
control at every width. What is genuinely the consumer's (the selected fill)
now addresses the control: `[&_[data-dropdown-trigger]]:`, never `[&_button]:`.

## Two shape rules the phone does not share with desktop

**The pill is a desktop shape.** Below `mid` every control that wore
`rounded-full` takes `--radius-field` (12px) instead — filter pills, the
category dropdown, the pager, the phone CTA, the booking submit, the carousel
arrows — and the two shorter than 40px (the tab bar's active marker, the product
row's action) take 10px. Write it as `mid:rounded-full max-mid:rounded-field`
so both shapes stay visible in the markup.

Circles stay circles only where the shape _is_ the meaning: the carousel dots,
the cart badge, the review avatars, the review source chips.

**One search icon per field.** The catalogue's field carried a decorative glyph
on the left AND a round accent submit on the right; two magnifiers on one 350px
field is one too many (owner, 2026-08-31). The submit went, the glyph stayed.
Nobody is stranded: `q` is the form's only submittable text field — the rest are
`type="hidden"`, which do not block implicit submission — so Enter submits and
the phone OS labels that key "Search". If a submit ever comes back, it
**replaces** the left glyph rather than joining it.

## The breadcrumb trail is 11px on a phone

The one place on the site that deliberately sits under the phone's 14px step
(owner, 2026-08-31): `11px`, `font-light`, and the current item loses its bold.

That is defensible because of what the trail is _for_ on a 390px screen. Nobody
navigates by it there — it is kept for the `BreadcrumbList` structured data it
emits and for orientation at a glance, and the JSON-LD carries the same strings
at full fidelity whatever the paint renders at, so search engines and screen
readers lose nothing. Each crumb also stays a real focusable link with the full
48px hit area; only the paint shrinks.

Do not treat this as a precedent for other small text. It is a trail rendered
beside an `<h1>` that repeats its last item.

## The catalogue toolbar's selected state

A chosen category is a selected control and is filled like one: `accent-tint`,
the project's quiet-selected fill, at both widths. It previously kept its
resting fill whatever was picked, so a narrowed catalogue showed the category
name at the weight of an untouched control while the pill beside it was a solid
accent — two controls claiming one row, one of them lying.

The resting fill is the one that flips with the ground (`bg-white` above `mid`,
`bg-tint` below); the selected fill does not flip, because `accent-tint` reads
on both.

## Tokens this added

In `styles/theme.css`:

```
--spacing-row-photo   84px   the row's square photo well
--spacing-row-pad     14px   row padding and the gap to the text column
--shadow-tabbar              the tab bar's upward lift
--spacing-mobile-nav  76px   corrected from 72px; the FAB sits at this + 16
```

`HOME_BAND` in `styles/editorial.ts` gained a phone anchor (`max-mid:pt-10`).
The section-rhythm clamp is solved for 720→1280 and holds flat below 720, so a
390px phone was getting the 720px design's 56px between every section — half a
screen of nothing across nine sections.

## Type on a phone

Owner decision, 2026-08-31, and it reverses the previous rule rather than
extending it: **below `mid` prose sets at 14px and the prominent tier at 16px.**
Above `mid` the 16px floor is unchanged.

```
--text-phone-body   14px / 1.55    the default — set once on `body` in app.css
--text-phone-lead   16px / 1.5     the one step up
```

`app.css` applies the body token inside a single `@media (width < 45rem)` block,
so everything that inherits follows. **Anything that states its own
`text-[…]` does not follow** — that is deliberate, an explicit size is a
decision somebody made about that element — so a component that should step has
to name `max-mid:` for itself. The ones that do: the hero headline (28px), the
hero lede, `HOME_TITLE` (22px), `HOME_LEAD`, `HOME_SEE_ALL`, and the
how-it-works card text.

What it costs is written up on `--text-phone-body` in `theme.css`: 14px is not a
WCAG failure on its own — nothing here blocks zoom, so a reader who needs 200%
still gets it — but it does give up the larger default for readers who never
change a setting. The mitigations that make it survivable are the AAA contrast
tiers, the 48px targets and Atkinson Hyperlegible, and all three must stay.

**The space ramp still has no phone anchor**, and that is the remaining item.
Every `clamp()` in `theme.css` interpolates 720→1280 and holds at its minimum
below 720, so phone spacing is still the 720px design's. `HOME_BAND` and the
hero were anchored by hand; the rest have not been.

## The kicker's width formula

`HomeHero`'s location pill is the one place a size is computed rather than
chosen, and it is worth knowing why before someone "simplifies" it. The owner
asked for one line at normal weight. Measured:

```
"Rome and Florence · home delivery in 24–48 hours"    48 chars
its width in Lexend 400 at 14px                       340px
room in the pill at 390px (390 − 40 − 24 − 22 pin)    304px
```

14px does not fit, and no fixed size fits every phone width and every
translation. So the pin stands down below `mid` (it is `aria-hidden`, and the
two words beside it say the same thing) and the size is solved for the width:
`clamp(0.75rem, 4.12vw - 2.64px, 0.875rem)`. `whitespace-nowrap` is the guard —
a longer translation overflows visibly rather than quietly wrapping back to two
lines.

## Checking a change

```
pnpm --filter @mia/website check
```

then, at 390×844 in a real browser, assert `document.documentElement.scrollWidth
=== 390`. Horizontal overflow is the failure mode every one of these layouts has
— it appeared twice during this work, both times from a full-bleed scroller —
and it is invisible in a screenshot.
