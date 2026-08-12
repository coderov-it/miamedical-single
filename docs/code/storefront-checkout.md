# Checkout

`/checkout/` is the owner-authored reference design, implemented 1:1. Its spec is
the Claude Design file `Checkout.dc.html`, from the same project as the product
detail page (`Product Details.dc.html`).

Like the PDP, it is **deliberately released from Variante B**. Read
[storefront-design-system.md](./storefront-design-system.md) § The product detail
page first: the same rule applies here, for the same reason, and the same three
things carry over from the site and nothing else —

- the brand accent `#2e4699`, standing in for the reference's own `accentColor`
  prop (`oklch(0.45 0.17 272)`);
- the ink / tint / hairline palette;
- the two-paint focus ring, and the 48px target rule (see below — it survives
  without deforming the design).

Everything else is the reference design's language: Instrument Sans via
`--font-pdp`, sub-16px secondary text, its own radii (14px step card, 16px
overview panel, 12px option card, 10px control) and its own spacing.
**Do not "correct" the checkout back toward Variante B tokens.**

## One page, two entry points

The whole of "direct product or cart" lives in `resolveCheckout()`
(`src/lib/checkout.ts`). It reads both shapes into one `CheckoutItem[]`, so
nothing in the page branches on where the request came from — only on **how
many** items came with it.

```text
# One product, configured on its detail page: GET, the format
# request-config.ts already defines, so a PDP can point here unchanged.
/checkout/?product=<slug>&variant.<groupKey>=…&question.<questionKey>=…
          &addon=<addonId>&package=<code>&from=YYYY-MM-DD&to=YYYY-MM-DD&qty=<1..10>

# Several products, from a cart: POST, same field names, one `item.<n>.` prefix.
POST /checkout/
  item.0.product=<slug>&item.0.variant.size=m&item.0.qty=2
  &item.1.product=<slug>&item.1.package=7-days
```

The keys are English because a wire format is code, not content — nobody reads it
but a program. (Public route paths are the opposite case and stay Italian; see the
RULES section of AGENTS.md.)

**The cart POSTs.** A multi-item request outgrows a URL, and none of it belongs in
browser history. It is a NATIVE form post of hidden inputs, not a `fetch`, so it
still works with JavaScript off; `readRequestParams()` normalises the `FormData`
into `URLSearchParams` so everything downstream reads one shape and cannot tell a
POST from a GET. Astro's default `security.checkOrigin` rejects a cross-origin
post with a 403 before any of this runs — verified.

The trade-off accepted: a POSTed checkout is not bookmarkable and a refresh
re-submits. That is the right way round for a page that is `no-store`, `noindex`
and built out of one person's details. A server-side draft (`POST` → persist →
`303` to `/checkout/<id>`) removes even that, and is the next step when the orders
endpoint lands.

The prefix is the **only** addition — a cart never needs a second vocabulary,
and `resolveRequest()` runs unmodified on each per-item slice. Rules:

- Indices **group and order** only; they are not preserved. A cart that removed
  its middle item does not have to renumber the rest.
- If any `item.<n>.` key is present the un-prefixed keys are ignored, so the two
  forms can never half-merge into one hybrid item.
- A group with no `product` is dropped. An unknown or unpublished slug is
  dropped too, rather than rendered as an unavailable row: the customer cannot
  act on it here, and a checkout showing a product we cannot rent is worse than
  one showing fewer.
- `MAX_ITEMS` (20) bounds the fan-out. Not a business limit — each item costs one
  product read, so an unbounded index would let a crafted URL fan out into
  arbitrarily many API calls.

The overview renders one item **expanded** (there is nothing to compare it
against, and hiding its dates behind a disclosure would be hiding the whole
order) and several as collapsible rows with their own subtotals — exactly the
reference design's two shapes.

