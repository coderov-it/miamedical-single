# The storefront in four languages

Covers `apps/website/src/lib/i18n.ts`, `middleware.ts`, `lib/labels.ts`,
`lib/routes.ts`, `lib/sitemap.ts`, `lib/account-page.ts`, `scripts/locale.ts`,
`components/global/LanguageSwitcher.astro` and `i18n/{it,en,fr,de}.json`.

Read `static-i18n-labels.md` first for the other half of the picture: that one is
about **enum tokens** shipped in `@mia/i18n`; this one is about **page copy**.

To add a fifth, see `adding-a-language.md` — nothing in this document is a step
you repeat per language.

## Where a locale comes from, and the two ways to read it

The locale lives in the URL and nowhere else — never a cookie, never
`Accept-Language`. The source language is served unprefixed and every other one
is `/<code>/*`; which language is the source is a property of the registry
(`LANGUAGES[0]`), not a fact about Italian written into the routing layer.
`middleware.ts` resolves it once, rewrites the prefixed path onto the existing
source-language route declaration, and opens two channels for the render:

| Channel                      | Read with                        | Available in                    |
| ---------------------------- | -------------------------------- | ------------------------------- |
| `context.locals.locale`      | `localeFromLocals(Astro.locals)` | pages, and components handed it |
| an `AsyncLocalStorage` scope | `localeForRequest()`             | anywhere on the server          |

Pages use the first. Components and `lib/*` helpers use the second, because a
`lib` function has no `Astro` object and threading a locale through every call
site was the alternative.

## The store is pinned to `globalThis`, and that is not decoration

```ts
const STORE_KEY = Symbol.for('mia.requestLocale');
const requestLocale = (globalStore[STORE_KEY] ??= new AsyncLocalStorage<…>());
```

The middleware opens the scope and every component reads it, so both must hold
the **same** `AsyncLocalStorage` instance. In dev they otherwise do not: Vite
re-instantiates `lib/i18n.ts` on HMR while the already-loaded middleware keeps
the old one. From that moment `getStore()` returns `undefined` on every render
and `localeForRequest()` falls back to `DEFAULT_LOCALE`.

`DEFAULT_LOCALE` is the source language. So the failure was invisible on the
Italian storefront — which is what the fallback is for — and rendered the English
one in Italian. `<h1>Catalogue</h1>` (page, from `locals`) above a
`Sfoglia per categoria` heading (component, from the store) was the signature.
Production loads each module once and never had the bug; dev had it constantly,
and a language bug you cannot reproduce locally is one nobody fixes.

## `translate()` throws for the SOURCE language only

```ts
const requested = MESSAGES[locale]?.[key];
const template =
  requested !== undefined && requested !== '' ? requested : MESSAGES[DEFAULT_LOCALE]?.[key];
if (template === undefined) throw new Error(`Missing ${DEFAULT_LOCALE} translation: ${key}`);
```

The asymmetry is the point, and it changed when the third language arrived:

- **Source language — throw.** Every key must exist in it, because it is what
  everything else falls back to. A gap there is a bug in the catalogue.
- **Any other locale — fall back to the source.** A gap there is a rollout
  state: the language is registered, its URLs work, its database content may
  already be translated, and its chrome is still being written. Throwing would
  take a whole page down over one unwritten button label.

An empty string counts as a gap, not as a translation into nothing — the same
rule the content i18n follows.

The cost of that safety is that a gap is silent, so it is measured instead:

```
pnpm --filter @mia/website run i18n:coverage          # a percentage per locale
pnpm --filter @mia/website run i18n:coverage --list   # the exact missing keys
```

It also reports **orphans** — a key a target locale has and the source does not,
which can never render because `translate()` looks the source up first. As of
2026-09-09: 679 keys in `it.json`, and `en`, `fr` and `de` all at 100%.

## Client-rendered pages get their copy as JSON

The cart, the checkout, the product page and the whole customer area build DOM
in the browser. A browser script has no request and no locale, so it cannot call
`translate()`. The server resolves what the script needs and ships it as a blob:

| Surface       | Blob                   | Read with                |
| ------------- | ---------------------- | ------------------------ |
| product page  | `data-pdp-labels`      | `pdpScriptLabels()`      |
| checkout      | `data-checkout-labels` | `checkoutScriptLabels()` |
| account pages | `data-account-copy`    | `readAccountCopy()`      |

`<AccountCopy keys={…}>` takes **full** message keys, not a namespace-relative
suffix. The order-detail page legitimately needs `total` and `delivery`, which
the checkout owns, alongside its own `account.order.*` — a hidden `account.`
prefix would have made those unreachable while looking like they worked.

`readAccountCopy()` throws when the blob is absent rather than defaulting: a
page that forgot to render `<AccountCopy>` is a bug, and a source-language
default would hide it on the source-language storefront.

## `Intl` gets a locale, always

Every formatter takes the request's locale. Two rules make that hard to forget:

