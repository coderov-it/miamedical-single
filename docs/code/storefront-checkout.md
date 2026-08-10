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

`/carrello/` is unchanged and still the PDP's form target. `/checkout/` accepts
the identical single-item request, so repointing the PDP at it is a one-line change
to `action={routes.cart}` when that is wanted.

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
and the delivery fees and names ride on their own cards as data attributes. The
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
- the delivery fee is **not** folded into it. Adding €15 to a per-day rate adds
  two incompatible quantities. The fee still shows on its own row.

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
and nothing about the target size is lost. The "same address" checkbox takes the
other route: its `<label>` carries `min-h-12`, so the whole row is the target for
the 18px box it wraps.

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

## Known gaps

- **The delivery fees are placeholders** (€25 hotel, €15 home, free pickup) —
  the reference design's own figures. The API has no delivery-pricing field yet.
  They are hardcoded in exactly one place, `DELIVERY_OPTIONS` in
  `src/lib/checkout.ts`, so replacing them with an API read is a one-line change.
  Nothing is charged online, and the phone call settles the real amount.
- **`estimate()` and the PDP's inline script apply the same rules twice**, in two
  languages of the same codebase — server TypeScript here, browser TypeScript
  there. They agree today (both were written from the rules above). Folding the
  PDP's estimate onto this module is the fix; it was left alone here because
  rewriting a working live estimate is not part of adding a page.
- There is still no orders endpoint. When one lands, "Invia l'ordine" becomes a
  POST with a session-bound CSRF token and the server re-resolves the whole
  request before pricing it. The field names and the wire format carry over.
