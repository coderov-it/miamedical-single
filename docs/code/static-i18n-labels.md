# Static bilingual labels (`@mia/i18n`)

Covers `packages/i18n/src/enum-labels.ts`. For the storefront's own page copy —
the message catalogues, the request locale and the `/en/` routes — see
[storefront-languages.md](./storefront-languages.md).

## Two kinds of i18n, one of which the project already solved

The existing rule (`docs/backend-structure-and-standart.md`, `schema/i18n.ts`) is about
**content** — text an operator typed, which therefore has to be stored per row:

| Storage                                     | When                                                           | Example                      |
| ------------------------------------------- | -------------------------------------------------------------- | ---------------------------- |
| `*_translations` table                      | PostgreSQL indexes the text (tsvector, per-locale unique slug) | product title, category slug |
| inline `{ it, en }` jsonb via `localized()` | everything else                                                | spec label, addon name       |

Neither applies to an **enum value**. `'day'`, `'draft'`, `'partially_refunded'` are machine
tokens: they are written by the code, identical in every install, and never edited by a
human. There is nothing bilingual to _store_ — only to _display_. Putting `{it: 'giorno',
en: 'day'}` on every row would be storing the same two strings 98 times and inviting them
to drift.

So they live in code, keyed by the token:

```ts
export const RENTAL_UNIT = {
  hour: {
    it: { one: 'ora', many: 'ore', per: "all'ora" },
    en: { one: 'hour', many: 'hours', per: 'per hour' },
  },
  day: {
    it: { one: 'giorno', many: 'giorni', per: 'al giorno' },
    en: { one: 'day', many: 'days', per: 'per day' },
  },
} as const satisfies Labels<RentalUnit, UnitForms>;
```

## Why `satisfies`, and not a lookup by string key

`satisfies Labels<RentalUnit, UnitForms>` is the entire reason this file exists rather than
a JSON message catalogue. Append a member to the `rental_unit` pgEnum and the build stops
until both languages are written:

```
src/enum-labels.ts(54,12): error TS1360: Type '{ readonly hour: …; readonly day: … }'
  does not satisfy the expected type 'Labels<"hour" | "day" | "week", UnitForms>'.
  Property 'week' is missing …
```

A flat key namespace (`rental_unit_week_per`) cannot do that — nothing ties the key set to
the union, so a new enum member ships with a missing label and fails at runtime, in
production, in whichever language nobody on the team reads.

The union types come from `@mia/validators` (`ProductStatus`, `RentalUnit`, `OrderStatus`,
…), not `@mia/db`. That keeps this package free of drizzle and postgres, so the Astro
storefront can import it — neither frontend depends on `@mia/db`.

## Why rental units carry three forms

Italian elides the preposition before a vowel:

```
al giorno      ✓        all'ora     ✓
al ora         ✗        all'giorno  ✗
```

So `'al ' + unit` is wrong for exactly half the enum, and there is no rule to compute it
from the noun alone. `many` is not `one + 's'` either (`ora` → `ore`). The forms are
therefore written out and selected, never composed:

```ts
unitLabel('hour', 'it', 'per'); // "all'ora"
durationLabel(7, 'day', 'it'); // "7 giorni"
durationLabel(1, 'day', 'it'); // "1 giorno"
```

Every other catalog is one string per language (`Plain`), because statuses and value types
only ever appear as a standalone noun phrase.

## What this replaced

Both apps had grown their own labels, in different languages, for the same enum:

- `apps/website/src/lib/api.ts` — `rentalUnitLabel()` hardcoding Italian (`'al giorno'`)
- `PricingTab.svelte` — inline `'Hour'` / `'Day'` in English

That is the failure mode the catalog prevents: not a missing translation, but two of them
disagreeing. The admin now passes `uiLang.current`; the storefront passes a `LOCALE`
constant, since it is Italian-only — explicit rather than hardcoded, so adding an English
storefront is threading a value through, not hunting down string literals.

## What this is _not_

Not a UI-chrome translation system. Buttons, headings and validation prose are hundreds of
open-ended strings and do not belong in a hand-maintained `as const` map. When the admin
chrome gets translated, the tool for it is Paraglide JS (compiler-based, tree-shakeable,
typed message functions), hanging off the hook `ui-lang.svelte.ts` already documents.

The two are complementary: Paraglide gives ergonomics at scale, this gives exhaustiveness
over a closed set. Enum labels stay here.

## Adding a language

1. Add the code to `languageCode` (`packages/db/src/schema/i18n.ts`) and `LANGUAGE_CODES`
   (`packages/validators/src/i18n.ts`).
2. Add a dictionary entry in `search.ts` — `SEARCH_CONFIG` must learn it.
3. Run `pnpm -r check`. Every catalog in `enum-labels.ts` now fails to satisfy its type;
   fill in the new language. That build break is the feature.

## Adding an enum member

Add it to the pgEnum and to the matching picklist in `@mia/validators`, then run
`pnpm -r check` and fill in the label the error names.
