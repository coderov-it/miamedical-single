# Storefront cart

`/carrello/` — the owner's reference design (Claude Design project "Product details
page design", file `Cart.dc.html`), and the storefront's only interactive island.

Read [storefront-design-system.md](./storefront-design-system.md) first; the cart is
released from Variante B the same way the product page and the checkout are, and for
the same reasons.

## What changed, and why it needed changing

`/carrello/` used to be a **single-product request summary**: the product page
GET-submitted one configuration into its query string and the page read it back.
"No cart or orders endpoint" was a documented known gap.

Meanwhile `resolveCheckout()` had been built to accept a multi-item request
(`item.<n>.` prefix, `MAX_ITEMS`, a POST body) and nothing produced one. The cart
was the missing half of a wire format that already existed on both sides of it.

So this is not a new vocabulary. The cart speaks the field names
`request-config.ts` already defines, prefixed exactly as
[storefront-checkout.md](./storefront-checkout.md) already specified.

## The shape of it

```
PRODUCT PAGE                       localStorage "mia.cart.v1"
  form#quote-form                    [ {id, config, quantity}, … ]
  ├─ "Richiedi il noleggio"                    │
  │    submit → /checkout/                     │ read on mount
  └─ "Aggiungi alla richiesta"                 ▼
       formaction → /carrello/          CART  (CartContainer.svelte)
       (script intercepts and              │
        writes the store instead)          │ POST /api/cart/resolve
                                           ▼
                                    priced CartView   ── server-derived
                                           │
                                           │ native POST of hidden item.<n>.*
                                           ▼
                                      /checkout/  ── re-resolves everything
```

### Storage is a shopping list, not a receipt

A stored line holds a slug, a configuration query string, and a quantity. **No
price, no title, no label.** Every one of those is re-derived server-side by
`resolveCart()`, which wraps the same `resolveCheckout()` the checkout uses.

This is what makes a user-writable store safe. Editing `localStorage` can change
which product you are asking about and how many, and nothing else:

- a crafted `config` cannot invent an option — `resolveRequest()` drops everything
  that is not a real one;
- it cannot invent a price, because **no price crosses the boundary inward**;
- it cannot fan out reads — `parseCartLines()` truncates at `MAX_CART_LINES`.

`/api/cart/resolve` validates its POST body with **the same parser** the browser
reads its store with, so a hand-edited store and a crafted request cannot disagree
about what a line is.

### Two modules, and why

| Module                 | Runs   | Imports                                   |
| ---------------------- | ------ | ----------------------------------------- |
| `cart-store.ts`        | both   | **nothing, ever**                         |
| `cart-state.svelte.ts` | client | `cart-store.ts` — and `cart.ts` for TYPES |
| `cart.ts`              | server | `api.ts`, `checkout.ts`, `labels.ts`      |

`cart-store.ts` importing nothing is load-bearing, not tidiness. It is the only cart
code the browser downloads; one runtime import from `cart.ts` would drag the Hono
client and `@mia/i18n` into the bundle for a page that needs neither. The island may
import `cart.ts` for **types only** — those erase.

Verify after touching either:

```bash
pnpm --filter @mia/website build
grep -l "hono\|createLabels" apps/website/dist/client/_astro/*.js   # must find nothing
```

Because it cannot import the checkout, `cart-store.ts` restates four of its values
(`CART_ITEM_PREFIX`, `CART_PRODUCT_FIELD`, `CART_QUANTITY_FIELD`,
`MAX_CART_LINES`, `MAX_CART_QUANTITY`). They are **checked**, not trusted:
`cart.ts` declares each against the real one with a literal type, so renaming
`ITEM_PREFIX` fails `astro check` rather than shipping a cart that posts a body the
checkout cannot read. Confirmed by temporarily renaming it — the guard errors.

### `/api/cart/resolve` is not a cart API

It stores nothing, mutates nothing and identifies nobody. It takes lines in and
hands priced rows back, so two tabs, two devices or two visits share no state
through it. A cart that survives a device change still needs the real `/api/cart`
listed under Known gaps.

POST rather than GET because a 20-line cart outgrows a URL, and because none of a
customer's configuration belongs in a proxy log or in browser history.

## How the island is split (2026-08-20)

