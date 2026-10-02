import { asMoney, toHundredths } from './money.ts';

/**
 * The lowest real figure a product can be had for: a fixed product's own
 * price, else a rental's cheapest package. `null` when there is neither.
 *
 * One definition for two readers, so they cannot drift:
 *   - `products.starting_price`, written on every save — the catalogue's price
 *     sort reads that column instead of opening `rental_packages` per row;
 *   - `PricingDto.fromPrice`, the "da …" on every card and product page.
 *
 *   basePrice  packages (price)        →  starting price
 *   '289.00'   []                      →  '289.00'
 *   null       ['180.00', '89.00']     →  '89.00'
 *   null       []                      →  null
 *
 * Same answer as the SQL it replaced (and the migration's backfill):
 * `COALESCE(base_price, MIN((entry->>'price')::numeric))`. Compared in bigint
 * hundredths, never as JS numbers.
 */
export function startingPrice(
  basePrice: string | null,
  packages: readonly { price: string }[],
): string | null {
  if (basePrice !== null) return basePrice;
  let cheapest: string | null = null;
  for (const pkg of packages) {
    const price = asMoney(pkg.price);
    if (cheapest === null || toHundredths(price) < toHundredths(cheapest)) cheapest = price;
  }
  return cheapest;
}
