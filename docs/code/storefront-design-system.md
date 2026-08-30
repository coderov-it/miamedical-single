# Storefront design system

Everything under `apps/website/`. The approved design is **"Variante B —
Sereno"**, the prototype at `docs/visual/examples/home/variant-b-sereno.html`.
That file is the reference for the home page _and_ the standard for every other
page: a section that has no prototype of its own is built out of Variant B's
vocabulary, not invented.

This document carries the reasoning that would otherwise be twenty-line comment
blocks in a dozen files.

Nothing here is shared with `apps/admin`. The admin is shadcn-svelte on its own
Tailwind theme; the storefront has its own. They are separate apps that happen to
talk to the same API and to use the same CSS framework.

---

## The audience is the constraint

The customers are predominantly elderly, often on old devices, frequently using
browser magnification or a screen reader, and a large share of them would rather
phone than fill in a form. Type size, contrast, target size and a visible phone
number are therefore functional requirements, not styling preferences.

Three consequences that look like over-engineering until you know that:

- **A phone call is a successful conversion.** `PhoneCta` appears in the header,
  the catalogue empty state, the product help card, the 404 page, the support
  page and the closing band. It is never framed as a fallback.
- **No payment happens online.** The customer configures a product, sends a
  request, and price and delivery are agreed on the call. The buy box CTA is
  "Richiedi il noleggio", never "Paga".
- **Nothing below 16px, in the TOKENS.** There is no type token smaller than
  `--text-ui: 1rem`, and there will not be one. Two sanctioned exceptions, both
  scoped: the product card's data rows (14/15px), a locked design decision; and the
  three released commerce pages — product detail, checkout, cart — which follow
  owner-authored reference designs down to 12.5px in secondary text, via arbitrary
  values rather than tokens. Marketing and prose pages have no exception.

## The design language, in five rules

Variant B is a system of very few moves. Breaking one of them is what makes a
new page look like it belongs to a different site.

1. **Sections separate by alternating white and a band of `--color-tint`**, a
   very pale NEUTRAL grey. The tint appears as whole bands and as small fills —
   never smeared over every individual panel. (It used to be a pale blue derived
   from the brand blue; see § The palette is neutral grey.)
2. **Objects are defined by one hairline**, `--color-hair`, always the same, one
   step below the tint. It reads on white and on a band alike without ever
   hardening into a frame. On hover it darkens to `--color-hair-strong`; it does
   not change to another colour.
3. **Figure and ground invert.** On white, the fills inside a card are tinted; on
   a tinted band, the cards are white and their fills go white too. This holds
   everywhere — product cards, the delivery strip, the review cards.
4. **One generous radius (`--radius-card`, 18px) plus the pill for buttons.**
   `--radius-field` (12px) is the only smaller step, for controls and wells
   inside a card.
5. **One shadow on the marketing pages**, under the home search panel: wide and
   almost invisible. Everything else there is the hairline. The three released
   commerce pages have their own elevation set (`--shadow-pdp-*`).

The page closes by descending: the "parla con noi" band on `--color-accent-deep`,
then the footer on `--color-footer`. Since the recolour these are no longer two
steps of one blue — the CTA band is the accent's dark step and the footer is neutral
near-black. See § The palette is neutral grey.

## Tailwind v4, and where the theme lives

`src/styles/app.css` is the entire design system, imported once by `BaseLayout`.
There is no `tailwind.config.js` — v4 has no config file, and the `@theme` block
in that stylesheet _is_ the theme. Every token generates utilities: `bg-tint`,
`border-hair`, `rounded-card`, `text-ui`, `pt-section`, `max-w-page`.

The file has three parts, and the order matters:

| Part                | What belongs there                                                                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@theme`            | Tokens only. Colour, type scale, radii, the one shadow, the container width, the section rhythm, the two breakpoints.                                    |
| `@layer base`       | Accessibility obligations that must apply to bare elements: the focus ring, the 48px target floor, reduced motion, placeholder contrast, `aria-invalid`. |
| `@layer components` | Six composites — `.btn` and its four variants, `.field-control`, `.field-label`, `.hair-card`, `.skip-link`. Nothing else.                               |

**Put a composite in `@layer components` only when it appears on nearly every
page.** Everything used a handful of times is plain utilities in the markup. The
components layer sorts before utilities, so a utility in the markup always wins:
`class="btn w-full"` does what it looks like.

No `.astro` file has a `<style>` block. If you find yourself wanting one, the
answer is almost always a `@theme` token you have not defined yet. (The PDP is
the exception the § below explains: it is a released design, and its prose and
tab styles live with the components that own them.)

### The focus ring is two paints — never remove only one

`*:focus-visible` is a 2px accent `outline` at `outline-offset: 2px` **and** a 2px
white `box-shadow` filling that gap. Two paints, because a single brand-blue ring is
1.0:1 against a brand-blue button and therefore invisible on every primary CTA
(SC 2.4.13 / 1.4.11). Each paint covers what the other cannot:

```text
white 2px, hugging the control    16.3:1 on --color-footer
                                  7.84:1 on an accent button
                                 11.03:1 on the accent-deep band
accent 2px, just outside it        7.84:1 on white
                                 ~7.4:1 on a tint band