It was one 660-line `CartApp.svelte`. State and view scale differently, so they were
separated — the owner's call, and the reason the tree reads as the state machine the
page is:

```
lib/cart-state.svelte.ts   the CartState class — what the cart contains
components/cart/
  CartContainer.svelte     the island root: <form>, the two columns, state wiring
  ├── CartLoadingCard      the first paint, until storage has been read
  ├── CartEmptyState       nothing in the cart
  ├── CartCard × n         one line, flat: nothing opens, nothing hides
  │   └── CartQuantityStepper
  └── CartOverview         the totals and the way to the checkout
```

Two rules keep it from drifting back into a monolith:

- **The components format nothing and interpolate nothing.** Amounts arrive
  formatted (`rowAmount`, `rowUnitPrice`, `money`), spoken labels arrive
  interpolated (`rowLabels`). A card is a view: it reads props and draws.
- **No shared style or icon modules.** Class strings and SVG paths live in the
  component that draws them (owner, 2026-08-20: extracting Tailwind strings into
  their own file is separation for its own sake). A string repeated inside ONE
  component becomes a `const` at the top of that component — `KEY` in the stepper,
  `LABEL`/`VALUE` in the card — and stops there.

`CartState` is a rune class in a `.svelte.ts` module, the pattern the admin app
already uses (`lib/*.svelte.ts`). One wrinkle worth knowing: a `$derived` whose
expression reads a `#private` field must be written `$derived.by(() => …)`. The rune
evaluates lazily, so the field IS assigned by the time it runs, but a bare
`$derived(...)` is a field initializer and TypeScript reads it as use-before-init.

## The island owns two things

Which lines exist and how many of each. That is all — and `CartState` owns both;
no component holds cart state of its own. It used to own a third, the set of open
row ids, and that went with the disclosure (see the 2026-08-31 pass below).

**The one piece of client arithmetic is `unitTotal × quantity`**, to repaint a
stepper press before the response lands. A plain multiply is not a pricing rule —
every rule that decided _what_ to multiply ran in `estimate()`. The server response
then replaces the figure. Two consequences worth knowing:

- Requests are guarded by a **token, not an AbortController**. Two presses of `+`
  make two requests, and the danger is the _first_ landing last and repainting an
  older quantity; the token makes a stale response a no-op.
- `unitSuffix` ("/giorno", or empty) exists **because** of the client formatting.
  On an open-ended rental the row's figure is a per-unit RATE, and re-formatting the
  number without its suffix makes a daily rate read as the price of the whole
  rental. `estimate()` hands it out for exactly this.

Rows render from `lines` (the island's list) married to `view.lines` (the server's),
not from the server's list alone — otherwise every interaction would wait for the
network before repainting.

## The no-JavaScript path is a complete page, not a degraded one

`/carrello/` server-renders whatever the URL carries. With scripting off,
"Aggiungi alla richiesta" is a real submit whose `formaction` points at
`/carrello/`, so it degrades to a plain GET of the product page's form — and the
cart shows that product, priced, with a working POST on to the checkout. Which is
precisely what the page did before it became a cart.

`cartLinesFromParams()` reads the un-prefixed single-item form and the indexed form
identically, because `splitItemParams()` already accepts both.

**Two things keep that path honest:**

1. Line ids from the URL are **derived from the configuration** (FNV-1a over the
   sorted key string), never random. This code runs during SSR, and
   `Math.random()` would make the server and client markup disagree on every keyed
   row.
2. On mount the island folds the URL's lines into the store and then clears the
   query string with `replaceState`. Without that, a refresh would re-add — merging
   is not idempotent against a URL that keeps saying "add this". Re-_visiting_ the
   hand-off URL does add again, which is correct: pressing "add" twice adds twice.

## Deliberate deviations from the reference design

- **No global location/date strip.** The reference has one Amsterdam pickup and one
  date range above the rows. Here dates and pickup belong to each **line** — a
  customer can want a bed from Monday and a wheelchair from Thursday — so those
  facts live in each row's summary well and there is nothing true to put in a
  cart-wide strip.
- **The total is `Totale indicativo`, and the CTA is `Vai alla conferma`.** The
  reference closes with a payable total and "Proceed to checkout". Nothing is
  payable here: no payment is taken online and the phone call settles the price.
