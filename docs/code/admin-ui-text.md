# Admin interface copy (`t()` / `tn()`)

Covers `apps/admin/src/lib/ui-text/` and `apps/admin/src/i18n/<language>/<namespace>.json`.
Enum labels (order status, rental unit) are a different system — `@mia/i18n`, see
[static-i18n-labels.md](./static-i18n-labels.md). Content typed by operators is a third —
`*_translations` tables and `localized()` jsonb.

## How a string is resolved

```text
                      code                              uiLang   result
1. normal             t('nav.products')                 it       it/nav.json  "products": "Prodotti"
2. switch language    same, topbar → fr                 fr       fr/nav.json  "Produits"   (re-renders, no reload)
3. gap                fr/nav.json has no "products"     fr       en/nav.json  "Products"
4. empty string       fr/nav.json "products": ""        fr       en/nav.json  "Products"   (empty = gap)
5. typo               t('nav.prodcts')                  —        svelte-check error, never ships
6. params             t('orders.title', { code: 'MM-102' })      "Ordine MM-102"
7. counted            tn('orders.items', 1) / tn(…, 3)  it       "1 articolo" / "3 articoli"
                      ← keys "items.one", "items.other" in orders.json
```

- **English is the reference.** `en/*.json` defines the key set (`MessageKey` is derived
  from it) and is the fallback. Italian — the registry's source language — must be complete;
  `fr` and `de` may have gaps. `pnpm --filter @mia/admin test` enforces it: same namespace
  files per language, no key English lacks, Italian and English complete, same `{params}`.
- **Call at render time.** `t()` reads `uiLang.current`; inside markup or `$derived` it
  re-renders on a language switch. A module-level constant stores the KEY
  (`titleKey: 'nav.products'`) and the component calls `t(item.titleKey)`.
- **Key = `namespace.camelCaseKey`**, English, named for meaning not wording
  (`common.save`, `orders.emptyState`). A namespace is a JSON file; adding one is a file per
  language plus one import line in `catalogue.ts`.
- **`common`** holds words reused across screens (Save, Cancel, Delete, Close, Search,
  Loading…). Reuse it before adding a page-local copy of the same word.
- **Never concatenate translated fragments** (`t('a') + ' ' + name`). Word order differs per
  language; use one template with `{name}`.
- **Shared namespaces.** `entities` holds record names: `tn('entities.order', n)` →
  "3 ordini" for counts (`ListCard countKey`), `t('entities.orderNoun')` for `ResourceView`.
  `status` holds labels for statuses `@mia/i18n` does not cover (contract, rental,
  extension, blog, payment method, email kinds, date presets).
- **Status labels are resolved per call.** `orderStatusMeta(s).label` — order and payment
  statuses come from `@mia/i18n` (what customers see too), the rest from `status.*`.
  Never lowercase a label into a sentence — German nouns keep their capital
  (`Zahlung ausstehend`); phrase the sentence around it: `"Stato: {status}"`.
- **Data-keyed catalogues** (permissions, keyed by `order:read`) use `tOptional()` with the
  package's English as fallback, and a test pins the JSON to the data.
- **Dates and numbers** (`lib/format.ts`) follow the interface language; durations use
  `durationLabel()` from `@mia/i18n`.
- **Not translated here:** server error messages (they arrive in English), operator-typed
  content, enum labels, brand names, language endonyms (`Italiano`, `Deutsch`).

## Terminology

Italian copy reuses the storefront's vocabulary (`apps/website/src/i18n/it.json`) — the
client reads both, so `noleggio`, `ordine`, `carrello` mean the same thing in each. Operator
UI uses the informal-neutral imperative (`Salva`, `Elimina`), as in the storefront.