**That repointing has since happened.** The product page's form now targets
`/checkout/` directly — "Richiedi il noleggio" is a book-now and goes straight to
confirmation with its one product — and its second button overrides the target with
`formaction={routes.cart}` to add to the cart instead. Both entry points therefore
exercise the two shapes above, and neither needed a new field name:
[storefront-cart.md](./storefront-cart.md).

## Not one Italian word in the code

Every Italian string the checkout shows comes from `src/lib/labels.ts`, keyed by
an English identifier: a component asks for `t('storePickup')` and never contains
"Ritiro in sede". A delivery option's `id` doubles as its label key, so
`storePickup` / `storePickupDetail` / `storePickupShort` resolve the name, the
sub-line and the order-overview row from the one token.

The mechanism is `createLabels()` in `@mia/i18n`, and the fallback order is
**requested language → the `en` entry → the key humanised** (`sameAddress` →
"Same address"), so a missing translation degrades instead of blanking a page.
That is the one difference from `enum-labels.ts` in the same package, which is
deliberately exhaustive and has NO fallback because a new pgEnum member must fail
`tsc` until both languages exist. The key type is `keyof` the catalog either way,
so a misspelled key does not compile.

The page script holds no Italian either. It cannot import `t` — that would put the
whole catalog in the browser bundle — so the ~17 words it needs at click time ship
as a JSON island (`SCRIPT_LABELS`, rendered `<script type="application/json">`),
and the delivery names ride on their own cards as data attributes. The
"Grazie {name}!" greeting carries its template in `data-greeting-template` for the
same reason.

## Pricing is a display estimate

Same status as the PDP's order panel, and the same rules — the owner's:

- On a rental product **every modifier is per rental unit**: variant option
  modifiers, per-unit number modifiers and rental-mode add-ons all bill in the
  product's `rentalUnit`, so one duration multiplies every amount.
- A package is a fixed total for a fixed duration; `(configured rate − base
rate) × duration` rides on top, and the savings line only appears when the
  package unit equals the product unit.
- Required add-ons come from the product, never from the URL.

`estimate()` in `src/lib/checkout.ts` reads a **`ResolvedRequest`**, not the URL.
That is why `ResolvedEntry` grew an `amount: number` field: `resolveRequest()` has
already dropped everything that is not a real option, and a second walk over the
product to recover the numbers would be a second chance to disagree with it.

**An open-ended rental is normal here** — medical rentals often end "when
recovery ends". With no return date and no package the figure is a **per-unit
rate, not a sum**, so:

- the qualifier under the total reads `stima · periodo da definire` instead of
  `IVA inclusa`;
- the delivery fee is **not** folded into it. Adding a one-off delivery charge to
  a per-day rate adds two incompatible quantities. The fee still shows on its own
  row.

## The stepper

`data-state` on each `<section data-step>` — `todo` / `active` / `done` — is the
only thing the page script writes. **What each state looks like is CSS**, in the
checkout block of `src/styles/app.css`. Same for `data-selected` on a delivery or
pickup card. The reference design rebuilds every style string in JavaScript on
every render; doing that here would mean the server-rendered page is wrong until
a script runs.

Visibility is the `hidden` **attribute** alone, never a utility class —
preflight makes `[hidden]` `display: none !important`, which beats any class, so
the CSS only has to name the open geometry (`display: flex`). Same trick, and
same reason, as the PDP's calendar popover.

### Without JavaScript it is still a complete path

The step bodies are server-rendered **open** and the "Continua" buttons
server-rendered **hidden**. A small synchronous `is:inline` script flips that
during parse, before first paint — which is what keeps the enhanced page from
flashing every step open, and what leaves the no-JS page as one long readable
form rather than two-thirds of a form behind buttons that do nothing.

"Invia l'ordine" is an `<a>`, not a `<button>`: there is no orders endpoint and
no online payment, so it is a WhatsApp handover — which is what the reference
design's own copy already describes. The server builds the message with every
line item in it, so the link works with no JavaScript; the script only widens it
with what was typed into steps 1 and 2, at click time.