```

**It used to be 3px white under a 6px `--color-ink` shadow** — 9px of near-black
around every focused control, which on a white card reads as a hard slab rather
than a ring, and was the single thing the owner disliked most about the storefront's
feel. The obligation did not change; the footprint more than halved and the heavy
paint became brand blue. Do not put ink back, and do not drop to one paint.

Do not add a blurred bloom either. A soft glow is the obvious way to make a ring
feel gentle and it is the wrong one here — it over-highlights, and the same request
was made and reversed in the admin.

The trap: `focus:outline-none` — the reflex when a control shouldn't ring — takes
the accent ring away and **leaves the white band**, drawn tight around the element,
which on a white card is no indicator at all. Four search fields had exactly the
equivalent bug under the old colours. Opting out means both:

```css
outline: none;
box-shadow: none;
```

For `.field-control` this is already done. The box owns the border, so the box
owns the ring — the inner `<input>` has no border and fills the box, so ringing
_it_ draws the ring inside the visible control. The wrapper takes the ring via
`:has(:is(input, select, textarea):focus-visible)`, and `:focus-within` keeps the
softer accent border as the pointer affordance. Any new composed field follows
that pair; a bare control needs neither, because the global rule is already right.

Also gone from the global rule: `border-radius: inherit`. It was there so a ring
would follow the control's shape, but an element with no radius of its own took
its **parent's** — a link inside a rounded card wore the card's corners. Controls
with their own radius never needed it; outlines follow `border-radius` on their
own.

Native date inputs render `mm/dd/yyyy` or `gg/mm/aaaa` per the **browser's**
locale, not the page's `lang` — nothing in CSS or markup changes that. The PDP's
own period control is a custom calendar for exactly this reason; the home search
still uses the native field on purpose, since it is a hint, not a booking.

### Breakpoints

The design reflows at exactly two points, and they are named after that rather
than after a device:

- `mid` — 720px, phone → desktop.
- `wide` — 1100px, narrow desktop → full.

Tailwind's defaults (`sm`, `md`, `lg`, `xl`) still exist and are occasionally
right for a grid that has nothing to do with the page's own reflow, but prefer
`mid` and `wide`.

### Fonts — three faces, reverted to match the reference site (2026-08-30)

**Lexend for headings, Atkinson Hyperlegible for prose, Inter for the chrome and
the cards.** `--font-display` → Lexend, `--font-body` and `--font-pdp` →
Atkinson, `--font-ui` and `--font-card` → Inter.

This restores the pairing the storefront shipped before the 2026-08-10
single-face override. The owner's reason is direct: `miamedicalitalia.it`, the
site this storefront replaces, renders Lexend headings on Atkinson body, and the
brief is to match its typography along with its sizing, spacing and layout.

The revert cost nothing in markup, which is the whole point of keeping the four
token names apart. `font-display` appears in 40 places and `font-card` in three;
re-pointing the tokens is the entire face change, in both directions. All four
font files stay in `public/fonts/`, and `instrument-sans-variable-latin.woff2`
now sits there unreferenced on exactly the terms the Lexend and Atkinson files
did — so this is reversible without a download too.

What came back with it:

- Atkinson's character-distinction advantage for body prose. It is the Braille
  Institute's low-vision face, chosen for this audience on purpose, and losing it
  was the override's stated cost.
- A **real italic**. Instrument Sans ships upright only, so prose `<em>` was a
  synthesised oblique for three weeks.

What did **not** come back: body type stays at **16px/1.5**, not the 18px of the
pre-override era. That metric is the reference designs' own and the product page
and checkout were released against it.

**Heading weights follow the reference**: `h1` at 800, everything below it at
700 (owner, 2026-08-30). The editorial regions set their own weights and are
un-layered, so the home page's blueprint headings are unaffected.

**Heading tracking is now `normal`.** It has been three values — `-0.028em` tuned
for Lexend, then `-0.015em` when Instrument Sans went muddy at that, now none,
which is what the reference site sets and what Lexend is drawn for. The editorial
regions already forced `normal` through a `:where()` override, so this collapses
a special case rather than adding one.

**Two preloads**, Inter and Lexend: the sticky header paints Inter on every page
and Lexend sets the `h1`, which is the LCP element on most of them. Atkinson is
deliberately not preloaded — it sets running prose, which mostly starts below the
fold, and a third preload would spend the first round trip on the face that needs
it least.

Not up for taste, and untouched by any of this: the 16px type floor, the two-paint
focus ring, the 48px target rule, and every AAA contrast ratio.

### White content on a muted ground, everywhere but home (2026-08-30)

`--color-page` is `#f6f7fa`, and `BaseLayout` paints it via `.ground-muted` on
every page except the home page, which passes `ground="white"` because its
editorial bands already paint their own grounds and would stack ground on ground.

The contract this creates is one line long and worth stating: **on the muted
ground, a surface is white.** `--color-tint` is `#f5f6f7`, one percent from the
field behind it, so a tint-filled panel there does not read as a panel at all.
`.ground-muted .rounded-card.bg-tint` promotes those to white with a hairline —
enforced once, in CSS, so a page nobody has revisited cannot end up with an
invisible card.

The promotion is scoped to `.rounded-card`, the SURFACE radius, and deliberately
not to controls: `.field-control` and the dropdown trigger keep their tint wells,
because a control is meant to read as recessed. The reference site recesses its
search field the same way.

### Catalogue geometry, measured from the reference site (2026-08-30)

The numbers below are not taste; they were measured off `miamedicalitalia.it` at
1128px and 820px, and the storefront was moved onto them.

