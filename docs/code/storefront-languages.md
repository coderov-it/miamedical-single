# The storefront in two languages

Covers `apps/website/src/lib/i18n.ts`, `middleware.ts`, `lib/labels.ts`,
`lib/account-page.ts`, `scripts/locale.ts`, and `i18n/{it,en}.json`.

Read `static-i18n-labels.md` first for the other half of the picture: that one is
about **enum tokens** shipped in `@mia/i18n`; this one is about **page copy**.

## Where a locale comes from, and the two ways to read it

The locale lives in the URL and nowhere else — never a cookie, never
`Accept-Language`. `/en/*` is English, everything else Italian. `middleware.ts`
resolves it once, rewrites the English path onto the existing Italian route
declaration, and opens two channels for the render:

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

`DEFAULT_LOCALE` is `'it'`. So the failure was invisible on the Italian
storefront — which is what the fallback is for — and rendered the English one in
Italian. `<h1>Catalogue</h1>` (page, from `locals`) above a
`Sfoglia per categoria` heading (component, from the store) was the signature.
Production loads each module once and never had the bug; dev had it constantly,
and a language bug you cannot reproduce locally is one nobody fixes.

## `translate()` throws on a missing key, on purpose

```ts
const template = MESSAGES[locale][key];
if (template === undefined) throw new Error(`Missing ${locale} translation: ${key}`);
```

Both catalogues carry every key, and a missing one fails the render rather than
printing the key or silently falling back to Italian. A silent fallback here is
the same failure as the stale store above: it looks fine in the language you
test in.

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
page that forgot to render `<AccountCopy>` is a bug, and an Italian default
would hide it on the Italian storefront.

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

## What is copy and what is data

Code is English, data is Italian (AGENTS.md). For this app the line is:

| Kind                                            | Lives in                           |
| ----------------------------------------------- | ---------------------------------- |
| UI copy, headings, errors, aria-labels          | `i18n/{it,en}.json`                |
| Marketing copy on the home and support pages    | `i18n/{it,en}.json`                |
| FAQ answers, testimonial quotes and their dates | `i18n/{it,en}.json`                |
| Enum tokens (`day`, `paid`, `draft`)            | `@mia/i18n`                        |
| Product and category names, descriptions, chips | the database, per `*_translations` |
| A person's name, a street, a phone number       | `lib/site.ts` and the database     |

The last row is why `HOME_TESTIMONIALS` split: the names and initials stayed in
`lib/home-content.ts` because they are identity, while the quote and the month
moved to the catalogue because they are prose a customer reads.

**The English storefront still shows Italian product copy.** That is not this
layer: `listProducts(…, locale)` already asks the API for English, and the
`product_translations` rows for `en` do not exist yet (see `wp-migration.md` —
the importer writes `it` only). Filling them is back-office work, not a code
change. Today it is **0 of 24 products**.

### What the fallback must not do (2026-09-01)

The API answers every locale — it falls back to Italian rather than 404-ing on a
missing translation — and it still stamps the response `locale: 'en'`. **The
response's own `locale` therefore does not describe the text in it.** The honest
signal is `availableLocales`, which lists the translations that really exist, and
`lib/product-page.ts` wraps it:

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
   The alternate is now gated on `availableLocales`. Note this drives the visible
   switcher only — the page emits no `hreflang`.

There was also a hardcoded Italian sentence in `views/product/ProductBody.astro`
— the out-of-stock message — which was Italian on every locale by construction.
It is `product.outOfStock` in both catalogues now.

**The rule this leaves behind:** when a string that comes from the database sits
next to a string that comes from `i18n/*.json`, resolve BOTH in the content's
locale and mark the pair. Never resolve one in each.

## The `/en/` guard, and the four routes it used to 404

Requesting an English slug without its prefix — `/search/`, `/cart/` — is a
mistake rather than a route, so the middleware 404s it. That set is built by
stripping `/en/` off every English path, which quietly included the four paths
spelled identically in both languages:

```
/en/checkout/       → /checkout/         ← a real Italian route
/en/blog/           → /blog/             ← a real Italian route
/en/privacy-policy/ → /privacy-policy/   ← a real Italian route
/en/cookie-policy/  → /cookie-policy/    ← a real Italian route
```

All four 404'd on the Italian storefront, the checkout among them: the cart's
own "vai alla conferma" led to a dead page. The set now subtracts
`ITALIAN_STATIC_PATHS`, so a shared spelling resolves as Italian and only the
genuinely English-only slugs 404.