Nothing the customer types here ever enters a URL.

### The 48px target rule survives

The project minimum target is 48×48 (tremor and reduced motor precision are the
norm in this audience, not the exception). The reference design paints several
controls smaller — a 33px "Modifica" pill, 44px identity chips, an 18px
checkbox — and forcing those to 48 square deforms the layout: an 18px checkbox
becomes a 48px block and the delivery panel falls apart.

So the two are separated. `.checkout` releases buttons and checkboxes from the
base `min-height`/`min-width`, and **`.target-48` puts a centred, invisible
48×48 hit area back** over the painted control. Nothing about the paint changes
and nothing about the target size is lost.

## Step 2 asks two questions, and says so

A rental goes out and comes back. Those are two facts, so step 2 is two blocks
under their own eyebrows with a hairline between them:

```text
CONSEGNA                            ← CheckoutDelivery.astro
  ◉ Consegna e ritiro all'indirizzo che indichi     +40,00 €
      Regione / Provincia / Comune / CAP / Indirizzo
  ○ Ritiro in sede                                  Gratis
────────────────────────────────────
RICONSEGNA A FINE NOLEGGIO          ← CheckoutReturn.astro
  ☑ Ritiriamo allo stesso indirizzo
      (unticked → Indirizzo per il ritiro, one free-text line)

  [ Continua alla conferma ]         ← belongs to the STEP, after both
```

Three decisions carry that shape:

**Only when something is rented.** `hasRental` in the page frontmatter —
`items.some((item) => item.product.pricing.mode === 'rental')`. A purchase has no
second half, and the block, the eyebrows and the fields are all absent for one. The
script treats `returnSame === null` as "this order has no return", so nothing is
guarded twice.

`some`, not `every`: a mixed request with one rented line still has a collection to
arrange, and a customer should not have to split the order to say where.

**Below both methods, not inside either.** Both come back — a home delivery is
collected, a branch collection is brought back — so it is one question, one control.
Putting it in each panel would mean two checkboxes that have to agree. Only the
wording differs, and that swaps from `data-label-home` / `data-label-pickup` in
`selectDelivery`:

```text
homeDelivery → "Ritiriamo allo stesso indirizzo"
storePickup  → "Riconsegna alla stessa sede"
```

**The "Continua" button moved out of `CheckoutDelivery.astro`** and into step 2's
own slot. A forward action rendered above a question it does not cover invites the
customer to skip it.

Ticked is the server-rendered default, so it is already true before any script
runs, and unticking is the deliberate act. Re-ticking **clears** what was typed
rather than remembering it — a stale address behind a ticked box is a fact nobody
can see, and the API refuses that combination anyway.

The return address is **one free-text line, deliberately not the cascade below**.
The cascade exists to key a price; the return prices nothing, because the fee was
settled by the outbound comune. What is left is an address a driver reads, so asking
the customer to pick Roma a second time would buy nothing.

## Step 2 asks for the address as a cascade

Regione → provincia → comune → CAP → via, in `CheckoutDelivery.astro`, driven by
the `--- the address cascade ---` block in `checkout.astro`.

Not a preference. The fee is keyed on the **comune's ISTAT code**, and a picked
comune is exact where a typed città is not: names repeat across provinces, and 18%
of Italian CAPs name more than one comune, so inferring the comune from a CAP means
guessing — and a guessed comune is a guessed price.

```text
1. open the home-delivery panel   → GET /api/address/regions          20 rows
2. pick  Lazio                    → GET /api/address/provinces?…12     5 rows
3. pick  Roma (RM)                → GET /api/address/comuni?…RM      121 rows
4. pick  Roma          value = 058091   ← the six digits the fee keys on
                                          the comune's NAME goes into `city`
5. its 79 CAPs become the `datalist`; type 00129
6. POST /api/delivery/quote  { cap: '00129', istatCode: '058091' }
                                  → 47,00 €  resolvedVia: comune
```