|                        | Reference            | Was                   | Now                       |
| ---------------------- | -------------------- | --------------------- | ------------------------- |
| Category tile          | 180px tall, 78px art | 230px tall, 136px art | 174px tall, 86px art      |
| Tile columns at 1100px | 4                    | 2                     | 4                         |
| Tile columns at 820px  | 4                    | 2                     | 4                         |
| Filter pill            | 44px                 | 48px                  | 44px painted, 48px target |
| `h1`                   | 34px                 | 36px                  | 34px                      |
| Breadcrumb row         | —                    | 72px                  | 37px                      |

Three of those needed a mechanism rather than a number:

- **The tile grid goes four-up at 720px**, not 1020px. A 1000px window used to
  paint two enormous tiles per row and push the rest of the catalogue off screen.
- **A 44px pill still has a 48px target**, through `.hit-48` — the storefront-wide
  version of the checkout's `.target-48`. Note it carries no `min-height: 0`,
  unlike `.target-48`: that reset exists to escape the base 48px floor, which
  lands on buttons and selects but never on an `<a>`. Un-layered, it would have
  beaten the element's own `min-h-*` utility and collapsed the pill to its text
  height — the same un-layered-over-layered trap `.target-48` documents.
- **`.category-tile` is `height: 100%`**, so a two-line category name lifts its
  whole row instead of leaving its neighbours short.

### The header nav had a dead zone between 720px and 1100px

`.head-nav` appeared only at `min-width: 1100px`, and `MobileNav`'s bottom bar
disappears at 720px (`mid:hidden`). Every viewport between the two — a small
laptop, a tablet in landscape, a half-screen window — rendered **no navigation at
all**: six items and no way to reach any of them (owner, 2026-08-30, "no menus").

The nav now appears from 720px, the exact width the bottom bar leaves off, with a
tighter gap until 1100px. The head row already wraps by design, so it wraps rather
than overflowing. The reference site keeps all six items down to 820px.

### The palette is neutral grey, by owner decision (2026-08-10)

The greys used to be a dilution of the brand blue — same hue direction, a little
saturation — which made every surface read faintly blue. They are now
**near-neutral: hue 275 held at chroma 0.002–0.011**, where the reference designs
put them. Blue survives in exactly one place, the accent, and it got **more**
saturated rather than less. The contrast between a neutral ground and one vivid
accent is the whole look.

Every value was re-derived in **OKLCh with its lightness preserved**, so the
recolour cost nothing in contrast. Each ratio below is measured and within 0.01 of
what the blue-tinted token measured:

| Token                    | Was       | Now       | On white          |
| ------------------------ | --------- | --------- | ----------------- |
| `--color-ink`            | `#2e3237` | `#303137` | 12.96:1           |
| `--color-ink-2`          | `#49536b` | `#525358` | 7.67:1 — **AAA**  |
| `--color-ink-decorative` | `#8a93a8` | `#929397` | 3.07:1, non-text  |
| `--color-tint`           | `#f2f5fb` | `#f5f6f7` | —                 |
| `--color-tint-2`         | `#e7edf8` | `#f0f0f1` | —                 |
| `--color-hair`           | `#dfe6f2` | `#e7e8ea` | —                 |
| `--color-hair-strong`    | `#c8d2e6` | `#d1d1d4` | 1.52:1, unchanged |
| `--color-accent`         | `#2e4699` | `#3846b1` | 7.84:1 — **AAA**  |
| `--color-accent-deep`    | `#1d2c62` | `#262d97` | 11.03:1           |
| `--color-footer`         | `#131d40` | `#1f2023` | 16.29:1           |
| `--color-on-dark`        | `#a7b0cc` | `#a9aaae` | 7.02:1 on footer  |
| `--color-on-deep`        | `#b3bcd8` | `#cdced2` | 7.01:1 on deep    |

Four decisions inside that table are worth knowing before you change one:

- **`--hair-strong` kept its lightness** rather than taking the reference's lighter
  tone. It draws form-control boundaries (`.field-control`), where the line is the
  only thing saying where to type — and at 1.52:1 that edge has no room to give.
- **`--accent` is AAA but only just** (7.84:1, down from 8.56:1). Do not lighten it,
  and do not lighten `--accent-deep`: `--on-deep` had to go lighter to hold 7:1 on
  it as it is.
- **The closing descent is no longer two steps of one blue.** The CTA band is the
  accent's dark step and the footer below it is neutral near-black. Blue is the
  accent and the footer is ground — the old navy-on-navy descent was the single
  largest source of the blue cast.
- **`--ok`, `--danger` and `--star` keep their chroma.** Neutralising these is the
  one recolour that would cost something real: a desaturated "Disponibile" or a grey
  error stops being identifiable as status at all (SC 1.4.1).

The commerce shadow tint went from `oklch(0.35 0.06 275)` to chroma `0.012` for the
same reason it always had a rule: at a 30px blur a saturated blue stops reading as a
shadow and becomes a coloured halo. The old 0.06 was a mild case of that.

**If you add a grey, add it at hue 275 with chroma ≤ 0.012, and measure it.**

The ink is still deliberately soft — never 100% black, which stings on a bright
screen, and never navy.

## Deliberate corrections to the prototype

Where a prototype value fails an accessibility rule, the token holds the
**corrected** value and records the original beside it. Do not "restore" a design
value over a correction without resolving it with the designer first.

