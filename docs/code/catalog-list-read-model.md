# Catalogue list — what a page of cards loads

Code: `apps/server/src/modules/products/catalog/summary-repo.ts` (loaders),
`catalog/list-query.ts` (WHERE / ORDER BY), `startingPrice()` in
`packages/pricing/src/starting-price.ts`. Tests: `products/mapper.test.ts`,
`pricing/src/starting-price.test.ts`.

## `starting_price`

```
save                                         products.starting_price
1. fixed  basePrice '289.00', packages []          → 289.00
2. rental basePrice null, packages 180.00, 89.00   → 89.00   (the cheapest)
3. admin edits the rental's packages to 75.00, 89.00
   service: startingPrice(existing.basePrice, new packages) → 75.00
4. admin edits only the title                      → untouched
```

Written by every path that writes `base_price` or `rental_packages`: admin
create (repo) and update (service, which holds the half the update left out),
catalog sync (`packages/catalog/src/script/sync/rows.ts`), the seed. The same
function is the cards' `pricing.fromPrice`, so the sort and the "da …" on the
card cannot disagree. Migration `0019` backfilled existing rows with the SQL the
sort computed per row before — `COALESCE(base_price, MIN(package price))`.

`products_status_mode_starting_price_idx (status, pricing_mode, starting_price)`
serves `/catalogo-noleggio/?sort=price_asc` straight off the index; the mixed
`/catalogo/` still sorts, but on a column instead of a JSON walk per row.

## One page, `GET /api/products?locale=en&perPage=24`

```
query                                              loads
1. page        products, 24 rows                  card columns + every translation's
                                                   language code (→ availableLocales)
   + count     same WHERE                         one number
2. texts       product_translations, en + it      title, slug, short description
3. categories  distinct ids on the page (say 3)   id, code, en + it name and slug
4. specs       only for cards with NO chips, and  comparable specs of those cards'
               only if there are any              categories, with their options —
                                                   once per category, shared by its cards
   values      those cards × those specs          spec values + option links
```

Before, one relational query loaded for each of the 24 cards: every language's
full row (long description and search vector included), the category with all
its translations, and every spec of the category with all its options.

Fallback cases, same page:

```
every card has chips        → step 4 is skipped: no spec query at all
locale=it                   → steps 2–3 ask for Italian only
admin list                  → step 1 loads every language (the translation-status
                              dots need them) but `left(description, 1)` instead of
                              the description; no specs, no facets
```

DTOs are unchanged: the narrowed rows feed the same mapper, and
`mapper.test.ts` builds each card from the full rows and from the narrow ones
and requires them equal.