`00129` is **not in our CAP dataset** — it comes from GeoNames and some big-city
codes are missing. Step 4 is why that costs nothing: the comune is already known,
so an unlisted CAP finds no `cap` row and the comune's own fee answers. Before the
picker the same address fell all the way to the country row and was quoted "da
confermare".

### Each tier is a dropdown you can type into

`CheckoutComboField.astro`, driven by `createCombobox` in the page script. Three
instances — regione, provincia, comune — and the rule that defines them:

```text
type "lomb"       → filters to Lombardia, pre-highlighted; Enter commits it
type "re"         → Reggio… before Ancona (starts-with, then contains)
type "citta"      → finds Città…          (case and accents folded)
type "Gotham"     → "Nessun risultato", nothing selectable
blur, or Escape   → the text reverts to the committed row's name
```

So the committed value is **always a code the server knows, or nothing**. Typing
filters the rows; it never becomes the value. `Enter` is swallowed while a list is
open, so it cannot submit the step with a half-typed tier showing.

That matters more than it looks. `resolveQuote` prices whatever comune code it is
handed, so "the tier is non-empty" has to mean "a real place" — otherwise a
mistyped `Lomb` would need validating on the way out instead of being impossible on
the way in.

These replaced native `<select>`s, which needed no script at all. A `<select>`
cannot be filtered, and a province holds up to ~320 comuni — scrolling that was the
whole problem. The chevron is drawn back in because the native one went with the
element.

The CAP field is deliberately **not** one of them. Its `datalist` is a
**suggestion, not a validator**: an unlisted CAP is accepted, because the gap is as
likely to be ours as the customer's. The tiers are closed sets we own; the CAP list
is one we know to be short.

For 7,338 of Italy's 7,896 comuni there is exactly one CAP, and the script fills
it — most customers never touch the field. Changing comune clears a CAP that
belonged to the previous one, which is correctness rather than tidiness: the server
prices the code, so a code from one place with a CAP from another would answer.

**The street field no longer fills the città and the CAP.** It completes from HERE
(`docs/code/address-autocomplete.md`) and writes the street line only — letting a
provider's spelling of a name decide which comune is priced is exactly the
ambiguity the picker removes.

**One fallback, and only one.** If `/api/address/regions` cannot be answered the
three tiers are hidden and the comune becomes an ordinary text field. The quote
then resolves from the CAP plus that name, which is what it did before the picker
existed: coarser for a shared CAP, never blocked. `step2Valid` accepts either an
ISTAT code or a typed name, so a working checkout never depends on that endpoint.

## Deliberate deviations from the reference file

All business-driven, and all for the same reasons the PDP's are:

- **Copy is Italian**, and the fiscal fields follow from the identity chip: a
  private customer has a codice fiscale, a company has both a partita IVA and its
  own codice fiscale, a tourist has neither.

  Naming follows the project rule — **code is English, data is Italian** — with
  the one carve-out that Italian fiscal instruments are domain terms, not general
  wording, so they keep their Italian names in code and in the database:
  `codiceFiscale`, `partitaIva`, `companyCodiceFiscale` (and `codiceUnivoco` when
  e-invoicing lands). Everything general around them is English: the identity ids
  are `private` / `company` / `tourist`, and the Italian words come from the label
  catalog keyed by those same ids.

- **The delivery options are the site's own**, and the pickup points come from
  `LOCATIONS` (Roma, Firenze) rather than the reference's Amsterdam workshops.
- **Pickup is a choice, not a distribution.** The reference spreads the items
  across every store at once, which only makes sense for a multi-warehouse
  fleet; one order here is collected from one sede.
- **The options are radio groups**, not rows of plain buttons. Three buttons
  announce as three unrelated controls; `role="radiogroup"` + `role="radio"`
  announces the group and the position in it. That obliges the arrow keys to
  work, which the page script handles — native radios would give it for free,
  but the delivery options are whole cards with panels inside them, which an
  `<input>` cannot be.