| What           | Prototype                 | Token                                        | Why                                                                                                                                           |
| -------------- | ------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Secondary ink  | `#5d6470` (5.96:1)        | `--color-ink-2: #525358` (7.67:1)            | AA but not AAA. This audience reads magnified and with low vision as the norm, so the muted text tier is held at AAA.                         |
| Focus ring     | `3px solid #2E4699`       | white outline + `--color-ink` halo           | The brand blue ring is 1.0:1 against a brand-blue button — literally invisible on every primary CTA. SC 2.4.13 / 1.4.11 failure.              |
| Body / UI type | 13–15px, 12px on mobile   | `--text-body: 16px`, `--text-ui: 16px` floor | Below the project floor. The 18px body became 16px with the owner's typography override; the 16px FLOOR is untouched.                         |
| Target size    | steppers/chips under 24px | 48px minimum in `@layer base`                | WCAG 2.5.8 asks 24px; 48 is a project rule because tremor and reduced motor precision are common here. Prose links keep the inline exception. |

`prefers-reduced-motion` is also handled in `@layer base`; the prototypes declare
it nowhere.

**The one exemption from the 48px floor is `.target-48`**, and only inside
`.checkout` / `.cart`: the control keeps the paint the design asks for and gets a
centred, invisible 48×48 hit area back on top. As of **2026-08-20 the selector
enforces that deal**. It used to read `:is(.checkout, .cart) :is(button, [type=
checkbox], [type=radio])`, which un-layered `min-height: 0` onto every button in
both scopes and silently beat each one's `min-h-*` utility — the cart's "Vai alla
conferma" asked for 52px and painted 24. Two consequences to keep in mind: a button
in those scopes that asks for a height now gets it, and a control that DOES wear
`.target-48` must express its paint as `h-*`, because its `min-height` is zeroed by
design.

## The product card (locked)

`src/components/catalog/ProductCard.astro`, built 1:1 from the approved
reference at `docs/visual/examples/product-card/reference.html`. The design went
through four review rounds and is **locked** — change it only with a new approved
reference, not by taste.

Anatomy, top to bottom:

1. **Stage** — a 4:3 tint well (`aspect-4/3`, gradient `#f7f9fd → --color-tint`)
   carrying **nothing but the product**: no category chip, no status pill, no
   text overlay. The photo is `absolute inset-0` + `object-contain` +
   `mix-blend-multiply` — absolutely positioned because in-flow content
   participates in an `aspect-ratio` box's sizing and inflates it.
2. **Name** — Inter 18px/700, two-line clamp, **no** minimum-height floor (feet
   align via the auto margin on the divider, so a one-line name leaves no hole).
3. **Blurb** — `shortDescription`, 15px, two-line clamp.
4. **Chips** — quiet tint pills, 14px/500, **one line only**: the row is
   `h-7.5 overflow-hidden`, so a chip that does not fit is cropped, never
   wrapped. The full spec sheet lives on the detail page.
5. **Divider** — one hairline, full-bleed edge to edge, outside the padding.
   `mt-auto` on it pins the foot so every foot in a row aligns.
6. **Foot** — price (24px/700 tabular amount + 14px unit, one baseline, **no
   "da" prefix**, no minimum-rental line) and a bordered button that fills with
   accent on card hover. The button is a styled `<span>`: the whole card is one
   link, and a link inside a link is a second tab stop to the same page.

**Out of stock renders dead**: no price, a flat full-width "Esaurito" plate
instead of the button, muted art and name, and every hover affordance scoped
away — a dead card must not breathe.

**Grids are 3-up** (`wide:grid-cols-3`), never 4: the reference card is ~377px
wide, which is exactly three columns in the 1244px container. At 4-up the foot
has to stack. Applies to the catalogue, search and the home rail.

**Type on the card**: one family (Inter), five sizes — 14 / 15 / 16 / 18 / 24 —
weights 400/500/700 carry the hierarchy. The 14/15px rows are the one sanctioned
exception to the 16px floor.

**Chips come from the list API**, already resolved to the reader's locale:
`PublicProductSummaryDto.chips`. Their source is the product's own
`products.chips` jsonb — at most five back-office claims of ≤20 characters
("Portata 170 kg", "Consegna in 48 h"), written in the admin's Basics tab and
described in `packages/db/src/schema/chip-types.ts`.

A product with no chips of its own falls back to the pre-chip behaviour: at most
three comparable specs collapsed server-side to short strings ("120 kg",
"Pieghevole") in `apps/server/src/modules/products/mapper.ts`. Booleans read as
their label and only when true — "Sì" alone tells a shopper nothing. The
fallback exists so an unedited catalogue still looks finished; it is not the
target state, because a spec is written to be filtered and compared, which is a
different job from selling the product in four words.

## Media standard — one frame, one master

The display **frame** for product imagery is **4:3 everywhere**: card stage,
product-detail gallery and its thumbnails, hero spotlight, request-summary
thumbnail. Always `aspect-4/3` + `object-contain` on tint — the container keeps
its ratio regardless of the source image, never cropping or stretching it. The
upload **master** is **1:1 square** (the industry standard for product
photography), 2048×2048; video is the one 16:9 surface (1080p, ≤30 MB). Caps
mirror `MEDIA_PROFILES` in `packages/validators/src/media.ts` — the server
already re-encodes photos to WebP at max 2048px.

