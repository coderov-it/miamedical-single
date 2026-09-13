# Generating translations

How a product's other languages get filled from one that already has text. The
action is the **Translate** button in the product editor's header.

| Where                                                                                   | What it owns                                 |
| --------------------------------------------------------------------------------------- | -------------------------------------------- |
| `apps/admin/src/lib/i18n/translation-plan.ts`                                           | sections, groups, and who is left alone      |
| `apps/admin/src/routes/(app)/products/[id]/translation-fields.ts`                       | what a product has that is translatable      |
| `apps/admin/src/routes/(app)/products/[id]/translation-save.ts`                         | mapping the answers back onto four endpoints |
| `apps/admin/src/lib/components/translate-dialog.svelte`                                 | state, the run, the save                     |
| `.../translation-confirm.svelte`, `translation-log.svelte`, `translation-review.svelte` | the three steps                              |
| `apps/server/src/modules/translation/routes.ts`                                         | `GET`/`POST /api/admin/translate`            |
| `apps/server/src/infra/translation/`                                                    | the provider port, `stub` and `deepl`        |

## What is in scope

Everything on a product that is language-dependent:

| Section         | Fields                                                              |
| --------------- | ------------------------------------------------------------------- |
| Product details | title, short description, description, meta title, meta description |
| Chips           | the text of each chip                                               |
| Media alt text  | `alt` on the thumbnail, clean cutout, gallery, videos, documents    |
| Specs           | the `textValue` of each free-text spec                              |
| Add-ons         | each add-on's name and description                                  |
| FAQs            | each FAQ's question and answer                                      |

Not included, deliberately:

- **`slug`** — derived from the translated title at save time (`~/lib/slug`).
  Asking a provider for a slug returns a title with spaces in it.
- **Spec option labels** — they belong to the category's spec definition, not to
  this product, so translating one product must not rewrite them for every other
  product in the category.
- **Intake questions** — the same shape as FAQs and addable the same way, but
  nobody has asked for it yet.

Meta title and meta description are covered like anything else, and _derived_
when the source has nothing — see below.

## Two hierarchies, two jobs

A **section** is what the operator sees. A **group** is what is protected: one
item — the product's translation row, one chip, one photo's alt, one spec's text
value, one add-on, one FAQ.

## The protection rule, and why its unit is the group

**A group the operator has written anything in is never touched, in that
language.**

Not per language: with forty fields, one hand-written French chip would cancel
the entire French run, which is the same as having no feature. Not per field:
filling in the rest of an item around a word somebody chose leaves a FAQ that is
half theirs and half the machine's, with nothing on screen saying which half.

So a FAQ whose French answer an operator wrote keeps both its French question and
its French answer, and the other FAQs still get translated.

The dialog shows this before the run starts, under "Kept as you wrote them".

There is **no provenance column** behind this — the catalogue does not record
whether a value was typed or generated. A group a previous run filled reads as
hand-written on the next one, which is the safe direction: re-running never
overwrites what it already produced.

## Fields with nothing to translate are derived

`metaTitle` and `metaDescription` are nullable and nothing in the admin asks for
them, so a product whose Italian row has neither had nothing to send — the run
correctly did nothing, and the operator was left wondering why "every
multi-language field" was not covered.

A field can now name a `deriveFrom`: another field in the same language to copy
when the source has nothing. Meta title comes from the title, meta description
from the short description — the ordinary SEO default. That is why the field is
`deriveFrom` and not a translation: nothing was translated, and the review labels
the value **derived** rather than passing it off as one.

Two rules make derivation safe:

- It is written **only when the field is empty in that language**, so it can
  never overwrite anything.
- It sits **outside the protection rule**. A group an operator has written in is
  skipped whole, and after the first run the product-details group reads as
  hand-written — so under the protection rule a meta title would be fillable
  exactly once and never again. Protection exists to stop text being overwritten;
  a field that is empty has nothing to overwrite.

Derived text is the one thing this feature will truncate to fit a cap, because
it is our own composition rather than a provider's answer; an over-long
translation is still refused and reported.

## Length caps are enforced, not truncated

Every field carries the server's cap (`maxLength`): 200 for a title, 20 for a
chip, 300 for alt text, 40 000 for the description. A translation longer than its
cap is **refused and reported** in the review, struck through with the
measurement — `Chip 2 · Chip text — 23/20 characters`.

Truncating would invent copy nobody wrote and hide the fact that the chip does
not fit. Reporting leaves it empty, which the storefront falls back on, and tells
the operator which value to shorten.

## A language row needs a title

