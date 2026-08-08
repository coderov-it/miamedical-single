# Storefront design system

Everything under `apps/website/`. The design is a port of the approved
M.I.A. Medical Italia storefront prototypes, previously implemented in the
WordPress-backed Astro frontend at `../miamedical/frontend`. This document
carries the reasoning that would otherwise be twenty-line comment blocks in a
dozen files.

Nothing here is shared with `apps/admin`. The admin is shadcn-svelte on
Tailwind; the storefront has no Tailwind at all (see below). They are separate
apps that happen to talk to the same API.

---

## The audience is the constraint

The customers are predominantly elderly, often on old devices, frequently using
browser magnification or a screen reader, and a large share of them would rather
phone than fill in a form. Type size, contrast, target size and a visible phone
number are therefore functional requirements, not styling preferences.

Three consequences that look like over-engineering until you know that:

- **A phone call is a successful conversion.** `PhoneCta` appears in the header,
  the catalogue empty state, the product help card, the 404 page, the support
  page and the footer. It is never framed as a fallback.
- **No payment happens online.** The customer configures a product, sends a
  request, and price and delivery are agreed on the call. The buy box CTA is
  "Richiedi il noleggio", never "Paga".
- **Nothing below 16px.** There is no type token smaller than `--fs-ui: 1rem`.

## Token layer, and where it deliberately overrides the design

`src/styles/tokens.css` → `src/styles/base.css`, imported once by `BaseLayout`.
`src/styles/commerce.css` is imported only by `carrello.astro`.

The tokens carry corrections to the original prototypes. Where a design value
failed an accessibility rule, the token holds the corrected value and records the
original beside it. Do not "restore" a design value over a correction without
resolving it with the designer first. The four that matter:

| What           | Prototype                 | Token                                                             | Why                                                                                                                                                        |
| -------------- | ------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focus ring     | `3px solid #2E4699`       | white inner outline + dark halo (`--focus-ring` + `--focus-halo`) | The brand blue ring is 1.0:1 against brand-blue buttons — literally invisible on every primary CTA. SC 2.4.13 / 1.4.11 failure.                            |
| Body / UI type | 13–15px, 12px on mobile   | `--fs-body: 18px`, `--fs-ui: 16px` floor                          | Below the project floor.                                                                                                                                   |
| Muted text     | `#8A93A8` (3.08:1)        | `--c-ink-muted` = `--c-ink-secondary` (7.68:1)                    | Failed 1.4.3. The muted _text_ tier was removed rather than adding a fourth grey; `--c-ink-decorative` keeps the light tone for aria-hidden chevrons only. |
| Target size    | steppers/chips under 24px | `--target-min: 48px`, `--target-gap: 8px`                         | WCAG 2.5.8 asks 24px; 48 is a project rule because tremor and reduced motor precision are common here. Prose links keep the inline exception.              |

Two structural pieces also live in `base.css`: the bounded 430px mobile column on
a darker outer canvas (`html`/`body` under 720px), and `prefers-reduced-motion`
handling, which the prototypes did not declare at all.

Fonts are deliberate, not decorative: **Lexend** for headings and UI (designed to
improve reading proficiency) and **Atkinson Hyperlegible** for body (designed by
the Braille Institute to maximise character distinction for low-vision readers).
Both are self-hosted in `public/fonts/` and preloaded. Do not substitute a
generic sans.

### Why no Tailwind

The design is expressed as ~200 lines of tokens plus component-scoped CSS, and
it inherits accessibility rules that live in element selectors (`button`,
`input`, `*:focus-visible`, `::placeholder`). Tailwind's preflight and the
`base.css` reset would fight over exactly those selectors, and the utility layer
would add a second, parallel source of truth for spacing and colour. So
`@tailwindcss/vite` was removed from this app. `apps/admin` still uses it.

Svelte stays configured for islands, but the storefront currently ships none:
the pages are server-rendered HTML plus two small inline scripts — the home
search suggestion panel and the buy box quantity stepper.

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
  every image sits in a fixed-size box with `object-fit: contain` instead of
  carrying `width`/`height` attributes. That is what holds CLS at zero.

## The rental request wire format

`src/lib/request-config.ts` owns it, and both sides import from there — the buy
box that writes a configuration and the summary page that reads it back. A
renamed field would otherwise fail silently, dropping a customer's choice with
no error anywhere.

```
/carrello/?prodotto=<slug>
  &v_<groupKey>=<optionValue>   // repeats for multi_select
  &q_<questionKey>=<answer>     // repeats for multi_select
  &extra=<addonId>              // repeats
  &dal=YYYY-MM-DD&qta=<1..10>
```

`ProductQuote.astro` renders one control per value shape, and covers all of them
explicitly — `single_select`/`boolean` as a choice grid, `multi_select` as
checkboxes, `number`/`number_range` as a stepper-friendly field, `string` as a
text input, plus the product's intake `questions`. A shape with no branch would
vanish from the form with no error, which is why there is no `default` fallthrough.

`resolveRequest()` maps the URL back to the labels the customer actually saw.
Unknown group keys and option values are **dropped, never echoed**: the resolved
text is rendered on the page and pushed into a `wa.me` link, so a value that does
not correspond to a real option has no business appearing as if it did. Free text
survives, but stripped of control characters and capped. Required add-ons are
re-added from the product rather than trusted from the URL, because a disabled
checkbox is not submitted.

It is a GET form because there is no cart or orders endpoint on the API yet. When
one lands this becomes a POST with a session-bound CSRF token, and the server
re-resolves the configuration before pricing. The field names carry over.

## Deliberate deviations from the prototypes

- **Category browse is a wrapped grid of links, not a horizontal scroller.** At
  200% zoom and 400% reflow the right-hand items of the design's 15-item
  overflow scroller become undiscoverable, and it reintroduces horizontal
  scrolling.
- **Pagination is real `<a>` links with `rel=prev/next`.** Infinite scroll breaks
  sort coherence across pages, breaks the back button, and leaves later products
  unindexed.
- **The mobile product bar sits above the bottom navigation**, offset by
  `--mobile-nav-h`. The original gave both `bottom: 0` and the same z-index, so
  one of the two was always unusable.
- **The header bar wraps.** The prototype's fixed row overflows horizontally at
  200% zoom.
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