| Asset         | Ratio | Recommended upload                             |
| ------------- | ----- | ---------------------------------------------- |
| Gallery photo | 1:1   | 2048×2048 (never below 1200×1200), neutral bg  |
| Thumbnail     | 1:1   | Same standard — usually the first gallery shot |
| Clean PNG     | 1:1   | 2048×2048 PNG with transparency, product ~90%  |
| Video         | 16:9  | 1920×1080 MP4 H.264+AAC or WebM, ≤30 MB        |
| Icons         | 1:1   | SVG preferred; raster 256×256 / ≤1024 addons   |
| Documents     | —     | PDF ≤15 MB                                     |

## Rendering split

`output: 'static'` with the Node adapter, so a page is prerendered unless it
opts out.

| Route                   | Mode        | Why                                                                                                                                          |
| ----------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                     | prerendered | Marketing. Fastest thing we can serve.                                                                                                       |
| `/assistenza/`          | prerendered | Static copy plus the FAQ.                                                                                                                    |
| `/catalogo/`            | on demand   | Category directory when bare; a listing across both modes once `?category` or `?q` narrows it.                                               |
| `/catalogo-noleggio/`   | on demand   | Rental listing. Reads `?category`, `?sort`, `?page`.                                                                                         |
| `/catalogo-vendita/`    | on demand   | Sale listing. Same query state as the rental one.                                                                                            |
| `/prodotto/[slug]/`     | on demand   | Stock, price and specifications must not be stale.                                                                                           |
| `/cerca/`, `/carrello/` | on demand   | Reads query state; `noindex`.                                                                                                                |
| `/[terms]/`             | on demand   | Resolves a published legal document by slug.                                                                                                 |
| `/404`                  | on demand   | **Required**: Astro forbids rewriting from an on-demand route to a prerendered one, and both the product and terms routes `rewrite('/404')`. |

Reads on prerendered pages go through `safely()` in `src/lib/catalog.ts`, which
logs and returns a fallback. A content deploy must not depend on database uptime;
the sections that need data hide themselves when the list comes back empty.

## Zero-JavaScript patterns worth knowing

The storefront ships no framework islands. Svelte stays configured, but the only
client scripts on the whole site are the search suggestion panel and the product
page's enhancement script (gallery thumbnails, quantity stepper, and the order
panel's display estimate — see the product detail page section). Several
interactive pieces are pure CSS, and each has a trap:

**The hero spotlight** is four radios driving one track. Every state class lives
on the wrapper `<div>`, not on the `<ul>`, and reaches the track through
`[&>ul]`: a `peer-*` variant compiles to `.peer:checked ~ .target`, so the target
has to be a **sibling** of the radios. Put them on the `<ul>` and nothing matches,
silently. Each radio carries two peer names — a shared `spot` so that focusing any
of them rings the track (they are `sr-only`, so without it there is no focus
indicator at all), and a per-slide `sN` for the transform. Off-screen slides are
`invisible`, not merely clipped, so their links are not focusable.

**The option pills and add-on cards** on the product page are a `peer` input
immediately followed by its label, so the whole selected state is variants on
the label. Any mark (tick, filled box) is a real element toggled by an arbitrary
variant like `peer-checked:[&_[data-box]_svg]:opacity-100` — **never** a
`content-['✓']` pseudo-element. Tailwind's arbitrary-value parser drops the
unicode escape and you get an empty string with no error.

**The FAQ rows** are native `<details>`, with the chevron rotated by
`group-open:rotate-180`.

## Data layer

`src/lib/catalog.ts` wraps the `hc<AppType>` RPC client. Every shape is inferred
via `InferResponseType`, so a DTO change on the server surfaces as a type error
here rather than as a runtime surprise on a rendered page. Locale is always
`it` — the server applies the `en → it` fallback per field.

`listAllProducts()` walks the collection because `perPage` is capped at 100 by
the API. It throws past a page guard rather than shipping a silently truncated
catalogue.

Two API-shape notes that bite:

- The product list filters on category **`code`**, while a product summary
  carries its category **`slug`**. Chips link by code; the home grid counts by
  slug.
- Public media items expose `path`, `mimeType` and `alt` — no dimensions. So
  every image sits in an `aspect-ratio` box with `object-fit: contain` instead of
  carrying `width`/`height` attributes. That is what holds CLS at zero. Never a
  fixed height: a fixed height silently changes the ratio per column width.

`cardPrice()` already returns the unit inside `text` ("35,00 € al giorno"). Do not
append "/giorno" in a template. The product card is the exception: it composes
`formatMoney()` + `perUnitLabel()` itself, because the amount and the unit render
at different sizes on one baseline.

## The rental request wire format

`src/lib/request-config.ts` owns it, and both sides import from there — the buy
box that writes a configuration and the summary page that reads it back. A
renamed field would otherwise fail silently, dropping a customer's choice with
no error anywhere.

```text
/carrello/?product=<slug>
  &question.<questionKey>=<answer>    // repeats for multi_select; boolean is yes|no
  &addon=<addonId>                    // repeats
  &addon.<addonId>=<n>                // how many, only when that addon allows more than one
  &package=<packageCode>              // REQUIRED on a rental: it is the price
  &from=YYYY-MM-DD                    // start only — the end is derived from the package
  &time=HH:MM                         // only when the chosen package is quoted in hours
  &qty=<1..10>
```

The keys are English: a wire format is read by a program, never by a customer, so
it is code and follows the English rule in AGENTS.md. Public route paths are the
opposite case and deliberately stay Italian. The catalogue's browse params were
renamed the same way — `category`, `sort`, `area`, `from`.

