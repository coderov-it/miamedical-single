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
differ per language.

## 4. Storefront routes

`apps/website/src/lib/routes.ts` — add a `routePaths.<code>` block with all 22
paths, every one prefixed `/<code>/`. A `satisfies` in that file makes a missing
route a compile error. Nothing else in the routing layer needs touching: the
middleware builds its lookup tables and its 404 set from this array.

Once published, these are an SEO commitment like the Italian ones.

## 5. UI copy, at your own pace

`apps/website/src/i18n/<code>.json`. **`translate()` does not throw for a target
language** — it falls back to the source. So the language can go live with real
URLs, working `hreflang` and translated database content while the 679 chrome
strings are still being written. A gap in the _source_ catalogue still throws,
because that is a bug.

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
made the third one a project instead of an array entry.