- **On the server**, `formatMoney`, `formatRate`, `formatPricing` and
  `cardPrice` in `lib/api.ts` require it. They used to default to `'it-IT'`,
  which meant a caller that simply forgot printed `1843,00 €` — correct in
  Italian, and silently wrong next to `€1,843.00` from a caller that remembered.
  The English checkout showed both figures on one card.
- **In the browser**, `scripts/locale.ts` reads `document.documentElement.lang`,
  which `BaseLayout` sets from `localeTag()` and is always a tag `Intl` accepts.
  The PDP calendar, the estimate, the date picker and the checkout summary all
  go through it.

The PDP's custom month grid derives its weekday initials from `Intl` too, rather
than a hardcoded `lun mar mer` — 2024-01-01 is a Monday, so seven days from it
walk the Monday-first week the grid renders.

## `languagePaths` is the one answer to "where does this page live?"

`BaseLayout` computes it once and three things consume it: the switcher, the
`hreflang` block, and — through `lib/sitemap.ts` — the sitemap. There is no
second opinion anywhere about which languages a page exists in.

```
a static route      → every locale's path from `routePaths`
a product, a post   → the page supplies it, because only the record knows
anything else       → just the current locale
```

A static route is the same page in all of them, so all of them are offered. A
product is not: `availableLocales` is the honest list, and a locale absent from
it is a locale whose URL renders the source language's words.

### `hreflang`

Emitted in `BaseLayout` from that same object, so a language the switcher offers
is a language search engines are told about, and one it hides is one they are
not. Three rules, all worth stating because each has a plausible wrong answer:

1. **The value is the registry `code`, never the `tag`.** `hreflang="fr"`, not
   `hreflang="fr-FR"` — a region subtag targets a COUNTRY, so `fr-FR` excludes a
   French speaker in Belgium and `en-GB` every English speaker outside the UK.
   There are no regional variants of this storefront. `<html lang>` keeps the
   full tag, because that is about pronunciation and `Intl`, not targeting.
2. **`x-default` points at the source language** — what a visitor who reads none
   of ours should be served.
3. **Nothing is emitted for a set of one, or on a `noindex` page.** An alternate
   set says which of several URLs to index; on a single URL it says nothing, and
   on a page that must not be indexed it says it about nothing.

So today a product page emits no `hreflang` at all, and that is correct: no
product has a translation yet.

### The sitemap

`/sitemap.xml` and `/robots.txt` are route declarations over `lib/sitemap.ts`.
`@astrojs/sitemap` was removed rather than configured: it can only list routes
it sees at build time, every page here is `prerender = false`, and it could
never have found `/en/*` or `/fr/*` — there is no `pages/en/` directory, a
prefixed URL is a middleware rewrite.

Shape is Google's i18n sitemap format: **one `<url>` per language version, each
carrying the complete alternate set including itself.** A set that omits its own
self-reference is ignored rather than half-read.

```xml
<url>
  <loc>https://…/catalogo/</loc>
  <xhtml:link rel="alternate" hreflang="it" href="https://…/catalogo/" />
  <xhtml:link rel="alternate" hreflang="en" href="https://…/en/catalog/" />
  <xhtml:link rel="alternate" hreflang="fr" href="https://…/fr/catalogue/" />
  <xhtml:link rel="alternate" hreflang="x-default" href="https://…/catalogo/" />
</url>
```

What is in it, and the reasoning behind each exclusion:

| In                                         | Out                                                  |
| ------------------------------------------ | ---------------------------------------------------- |
| static route keys × every locale           | `PRIVATE_ROUTES` — cart, checkout, the customer area |
| products, per locale in `availableLocales` | `search` (`/cerca/` renders `noindex`)               |
| blog posts, same rule                      | `product` (a base path, not a page)                  |

- `PRIVATE_ROUTES` in `lib/routes.ts` had no consumer before this; it is the
  same list that makes those pages `noindex`.
- `<lastmod>` is a real `updated_at`, or the tag is omitted. A guessed one is
  worse than none.
- No `<changefreq>`, no `<priority>` — Google ignores both, and a number nobody
  reads is a number nobody maintains.
- `robots.txt` deliberately does **not** `Disallow` the private routes: a
  crawler cannot read `noindex` on a page it was forbidden to fetch, so
  disallowing would leave those URLs indexable from any inbound link while
  hiding the one instruction that says otherwise. One mechanism per URL.
- A legal document published from the admin under its own slug is **not** in it.
  `[terms].astro` serves any of them, but the public API has no `GET /api/terms`
  list — only `:slug`. The three the footer links unconditionally are route
  keys, so they are already covered; a fourth needs that endpoint first.

`availableLocales` on `PublicProductSummaryDto` exists for this. Without it the
sitemap could only ever list the source language, and a French translation
written next month would never reach a search engine — silently. It costs no
extra query: the list already loads `translations` unfiltered.

### The switcher

`components/global/LanguageSwitcher.astro`. A `<details>` disclosure, entries in
registry order, a locale with no path omitted rather than linked.

It carries ~15 lines of script for the two dismissals `<details>` has never had:
**Escape** (which also returns focus to the summary) and **pointerdown
outside**. Without them an open menu follows the customer around the page, and
every other dropdown on the web closes both ways.