`PdpQuestions.astro` renders one control per value shape, and covers all of
them explicitly — `single_select` as radio pills,
`multi_select` as checkbox pills, `boolean` as a Sì/No pair,
`number`/`number_range` as a numeric field, `string` as a text input. A shape
with no branch would vanish from the form with no error, which is why there is
no `default` fallthrough.

`resolveRequest()` maps the URL back to the labels the customer actually saw.
Unknown group keys, option values and package codes are **dropped, never
echoed**: the resolved text is rendered on the page and pushed into a `wa.me`
link, so a value that does not correspond to a real option has no business
appearing as if it did. Free text survives, but stripped of control characters
and capped. An add-on quantity above what that add-on allows is clamped rather
than rejected — this resolver renders what a customer can still act on, and the
server sees the clamped figure.

There is **no return-date key**. `resolveRequest()` derives the period with
`resolvePeriod()` from `@mia/pricing` — the same function the server writes onto
the order — so the start date and the package's duration are the only inputs and
the two sides cannot disagree about when the thing comes back.

`ResolvedEntry` carries the price effect twice: `note` is the formatted string a
page renders, `amount` the same effect as a number, already multiplied out. The
second one exists so the checkout estimate can price a resolved request without
re-walking the product and re-validating the URL — this function has already
dropped everything that is not a real option, and a second pass would be a
second chance to disagree with it.

It is a GET form because there is no SERVER-side cart or orders endpoint on the
API yet. There is now a client-side cart — see
[storefront-cart.md](./storefront-cart.md) — which speaks exactly the indexed form
below, and the buy box's second button feeds it. When
one lands this becomes a POST with a session-bound CSRF token, and the server
re-resolves the configuration before pricing. The field names carry over.

`/checkout/` extends this format rather than replacing it: the same field names,
optionally prefixed `item.<n>.` to describe more than one line item, so a cart
needs no second vocabulary and the single-item URL above is accepted unchanged. A
cart sends them as a POST body rather than a query string. See
[storefront-checkout.md](./storefront-checkout.md).

## The product detail page (owner's reference design)

