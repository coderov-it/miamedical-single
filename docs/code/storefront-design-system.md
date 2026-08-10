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
- **Nothing below 16px.** There is no type token smaller than `--text-ui: 1rem`.
  The one sanctioned exception is the product card's data rows (14/15px) — a
  locked design decision, scoped to the card. See "The product card".

## The design language, in five rules

Variant B is a system of very few moves. Breaking one of them is what makes a
new page look like it belongs to a different site.

1. **Sections separate by alternating white and a band of `--color-tint`**, a
   very pale blue derived from the brand blue. The tint appears as whole bands
   and as small fills — never smeared over every individual panel.
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
5. **One shadow on the whole site**, under the home search panel: wide and almost
   invisible. Everything else is the hairline.

The page closes by descending: the "parla con noi" band on `--color-accent-deep`,
then the footer on `--color-footer`. Two steps of the same brand blue, not two
different blues.

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

`*:focus-visible` is a white `outline` **and** a 6px ink `box-shadow`. Two paints,
because a single brand-blue ring is 1.0:1 against a brand-blue button and
therefore invisible on every primary CTA; this pair survives white, tint, brand
blue, the dark band and the footer alike.

The trap: `focus:outline-none` — the reflex when a control shouldn't ring — takes
the white band away and **leaves the ink shadow**, drawn tight around the
element. Four search fields had exactly that, so focusing them painted a fat
black slug where a ring should be: worst on a native date input, where the black
band wrapped the `gg/mm/aaaa` text itself. Opting out means both:

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

### Fonts

**Lexend** for headings and UI (designed to improve reading proficiency) and
**Atkinson Hyperlegible** for body (designed by the Braille Institute to maximise
character distinction for low-vision readers). All fonts are self-hosted in
`public/fonts/`, declared in `app.css` and preloaded by `BaseLayout`. Do not
substitute a generic sans.

**Inter** (`--font-card`, utility `font-card`) is the third face, for the product
card and commerce UI only: a neutral grotesque with proper tabular numerals for
prices and full Italian diacritics. It never replaces Lexend as the display face
or Atkinson as the prose face.

The ink is deliberately soft: `--color-ink: #2e3237` (12.9:1) — never 100% black,
which stings on a bright screen, and never navy. The tint/hairline family stays a
dilution of the brand blue.

## Deliberate corrections to the prototype

Where a prototype value fails an accessibility rule, the token holds the
**corrected** value and records the original beside it. Do not "restore" a design
value over a correction without resolving it with the designer first.

| What           | Prototype                 | Token                                        | Why                                                                                                                                           |
| -------------- | ------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Secondary ink  | `#5d6470` (5.96:1)        | `--color-ink-2: #49536b` (7.68:1)            | AA but not AAA. This audience reads magnified and with low vision as the norm, so the muted text tier is held at AAA.                         |
| Focus ring     | `3px solid #2E4699`       | white outline + `--color-ink` halo           | The brand blue ring is 1.0:1 against a brand-blue button — literally invisible on every primary CTA. SC 2.4.13 / 1.4.11 failure.              |
| Body / UI type | 13–15px, 12px on mobile   | `--text-body: 18px`, `--text-ui: 16px` floor | Below the project floor.                                                                                                                      |
| Target size    | steppers/chips under 24px | 48px minimum in `@layer base`                | WCAG 2.5.8 asks 24px; 48 is a project rule because tremor and reduced motor precision are common here. Prose links keep the inline exception. |

`prefers-reduced-motion` is also handled in `@layer base`; the prototypes declare
it nowhere.

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
| `/catalogo-noleggio/`   | on demand   | Reads `?q`, `?categoria`, `?ordina`, `?page`.                                                                                                |
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
  &variant.<groupKey>=<optionValue>   // repeats for multi_select
  &question.<questionKey>=<answer>    // repeats for multi_select; boolean is yes|no
  &addon=<addonId>                    // repeats
  &package=<packageCode>              // optional fixed-duration bundle, by stable code
  &from=YYYY-MM-DD&to=YYYY-MM-DD      // return date optional: open-ended rentals are normal
  &qty=<1..10>