- **An empty state exists.** The reference always has a cart behind it. Its
  "Vai al catalogo" wears the ACCENT fill rather than the quiet grey the rows'
  "continua a sfogliare" wears: with nothing in the cart, the catalogue is the
  page's primary action rather than an aside to it.
- **A row that stopped resolving is reported, not silently dropped.** The checkout
  drops these on the reasoning that a product we cannot rent is worse than one fewer
  row. The cart cannot: this is the page where the customer can still act, and a row
  that vanishes with no explanation reads as the site losing their choice. Hence
  `CartView.droppedIds` and the notice above the list.
- **There is no disclosure at all.** The reference defaults to a single-open
  accordion with the first row expanded. See the 2026-08-31 pass below: the rows
  are flat.
- **The phone card is outside the island.** A phone call is a successful conversion,
  not a fallback for a cart that failed, so the number is server-rendered and
  present whether or not the island ever mounts.
- **Stepper keys are 44px painted, 48px to the finger** (`.target-48`), and so is
  Rimuovi. The project's 48px target rule is not dropped to match a mock
  — see the design-system doc. Note the shape of that deal: `.target-48` is what
  zeroes `min-height`, so a control wearing it asks for its paint with `h-*`, never
  `min-h-*`.

## The 2026-08-20 pass: skin, controls, and a first paint that promises nothing

Two of the four notes below were superseded on 2026-08-31 and are marked; the rest
still describes the page.

The layout is still the reference's. Three things about it are not:

- **Type is the site's scale.** The reference's 12.5/13/13.5px asides are gone; the
  page floors at 16px, row titles are 17, a row's amount is 20 and the summary total 28. The one sub-16 use left is the two 14px notes under the total.
- **Controls are fills at honest sizes.** "Modifica la scelta" and "Rimuovi" were
  13px text links; they are 48px-target controls now, each with its Heroicons
  glyph. _(Superseded in part, 2026-08-31: the disclosure chevron is gone with the
  panel, and Rimuovi moved from a right-aligned danger pill to a ranged-left danger
  control that fills on hover.)_
- ~~**The page title is not painted.**~~ _Superseded 2026-08-31 — it is painted
  again, with a lead line under it. The line count stays `sr-only`._

A booking used to read as one run-on sentence of middot-joined dates, then as a
`<dl>` strip in the panel. _Superseded 2026-08-31: it is one flowing line on the
card — "Ritiro 10/09/2026 → Riconsegna 10/10/2026" — with the arrow travelling with
the second date so a narrow column breaks BETWEEN the dates._

**And the first paint no longer guesses.** The lines live in `localStorage`, so the
server cannot know whether the cart has rows; it used to render the empty state and
get corrected on hydration, which is a content flash on every visit. The island now
starts in a `booting` state and shows one loading plate — no rows, no summary — until
storage has been read AND the first `/api/cart/resolve` response has landed.

`booting` starts **false** when the URL carried lines: those are the truth for that
request, they are already rendered, and re-pricing them must not blank the page.
That is the hand-off path below, unchanged.

The no-JavaScript case is handled where a stylesheet cannot reach: the plate carries
`data-cart-boot`, and the page puts `<noscript><style>[data-cart-boot]{display:none}
</style></noscript>` in the head via `BaseLayout`'s head slot, plus a `<noscript>`
paragraph saying why the cart cannot be read. Both only when the URL carried no line
— on the hand-off path the page works without a byte of JavaScript and neither
should appear.

## The 2026-08-31 pass: the row is flat, and the summary states one figure

Three changes, all the owner's, all on the same complaint — the page did not say
what was in it.

### The row does not open, because it has nothing left to hide

`CartCard` was a disclosure: a head carrying the product, the package, the stepper
and the amount, and a panel underneath holding the dates. The reasoning in the
2026-08-20 pass was that the head already stated everything needed to READ the
cart. It did not: it stated everything needed to read the PRICE. What a customer
comes to this page to check is which aid, from when, until when — and every one of
those was behind a chevron. "They can't determine what the user added at first
glance" (owner, 2026-08-31).

So the card is four short lines and nothing folds:

```
[ photo ]  Noleggio Materasso Antidecubito 120cm …
           Ritiro 10/09/2026 → Riconsegna 10/10/2026
           30 giorni = 210,00 €
           Rimuovi                    [ − 1 + ]     210,00 €
```