`product_translations` rows exist with a title and a slug or not at all, so the
product-details group is only generated when the source has a title. That is the
`createsRow` mark on the title field and the `blockedReason` it produces — the
confirm step says "Nothing to generate: no Italiano title" rather than letting
the run build a payload the API is guaranteed to reject.

No other group has that requirement: a photo's alt text can be written in French
whatever the state of the French product page.

## The run is one request per language

Not one per field, and not a batch. The log shows a line per language as it
lands, so a batch call could only report progress for the whole set; it also
means one provider failure fails one language instead of the run.

`POST /api/admin/translate` takes `{ source, target, fields }`, and the server
validates the provider's answer against `TranslateResponseSchema` before
returning it — a provider is untrusted input like any other.

## Saving is four endpoints

The product is not one record:

```
PATCH /products/:id           translation row, chips, media alt text
PUT   /products/:id/specs     spec text values
PUT   /products/:id/addons    addon names and descriptions
PUT   /products/:id/faqs      FAQ questions and answers
```

Only the endpoints with something to write are called. Each collection PUT
replaces the whole list, so `translation-save.ts` rebuilds each array from the
DTO the page holds with the translated text merged in — the same shape the
corresponding tab sends, which is what stops a translated save from dropping a
field the tab would have kept.

The translation-row PATCH always carries the **source row** exactly as the server
returned it: the payload schema requires the source language on every request,
and a PATCH replaces a language's whole row.

One `GET` at the end rather than the last response body: four writes may have
landed, and only the server knows the combined result.

## Media alt text used to be untranslatable

`AltSchema` in `packages/validators/src/media.ts` listed `it` and `en` as literal
keys. The DB type (`MediaAlt = LocalizedOptional`) already allowed every
language, so a French or German alt was rejected by `strictObject` no matter how
correct it was. It is now built from the registry like every other localized
shape — `localizedOptionalSchema`, the all-optional counterpart of
`localizedSchema`, for values that are optional in the source language too.

## Saved runs remount the editor's tabs

Each tab holds the row it read when it mounted and does not re-seed, so the only
honest way to show newly written languages is to remount the panels — the
`{#key productVersion}` around them in `products/[id]/+page.svelte`. Remounting
would discard unsaved edits, so **the action refuses to start while any tab is
dirty** and says why. That check is what makes the remount safe.

The page also loads the product's category when the action is available: spec
labels live there, and the field builder needs them to name the spec groups.

## Providers

`TRANSLATION_PROVIDER` picks one, resolved once at boot in
`apps/server/src/infra/translation/index.ts`:

- `none` (default) — no provider, the admin hides the action.
- `stub` — returns the source text with a `[fr]`-style marker. Development only;
  the server refuses to boot production on it, the same way the `console` mail
  transport is refused.
- `deepl` — needs `DEEPL_API_KEY`. `tag_handling: html` is what keeps the rich
  text description as HTML, which the server's sanitiser requires on write.

**The batch is split by format.** `tag_handling` applies to a whole DeepL
request, and HTML mode HTML-escapes the text it returns — a plain title sent
through it comes back as `Vente d&#x27;un fauteuil roulant`. So a record that
mixes prose and markup becomes two requests per language: markup with the mode,
everything else without. Only `description` is `format: 'html'`; FAQ answers look
like markup in the fixture data but the storefront renders them with `{...}`,
which escapes, so they are text.

The API host lives in `apps/server/src/config/external-apis.ts`, not in the
environment. The boot summary prints which engine answered.

## Completeness is measured against the source

`toTranslationStatus` in `apps/server/src/modules/products/mapper.ts` counts the
fields the **source row actually carries**. Counting all six unconditionally made
`metaTitle` and `metaDescription` mandatory for a green badge, although they are
nullable and nothing in the admin asks for them — so a product whose Italian row
has neither could never report a complete translation, and every language sat at
`partial` with an orange dot and "EN FR DE pending" forever. A field the source
does not have is not a gap in a translation; there is nothing to translate it
from.

A consequence worth knowing: if Italian later gains a meta title, every target
language becomes `partial` again until it is translated. That is correct — there
is now something to translate.

## Reusing this for another editor

`translation-plan.ts` works off `PlanField[]`; `translation-fields.ts` shows how
to build one for a record and `translation-save.ts` how to map the answers back.
Category, blog and document sheets can do the same and get the whole dialog free
— only the builder and the saver are theirs. The route is currently guarded by
`product:update`, which is the permission the only caller holds; a shared
`translation:generate` capability is the right home once a second editor wants
it.