- **The order overview shows the real product image**; the reference draws a
  diagonal-stripe pattern because it has no catalogue behind it.
- **The confirmation claims nothing we cannot do.** The reference says a
  confirmation email was sent; there is no mail service behind this page, so it
  says the request was received and WhatsApp follows.
- **The sticky panel sits at 96px, not the reference's 24px**, and only from
  `wide` up. The reference page has no site chrome; this one has a sticky 83px
  header, and 24px parks the panel underneath it. Steps carry `scroll-mt-24` for
  the same reason.
- **An empty state exists.** The reference always has a cart behind it. Arriving
  with nothing resolvable is normal (a shared link, a product since unpublished)
  and must not be a dead end.
- The route is `/checkout/` — the loanword Italian e-commerce actually uses, and
  what the reference names this step. It is in `PRIVATE_ROUTES`: `noindex` and
  `no-store`, because the page is built out of one person's request.

## Step 3 records the order

The confirm step posts to `POST /api/orders`, which re-resolves and re-prices the
whole request from the catalogue before writing it. The wire format, the strictness
rules and the stored snapshot are documented in `docs/code/orders-placement.md`;
what matters on this page:

- **`estimate()` no longer owns the pricing rules.** They moved to
  `packages/pricing`, which the server prices the stored order with too — so the
  figure in the overview and the figure in `orders.total` are the same arithmetic.
  This module now only puts Italian words on the structured rows that come back.
- **Step 1 asks for no address at all.** The address belongs to the delivery and
  lives in step 2's home-delivery panel — street, città and CAP, as three fields,
  because the order stores a structured snapshot and the CAP is what prices the
  delivery. Asking in step 1 meant everyone typed a delivery address, including the
  customers collecting from a branch. A collected order stores no address.
- **The street field is a combobox**, completing from `GET /api/address/suggest`
  (HERE, proxied server-side). Picking a suggestion fills all three fields, so the
  CAP that prices the order is one the customer never typed. See
  `docs/code/address-autocomplete.md`.
- **The CTA is still an `<a>` to WhatsApp** in the served HTML, because with no
  JavaScript that is the whole path. The parse-time script retitles it and the
  module script posts instead, revealing the order number and the server's own
  total; WhatsApp moves one step down, quoting that number. A failed POST says so
  and leaves the handover in place.
- **Two gates replace the CTA rather than letting it fail.** A rental with no
  resolvable duration has a daily rate and no total; a line missing a required
  choice is one the API refuses. Either way the panel names what is missing and
  links back to the page where it can be fixed — see `Checkout.blocked`.

## Known gaps

- **A shared CAP can still be quoted coarsely — but only on the fallback path.**
  With the picker the comune arrives as an ISTAT code and the tiebreak never runs.
  Without it (`/api/address/regions` unreachable) the quote is back to the CAP plus a
  typed name, and a name matching nothing widens the answer rather than guessing —
  see the walks in `docs/code/orders-placement.md`.
- **Our CAP list is incomplete for the big cities.** `20130` Milano, `00129` Roma and
  ~12 others are absent, so they never appear in the datalist. Typing one still
  prices correctly at comune level; the missing rows only cost the suggestion. The
  measured accuracy of the dataset is in `packages/db/data/README.md`.
- **The card's figure can go stale.** It refreshes when the comune or the CAP
  changes, not on a timer, so a tab left open across an edit to the zone tree shows
  the older number. `place()` re-resolves, so the stored total is never the stale one.
- **The PDP's inline script still applies the pricing rules a second time**, in
  browser TypeScript, for its live estimate. This module and the server now share
  one implementation; the PDP is the remaining copy. Folding it onto
  `@mia/pricing` is the fix.
- **Nothing emails the order number.** The customer sees it on the confirmation and
  in the WhatsApp message, and nowhere else.