```

The keys are English: a wire format is read by a program, never by a customer, so
it is code and follows the English rule in AGENTS.md. Public route paths are the
opposite case and deliberately stay Italian. The catalogue's browse params were
renamed the same way — `category`, `sort`, `area`, `from`, `duration`.

`PdpConfigure.astro` and `PdpQuestions.astro` render one control per value
shape, and cover all of them explicitly — `single_select` as radio pills,
`multi_select` as checkbox pills, `boolean` as a Sì/No pair,
`number`/`number_range` as a numeric field, `string` as a text input. A shape
with no branch would vanish from the form with no error, which is why there is
no `default` fallthrough.

`resolveRequest()` maps the URL back to the labels the customer actually saw.
Unknown group keys, option values and package codes are **dropped, never
echoed**: the resolved text is rendered on the page and pushed into a `wa.me`
link, so a value that does not correspond to a real option has no business
appearing as if it did. A return date before the start date is dropped the same
way. Free text survives, but stripped of control characters and capped. Required
add-ons are re-added from the product rather than trusted from the URL, because
a disabled checkbox is not submitted.

`ResolvedEntry` carries the price effect twice: `note` is the formatted string a
page renders, `amount` the same effect as a number, already multiplied out. The
second one exists so the checkout estimate can price a resolved request without
re-walking the product and re-validating the URL — this function has already
dropped everything that is not a real option, and a second pass would be a
second chance to disagree with it.

It is a GET form because there is no cart or orders endpoint on the API yet. When
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
system above. What carries over from the site is the brand accent `#2e4699`
(applied through the reference design's own `accentColor` prop), the ink/hair
palette, and the focus-ring convention; everything else (Instrument Sans via
`--font-pdp`, sub-16px secondary text, pill options, numbered sections) is the
reference design's own language. Do not "correct" the PDP back toward Variante
B tokens.

`/checkout/` is released the same way, from the same Claude Design project, and
carries over the same three things and nothing else. It is documented separately
in [storefront-checkout.md](./storefront-checkout.md); read this section first,
because the reasoning is shared.

Structure: breadcrumb → hero (gallery + identity with the product's chips, or
comparable specs where none are written) →
`01 Configura` (variant pills) → `02 Extra` (checkbox cards) → `03 Per la
consegna` (intake questions) → `04 Scheda tecnica` (icon tiles with
initial-letter fallback) → information tabs → one sticky order panel, the only
elevated card on the page. One native GET form wraps both columns.

Pricing semantics, per the owner's rule: **on a rental product, every modifier
is per rental unit** — variant option modifiers, per-unit number modifiers and
rental-mode add-ons all bill in the product's `rentalUnit`, so one duration
multiplies every amount. The addon service enforces the unit
(`invalid_addon_rental_unit`). Rental packages are a fixed total for a fixed
duration; the estimate adds `(configured rate − base rate) × duration` on top
and shows the strikethrough/savings claim only when the package unit equals the
product unit.

The order panel is a **display estimate only**: the page script mirrors the
form into the total, the period badge and the line items; `/carrello/`
re-resolves the request server-side and the phone call confirms the real price.
Without JavaScript everything still submits — the panel simply shows the
initial server-rendered state (defaults + required add-ons).

Three tricks worth knowing before touching it:

- **The calendar is an enhancement, never the source of truth.**
  `PdpDatePicker.astro` renders the reference design's summary card and
  range-highlighting calendar popover **and** the two plain
  `<input type="date">` fields. The native row is what the server sends; the
  card and popover ship with the `hidden` attribute, and the page script swaps
  them only once it has mounted, so the no-JavaScript path is a complete
  control rather than a degraded one. The calendar never holds state: it
  writes through those same inputs and dispatches `change`, which is why the
  estimate, the package auto-fill and the unpick rule below all keep working
  without knowing it exists. A `display:none` input still submits — only
  `disabled` suppresses it — so `dal`/`al` reach `/carrello/` in both modes.
  Visibility is the `hidden` **attribute** alone: Tailwind's preflight makes
  `[hidden]` `display:none !important`, so a `hidden` utility class on the
  popover would survive the attribute being removed and silently keep it
  collapsed. The popover is deliberately wider than the panel column
  (7 × 48px targets + gaps + padding = 368px) and breaks out symmetrically,
  because seven 48px cells do not fit inside it.
- **The detached-form escape.** The info-tab radios and the package-popover
  checkbox carry `form="pdp-detached"`, an id that exists nowhere. A control
  whose `form` attribute matches no element has no form owner, which keeps
  purely-presentational inputs out of the GET submission while they sit inside
  the form element. The package **radios** deliberately do NOT carry it — they
  are real fields (`pacchetto`).
- **The return date is optional by design.** Medical rentals often end "when
  recovery ends"; an empty `al` renders the per-unit rate with "periodo da
  definire" and the call settles it. Picking a package auto-fills the return
  date; hand-editing the return date unpicks the package.

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
`class:list`.** The Configure rows are a `<fieldset>`, so the instinct is
`class:list={['border-0 p-0', rowCard]}` — but `border-0`/`border` and
`p-0`/`px-4.5 py-3.5` are the same utility families, and Tailwind settles the
clash by its own canonical stylesheet order, not by the order written in the
attribute. The resets won, and every variant row rendered with no card border
and no padding while the number/text rows beside them kept theirs. State the
border and padding once, in `rowCard`.

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

## Known gaps

- **No cart or orders endpoint.** `/carrello/` is a request summary read from the
  URL, not a persisted cart. See the wire format section.
- **Home FAQ, reviews and the review aggregate are hardcoded** in
  `src/lib/home-content.ts`. This is editorial content and belongs in the back
  office as page sections plus a governed reviews source. The legacy WordPress
  theme made exactly this mistake — FAQ JSON-LD in `functions.php` — and the copy
  drifted from the page.
- **Organisation facts are hardcoded** in `src/lib/site.ts` (phone, WhatsApp,
  email, addresses, VAT). These belong to a `/api/site` read model so the
  storefront, JSON-LD and the back office cannot drift.
- **Category chips carry no product count**, unlike the design. It would cost one
  API request per category; the header shows the result total for the current
  filter instead.
- **`zona`, `dal` and `durata` from the home search are not filters.** The API
  matches on text, category and price only. They are carried in the URL and
  echoed back on the catalogue as "la tua richiesta", because they are what the
  confirmation call needs to know.
- **The footer's rental headings are editorial labels**, pointing at a catalogue
  search rather than at category records — the footer renders on every request
  and fetching the category tree there would add a round trip for four labels.
- **The footer logo is knocked out with `brightness-0 invert`.** The brand mark
  is blue on transparent and disappears on the dark footer; production wants a
  dedicated white file.