`popover` would give both with no script at all, and cannot be used: a popover
is promoted to the top layer, where its containing block is the viewport rather
than the header, so anchoring it under its button needs CSS anchor positioning —
which Firefox still does not ship. Revisit when it does.

## What is copy and what is data

Code is English, data is Italian (CLAUDE.md). For this app the line is:

| Kind                                            | Lives in                           |
| ----------------------------------------------- | ---------------------------------- |
| UI copy, headings, errors, aria-labels          | `i18n/{it,en,fr,de}.json`          |
| Marketing copy on the home and support pages    | `i18n/{it,en,fr,de}.json`          |
| FAQ answers, testimonial quotes and their dates | `i18n/{it,en,fr,de}.json`          |
| Enum tokens (`day`, `paid`, `draft`)            | `@mia/i18n`                        |
| Product and category names, descriptions, chips | the database, per `*_translations` |
| A person's name, a street, a phone number       | `lib/site.ts` and the database     |

The last row is why `HOME_TESTIMONIALS` split: the names and initials stayed in
`lib/home-content.ts` because they are identity, while the quote and the month
moved to the catalogue because they are prose a customer reads.

**The translated storefronts still show Italian catalogue copy.** That is not
this layer: `listProducts(…, locale)` already asks the API for the locale, and
the rows do not exist. Measured on the dev database, 2026-09-08 (German was
registered on 2026-09-09 and starts from the same place):

```
products         107 rows  →  it: 107   en: 0   fr: 0   de: 0
categories        18 rows  →  it: 18    en: 0   fr: 0   de: 0
terms_documents    1 row   →  it: 1     en: 1   fr: 0   de: 0
```

Filling them is back-office work, not a code change — the admin has the editors,
the per-field gap markers and the per-record progress; `autoTranslate.available`
is `false` because no provider is wired, so today it is typed by a person.

### What the fallback must not do (2026-09-01)

The API answers every locale — it falls back to the source language rather than
404-ing on a missing translation — and it still stamps the response
`locale: 'en'`. **The response's own `locale` therefore does not describe the
text in it.** The honest signal is `availableLocales`, and `lib/product-page.ts`
wraps it:

```ts
contentLocale(product, requested); // 'it' when there is no 'en' translation
contentLang(product, requested); // 'it-IT', or undefined when they agree
```

Three things went wrong before anything consulted it, all on
`/en/product/materasso-antidecubito-hospital-care-xl/`:

1. **The kicker glued two languages together.**
   `{product.category.name} · {t('product.rental')}` resolved the label in the
   PAGE's locale and the name in whatever the DATA turned out to be, printing
   `MATERASSI ANTIDECUBITO AD ALTO RISCHIO · RENTAL`. Both halves now resolve in
   the content's locale, so it reads `… · NOLEGGIO`.

2. **Italian text sat under `<html lang="en-GB">` unmarked.** A screen reader
   read Italian with English phonetics. The title, the kicker, the chips, the
   short description and the description tab now carry `lang` — WCAG 3.1.2,
   Language of Parts. `lang` is set **only** when the content locale differs from
   the page's, so the Italian page still has exactly one `lang` on it.

3. **The header offered a language that did not exist.** `[slug].astro` treated a
   truthy `getProductBySlug(slug, 'en')` as proof of a translation, so every
   Italian product page offered English and re-served the same Italian words.
   The alternate is now gated on `availableLocales`.

   ⚠️ `pages/blog/[slug].astro` still has that bug in the form it was fixed in:
   the blog API exposes no `availableLocales` per post, so each candidate locale
   is a lookup and a truthy answer is taken as proof. It is latent only because
   the blog has no posts. The public list DTO now carries `availableLocales`;
   the detail route is what still needs it.

There was also a hardcoded Italian sentence in `views/product/ProductBody.astro`
— the out-of-stock message — which was Italian on every locale by construction.
It is `product.outOfStock` in every catalogue now.

**The rule this leaves behind:** when a string that comes from the database sits
next to a string that comes from `i18n/*.json`, resolve BOTH in the content's
locale and mark the pair. Never resolve one in each.

## The prefix guard, and the four routes it used to 404

Requesting a translated slug without its prefix — `/search/`, `/cart/` — is a
mistake rather than a route, so the middleware 404s it. That set is built by
stripping the prefix off every non-source path, which quietly included the four
paths spelled identically in more than one language:

```
/en/checkout/       → /checkout/         ← a real Italian route
/en/blog/           → /blog/             ← a real Italian route
/en/privacy-policy/ → /privacy-policy/   ← a real Italian route
/en/cookie-policy/  → /cookie-policy/    ← a real Italian route
```

All four 404'd on the Italian storefront, the checkout among them: the cart's
own "vai alla conferma" led to a dead page. The set now subtracts
`SOURCE_STATIC_PATHS`, so a shared spelling resolves as the source language and
only the genuinely translated-only slugs 404.

⚠️ It is the **union** across every non-source locale, not a pairwise
difference. With two languages those are the same set; with three they are not,
and a French slug that happened to match an Italian one would fall through the
same hole the English ones did.