`/prodotto/[slug]/` does NOT follow Variante B. Its spec is the owner-authored
Claude Design file — project "Product details page design", file
`Product Details.dc.html` — and it was deliberately released from the design
system above. What carries over from the site is the brand accent `#3846b1`
(applied through the reference design's own `accentColor` prop), the ink/hair
palette, and the focus-ring convention; everything else (the type stack via
`--font-pdp`, sub-16px secondary text, pill options, numbered sections) is the
reference design's own language. Do not "correct" the PDP back toward Variante
B tokens.

`/checkout/` is released the same way, from the same Claude Design project, and
carries over the same three things and nothing else. It is documented separately
in [storefront-checkout.md](./storefront-checkout.md); read this section first,
because the reasoning is shared.

Structure: breadcrumb → hero (gallery + identity with the product's chips, or
comparable specs where none are written) →
`01 Extra` (checkbox cards) → `02 Per la
consegna` (intake questions) → `03 Scheda tecnica` (icon tiles with
initial-letter fallback) → information tabs → one sticky order panel, the only
elevated card on the page. One native GET form wraps both columns.

Pricing semantics, per the owner's rule: **a rental IS its package**. The
package the customer picks is the price for its duration, and nothing modifies
it — a product has no configurable axes, so there is nothing to add on top.
A rental-mode add-on is the exception that does multiply — `price ×
quantity ×` the package duration read in the add-on's own unit, rounded up to a
whole unit, because half a day of insurance is still a day of it. The figure
under the product title is the `marketingRate`, which is COPY: the back office
typed it, no total reads it, and it sits there precisely because nothing has
been chosen yet.

The order panel is a **display estimate only**: the page script mirrors the
form into the total, the period badge and the line items; `/carrello/`
re-resolves the request server-side and the phone call confirms the real price.
Without JavaScript everything still submits — the panel simply shows the
initial server-rendered state, which is the product at its default variant
choices and nothing else. Add-ons could once mark themselves required and were
summed into that figure before the customer chose anything; every add-on is
opt-in now, so the starting price is the product's own.

Three tricks worth knowing before touching it:

- **The calendar is an enhancement, never the source of truth.**
  `PdpDatePicker.astro` renders the reference design's summary card and
  calendar popover **and** one plain `<input type="date">`. The native row is
  what the server sends; the card and popover ship with the `hidden` attribute,
  and the page script swaps them only once it has mounted, so the
  no-JavaScript path is a complete control rather than a degraded one. The
  calendar never holds state: it writes through that same input and dispatches
  `change`, which is why the estimate and the derived return keep working
  without knowing it exists. A `display:none` input still submits — only
  `disabled` suppresses it — so `from` reaches `/carrello/` in both modes. The
  start-TIME row sits outside both blocks, because it is needed in both: an
  hour package cannot be ordered without one and the calendar has no cell for
  it.
  Visibility is the `hidden` **attribute** alone: Tailwind's preflight makes
  `[hidden]` `display:none !important`, so a `hidden` utility class on the
  popover would survive the attribute being removed and silently keep it
  collapsed. The popover is deliberately wider than the panel column
  (7 × 48px targets + gaps + padding = 368px) and breaks out symmetrically,
  because seven 48px cells do not fit inside it.
- **The detached-form escape.** The info-tab radios carry `form="pdp-detached"`,
  an id that exists nowhere. A control whose `form` attribute matches no element
  has no form owner, which keeps purely-presentational inputs out of the GET
  submission while they sit inside the form element. The package **radios**
  deliberately do NOT carry it — they are real fields (`package`), and required
  ones.
- **The return date is calculated, not picked.** The package carries the
  duration, so the panel shows the end rather than asking for it, and there is
  no way to put the two in disagreement. The CTA stays disabled until a rental
  has both a package and a start date, because the API refuses that line — the
  page that can still fix it should say so.
- **An unticked add-on's quantity input is `disabled`, not merely hidden.**
  `hidden` still submits, and the cart stores this query string, so an untouched
  extra would leave a stray quantity in storage for as long as the line lives.

The panel closes on the reference's aggregate review line, which reads from the
same `REVIEW_AGGREGATE` adapter as the home band so the storefront can never
show two different ratings. For the same reason as that band it is deliberately
**not** emitted as `AggregateRating` structured data: the figure has no governed
source yet, and a stale one is a Google policy problem rather than an
inaccuracy.

Deviations from the reference file, all business-driven: copy is Italian; the
CTA stays "Richiedi il noleggio" (no online payment exists); the city selector
is dropped from the calendar popover (one service area, and street-level detail
is section 03's job). The panel carries one element the reference has no need
of, the quantity stepper (`qta`). Nothing else may be added to it: the owner
has removed the hygiene/delivery trust line, the "nessun pagamento online"
footnote and the phone CTA from this panel specifically, and the hero's
in-stock badge, because the panel is meant to read exactly as the reference
does. Put new reassurance copy somewhere other than the order panel.

**Never pair a Tailwind reset with a utility from the same family in one
`class:list`.** A section row wrapped in a `<fieldset>` invites
`class:list={['border-0 p-0', rowCard]}` — but `border-0`/`border` and
`p-0`/`px-4.5 py-3.5` are the same utility families, and Tailwind settles the
clash by its own canonical stylesheet order, not by the order written in the
attribute. The resets won, and every such row rendered with no card border and
no padding while the plain rows beside them kept theirs. State the border and
padding once, in `rowCard`.

## The home hero (owner's reference layout, 2026-08-27)

The owner supplied a competitor hero as the layout reference and asked for its
composition with this system's paint. What that resolved to, decision by
decision — read this before moving anything in `HomeHero`, `HomeShowcase`,
`HomeBooking` or `HomeTrustBar`.

**The shape.** One pale `--color-surface` band holds copy left and the featured
product right; the white booking card straddles the band's bottom edge; the
trust strip closes under it on white. The straddle is `--hero-overlap`, read
twice — by the band's bottom padding and by `.hero-foot`'s negative top margin.
Change one and the card slides off the seam.

**The booking bar moved into the hero** and stopped being a section. There is
still exactly one search bar on the site; it just lives where the reference puts
it, and its arrowed section heading became the card's own title.

**Four things the reference does in colour, this system does otherwise:**

| Reference                                     | Here                                                                                      |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Headline lines 2–3 in the second brand colour | Same lines at weight 760. One accent, spent on actions.                                   |
| Outlined field boxes                          | Filled wells (`--color-surface` on the card's white) — controls are fills, never borders. |
| A shadow under the price card                 | A hairline. The page's one resting shadow is the booking card's.                          |
| "BEST PRICE" sticker                          | The same disc, saying something the business can stand behind.                            |

**The booking controls use the shared primitives.** `Dropdown.astro` and
`DatePicker.astro` render native fields as the server and form source of truth,
then reveal their restylable controls after JavaScript mounts. Cally owns the
accessible calendar grid; the shared Floating UI adapter positions temporary
surfaces without changing document height. On desktop it prefers the bottom,
flips above when space runs out, and constrains any remaining overflow to the
viewport. On phones the calendar is a fixed full-screen surface. Every choice
writes through the native field and dispatches `change`, so `area` and `from`
reach the catalogue identically with or without JavaScript.

**The zone is no longer `required`.** A `hidden` required control is
unfocusable, so Chrome refuses the submit and shows the message nowhere — the
silent block the rules forbid. The zone is carried context, not a filter, and
the catalogue is complete without it.

**The product never runs under the price card.** `.spot-track img` carries a
right padding wider than the card's lane, because a photo disappearing behind a
floating panel reads as a cropped photo. The carousel's arrows and dots sit in
the image's bottom-left corner — the reference shows one product and needs
neither; this hero shows three.

## Deliberate deviations from the prototype

- **Phones keep a bottom navigation.** Variant B hides the inline navigation
  below 720px and offers no mobile alternative, which would leave phone users
  with no navigation at all. `MobileNav` stays, restyled into the same
  hairline-and-tint vocabulary.
- **No bounded 430px mobile column.** The previous design bounded the whole body
  on phones; Variant B is fluid and its full-bleed bands and closing footer fight
  a capped column.
- **Category browse is a wrapped grid of links, not a horizontal scroller.** At
  200% zoom and 400% reflow the right-hand items of a 15-item overflow scroller
  become undiscoverable, and it reintroduces horizontal scrolling.
- **Pagination is real `<a>` links with `rel=prev/next`.** Infinite scroll breaks
  sort coherence across pages, breaks the back button, and leaves later products
  unindexed.
- **The mobile product bar sits above the bottom navigation**, offset by
  `--spacing-mobile-nav`. The two heights live in `@theme` precisely so they
  cannot drift; the original gave both `bottom: 0` and the same z-index, so one
  of the two was always unusable.
- **The header bar wraps.** The prototype's fixed row overflows horizontally at
  200% zoom.
- **The free-phone pill is tinted, not green.** The design keeps one accent
  family; green is reserved for availability and "incluso".
- **The buy box labels every control in sentence case.** The uppercase field
  label belongs to the home search panel and nowhere else.
- **No `AggregateRating` in JSON-LD.** The review aggregate on the home page has
  no governed source yet, and a stale aggregate rating in structured data is a
  Google policy problem rather than a mere inaccuracy.

## The catalogue is three surfaces (owner, 2026-08-30)

The catalogue used to be one page that did everything: a search field, a sort
control, a chip row of every category and a product grid, all at once. It is now
three destinations sharing one masthead and one pill row, so moving between them
changes the body and never the furniture.

| Surface                          | Body                                              |
| -------------------------------- | ------------------------------------------------- |
| `/catalogo/`                     | Category directory — a tile per category, priced. |
| `/catalogo/?category=…` or `?q=` | Product listing across both pricing modes.        |
| `/catalogo-noleggio/`            | Product listing, `mode=rental`.                   |
| `/catalogo-vendita/`             | Product listing, `mode=fixed`.                    |

The rule that makes this coherent: **the whole catalogue is a directory until
something narrows it.** A grid of category tiles is no answer to "show me the
wheelchairs", so the moment a category or a query arrives the same route renders
the listing instead.

Everything is composed from `views/catalog/CatalogPage.astro`, which the three
page files are thin shims over; the query state and the tile model live in
`lib/catalog-page.ts`. `MODE_FOR_VIEW` is the only place a surface becomes an API
filter.

Three consequences worth knowing:

- **No search field and no sort control on a catalogue surface.** Both live on
  `/cerca/`, and the catalogue masthead's field posts there. Sorting and a typed
  query exist once, in one place, rather than half of them on each surface
  answering slightly differently.
- **`CatalogListing` takes an optional `heading`.** With one it renders a title
  and drops the count to a line beneath; without one the count IS the heading,
  because on a listing that is the whole page the count says everything a title
  would.
- **The pill row is static** — all, one pinned category, rental, sale
  (`PINNED_CATEGORY_CODE` in `lib/catalog-page.ts`). It is navigation, not a
  leaderboard: a pill that moved as the catalogue grew would change what the
  second item means between two visits.
- **A category tile prices itself.** `/api/categories` now carries a `summary`
  per category — the product count plus the cheapest headline figure inside,
  computed with the same expression the product card prints, so a tile and the
  cheapest card under it can never disagree. A category whose products carry no
  figure at all falls back to its count.

### "I più richiesti" is a real counter

`products.order_count` is bumped inside the order-placement transaction, once per
order rather than per unit, and never decremented — it ranks demand, it is not a
count of open orders. It is denormalised on purpose: it is the default sort on
`/cerca/`, and a `GROUP BY` over `order_items` on every page of every listing
would scan the whole order history to paint a grid. Migration `0010` adds it and
backfills from the existing order lines, so the ranking is truthful on day one.

### Support moved out of the nav

The header nav is Home · Catalogo · Noleggio · Vendita · Cerca · Blog. Support
left it for `SupportLauncher`, pinned bottom-right of every page: a nav item cost
a slot the catalogue needed and still landed the customer on a page they then had
to read. The launcher is a `<details>`, so it opens, closes and takes focus with
no JavaScript; the script only adds Escape and outside-click. It clears the
phone's bottom navigation and stands down entirely on the product page, where the
price bar already fills that corner.

## Known gaps

- **No SERVER-side cart or orders endpoint.** `/carrello/` is now a real
  multi-item cart, but it is persisted in the browser (`localStorage`), so it does
  not survive a device change and the header count cannot be server-rendered. A
  `/api/cart` read/write model is still missing. See
  [storefront-cart.md](./storefront-cart.md).
- **Home FAQ, reviews and the review aggregate are hardcoded.** The copy itself
  now lives in `i18n/{it,en}.json` so both languages have it, but the running
  order and the review figures are still in `src/lib/home-content.ts`. This is
  editorial content and belongs in the back office as page sections plus a
  governed reviews source. The legacy WordPress theme made exactly this mistake —
  FAQ JSON-LD in `functions.php` — and the copy drifted from the page.
- **No English product content.** Every page's chrome is bilingual, but
  `product_translations` and `category_translations` carry `it` rows only, so
  `/en/*` lists Italian titles and descriptions. The plumbing is already there —
  `listProducts(…, locale)` asks for English — so this is back-office data entry,
  not a code change. See
  [storefront-languages.md](./storefront-languages.md) and
  [wp-migration.md](./wp-migration.md).
- **Organisation facts are hardcoded** in `src/lib/site.ts` (phone, WhatsApp,
  email, addresses, VAT). These belong to a `/api/site` read model so the
  storefront, JSON-LD and the back office cannot drift.
- **`area` and `from` from the home search are not filters.** The API matches on
  text, category and pricing mode only, and nothing knows which units are out on
  which dates. They are carried in the URL so the product page can prefill the
  start date and the confirmation call knows where to deliver. `durata` is gone
  with the sentence that echoed it back (owner, 2026-08-30).
- **The footer's rental headings are editorial labels**, pointing at a catalogue
  search rather than at category records — the footer renders on every request
  and fetching the category tree there would add a round trip for four labels.
- **The footer logo is knocked out with `brightness-0 invert`.** The brand mark
  is blue on transparent and disappears on the dark footer; production wants a
  dedicated white file.