What that deleted, in order:

| Gone                                     | Where it went                           |
| ---------------------------------------- | --------------------------------------- |
| `CartState.openIds` / `toggle()`         | nothing to track                        |
| `CartRowLabels.details`, `showDetailsOf` | no key to speak                         |
| the panel's `LABEL`/`VALUE` tiers        | one `DETAIL` tier on the card           |
| the stepper's `relative z-1`             | there is no toggle overlay to sit above |

The stepper's lift and the head's stretched `::before` existed only to make a
whole row clickable without nesting a button in a button. With no toggle, both go,
and the card is ordinary flow again.

The row also **gained the product link** — the title is an `<a href>` to the
product page. `CartLineView.href` had been resolved server-side since the first
version and never rendered.

The photo is **100px from `mid` up and 80 on a phone**, roughly double the 54 it
was, and the reference site's own figure. `object-contain` inside its own padding,
per the project's never-crop-a-product-photo rule.

### The quantity fact is gone from `facts`

`toView()` now filters it out along with pickup, return and duration. The stepper
sits beside the amount it multiplies and states the quantity as a control; the
`<dl>` said it a second time. `CartLineView.facts` is consequently **empty in every
case today** — it stays in the shape as the slot a future per-line fact arrives in,
and the card renders whatever is in it generically.

### The summary states the estimate once, and closes on what is due

It printed `Totale indicativo 730,00 €` and then `Totale 730,00 €` — the identical
number twice, because nothing sits between them: no tax line, no shipping, no
discount. The estimate is now stated once, at the size the duplicate wore, and the
closing figure is the one that is actually different:

```
Riepilogo
Totale indicativo                    730,00 €
                                   IVA inclusa
Consegna                         da concordare
───────────────────────────────────────────────
Da pagare oggi                         0,00 €     ← --color-ok
Invia la richiesta: ti chiamiamo per concordare …
[ Vai alla conferma → ]
```

`Da pagare oggi` is the reference site's own move and the strongest thing on their
cart. It is `--color-ok`, not the accent: it is reassurance, not a call to act. It
replaces the old `cartNoChargeYet` footnote, which said the same thing in prose
under the button.

### And the page title is painted again

It was `sr-only` from 2026-08-20 on the reasoning that the breadcrumb directly above
already reads "Home › La tua richiesta". The reference opens its cart on a title and
a line of reassurance; without them the first thing on the page was a product card
hanging off a breadcrumb. Both are painted, above BOTH columns rather than inside
the rows column. The lead line is an instruction ("controlla gli ausili e vai
avanti"), so it is suppressed when the cart is empty — there is nothing to check.

## Where the accessibility work is

- **The stepper and remove speak.** Both change numbers elsewhere on the page. The
  island's `role="status"` region says what happened _and_ the new total, because
  `aria-live` on the figure alone would announce a bare number.
- **The product page's confirmation is two elements.** Revealing a `role="status"`
  region announces it once; adding a second time changes nothing in the DOM, so a
  screen-reader user would hear nothing on every add after the first. The spoken
  region therefore ends in the cart's new **size**, which does change every time.
- **The header badge is `aria-hidden`** and the count goes into the link's own
  `aria-label`. Two announcements of the same number is worse than one.
- **The badge is never server-rendered.** On a prerendered page a server-rendered
  count is either stale or forces every cached page to bootstrap a script. It ships
  empty and `hidden`; a cached page can carry no number, never a wrong one.

## Known gaps

- **Still no server-side cart.** The store is per-browser: it does not survive a
  device change and two tabs reconcile only through the `storage` event.
- **A mixed cart's grand total adds incompatible quantities.** An open-ended
  rental's figure is a per-day rate and a fixed product's is a price;
  `itemsTotal` sums both. Inherited from `resolveCheckout()`, flagged the same way
  (`stima · periodo da definire`) rather than fixed, because the phone call settles
  the real amount. Fixing it properly means the summary showing two figures.
- **Add-to-cart inherits the form's native validation.** A product with a required
  intake question cannot be added until it is answered, because the button is a
  real submit on that form. Consistent with the primary CTA, and arguably right —
  the answer belongs to the line — but it is a choice, not an accident.
- **The quantity ceiling is 10** (`MAX_CART_QUANTITY`), per line, not per cart.
