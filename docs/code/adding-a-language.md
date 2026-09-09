# Adding a language

Everything language-shaped derives from one array. This is the whole procedure.

## 1. Register it

`packages/validators/src/language.ts` — append an entry. **Append only, source
language first**: the array order is the order PostgreSQL stores in the
`language_code` enum, and enum ordering is part of the type, so reordering is a
destructive migration rather than an edit.

```ts
{
  code: 'de',
  label: 'Deutsch',        // endonym — what a picker shows in any interface language
  tag: 'de-DE',            // <html lang>, every Intl formatter
  ogLocale: 'de_DE',       // og:locale
  searchConfig: 'german',  // must exist: SELECT cfgname FROM pg_ts_config
  flag: '🇩🇪',
}
```

## 2. Migrate

```
pnpm db:generate     # emits ALTER TYPE "language_code" ADD VALUE 'de';
pnpm db:migrate
```

The migration must stay alone. A transaction cannot use an enum value it added
itself, so no seed or backfill may share it.

Nothing else changes in the schema, and that is by design:

| Structure                        | Why no DDL                                                 |
| -------------------------------- | ---------------------------------------------------------- |
| 4 `*_translations` tables        | keyed `(parentId, languageCode)` — a language is a **row** |
| 13 `localized()` jsonb columns   | `{it,en}` → `{it,en,de}` is a **value** edit               |
| 12 `…_it_check` constraints      | each asserts only `col ? 'it'`                             |
| 4 unique `(language_code, slug)` | already composite; no collision, no rebuild                |
| 2 GIN search indexes             | indexed on the `tsvector`, not per dictionary              |

## 3. Let the compiler find the rest

```
pnpm check
```

Two places are `Record<LanguageCode, …>` and will fail until answered:

- `packages/i18n/src/enum-labels.ts` — 8 catalogs, 34 entries. `tsc` names every
  missing one.
- `apps/server/src/modules/products/mapper.ts` — the `YES`/`NO` pair.

Note the gender trap in `enum-labels.ts`: `ORDER_STATUS` agrees with the noun
for "order", `PAYMENT_STATUS` with the noun for "payment", and those genders
differ per language. German sidesteps it — a predicative participle does not
inflect — so do not copy French's `-e` pattern into it.

### `pnpm check` finds the exhaustive records, and nothing else

This is the step that costs more than it looks. `tsc` only fails where a type
says `Record<LanguageCode, …>`. It says nothing about the far commoner shape —
reading an OPTIONAL language off a value:

```ts
// compiles clean, silently drops every language after the second
title: { it: source.translations.it?.title ?? '', en: source.translations.en?.title }
```

Adding German turned up six of those, left behind by the French pass: the
product Basics, Pricing and Specs tabs, the terms and blog-category editors, and
the catalogue's preview renderer and sync. Each one loaded two languages into a
form the switcher offered four of, so a German value could be typed, saved, and
then blanked by the next save of the same record.

Grep for them — the compiler will not:

```
rg "\.(it|en)\b" apps packages --glob '!node_modules'
rg "\{ *it:" apps packages --glob '!node_modules'
```

The fix is never to add the new code to the list. It is `localizedFrom` on the
way in, `localizedOrNull` / `buildTranslations` on the way out, and
`translationError` for a field error that may land on any language.

## 4. Storefront routes

`apps/website/src/lib/routes.ts` — add a `routePaths.<code>` block with all 21
paths, every one prefixed `/<code>/`. A `satisfies` in that file makes a missing
route a compile error. Nothing else in the routing layer needs touching: the
middleware builds its lookup tables and its 404 set from this array.

Nothing in the SEO layer needs touching either, and that is the point of having
one table. The switcher, the `hreflang` block in `BaseLayout` and `/sitemap.xml`
all read the same `languagePaths`, so the new language appears in all three at
once — see `storefront-languages.md`.

Once published, these are an SEO commitment like the Italian ones.

## 5. UI copy, at your own pace

`apps/website/src/i18n/<code>.json`. **`translate()` does not throw for a target
language** — it falls back to the source. So the language can go live with real
URLs and translated database content while the 679 chrome strings are still
being written. A gap in the _source_ catalogue still throws, because that is a
bug.

The URLs are real from the moment step 4 lands, but they are not _advertised_
until they are earned: `hreflang` and the sitemap list a page in a language only
when that page's content exists in it, which for a product means an
`availableLocales` entry, not a route.

```
pnpm --filter @mia/website run i18n:coverage          # a percentage per locale
pnpm --filter @mia/website run i18n:coverage --list   # the exact missing keys
```

The script also reports orphaned keys — a rename that left a translation behind
which can never render.

## What deliberately does NOT widen

`ContractLanguage` in `packages/templates/src/literal/contract/language.ts` is
`'it' | 'en'` and stays that way. A rental contract is binding legal text
drafted per jurisdiction, not a translation of another contract, so registering
a language must not imply one can be rendered in it. `asContractLanguage()`
throws rather than falling back to Italian: serving a legally different document
under a number recorded as something else is worse than a 500.

## The rule that keeps this working

No file outside the registry may write a language code as a literal, or assume
how many there are. In practice that means:

- resolve a value with `pickLocalized(value, locale)`, never
  `locale === 'x' ? value.x : value.it`
- iterate with `LANGUAGE_CODES` / `TARGET_LANGUAGE_CODES`, never `['it', 'en']`
- in the admin, go through `~/lib/i18n`: `textFor`, `setTextFor`, `gapsIn`,
  `progressAcross`, `buildTranslations`, `localizedFrom`

The first two languages were spelled out as ternaries in ~50 files. That is what
made the third one a project instead of an array entry. The third one cost four
files: the registry, one migration, `enum-labels.ts`, and a `routePaths` block.

The fourth cost those same four, plus `de.json`, plus the six editors named
under step 3 that the third pass had not converted. Those six are converted now,
so the fifth language should be the four files this document promises — provided
nothing new reads a language off a value by name.
