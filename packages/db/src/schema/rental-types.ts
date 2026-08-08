import type { Localized } from './i18n.ts';

/**
 * Rental packages: pre-set duration bundles sold alongside the per-unit rate.
 *
 * A rental product always sells at `base_price` per `rental_unit` for any
 * duration the customer asks for. Packages sit next to that as fixed-duration
 * offers at a fixed total — cheaper than the same days billed per unit, which
 * is the whole point of listing them. Nothing in the database derives or
 * validates that discount: a package price is an amount the back office typed,
 * not a computation. `pricing.ts` never sees them.
 *
 * No table, for the same reason `media-types.ts` gives: packages are not
 * searched, not filtered, and never shared between products, so rows would buy
 * referential integrity nothing needs. One typed jsonb column on `products`.
 *
 * They deliberately do NOT join the SKU matrix. A custom duration has no SKU,
 * so duration cannot be a SKU axis without making the free-duration path
 * unrepresentable — and 15 packages across a colour/size product would
 * multiply the matrix for no warehouse meaning.
 */
export interface RentalPackage {
  /**
   * Stable handle, e.g. `7-giorni`. What an order line records, so a renamed
   * package does not rewrite history. Unique within a product.
   */
  code: string;
  name: Localized;
  /** `numeric(12,2)` as a string — the project money rule, never a JS number. */
  price: string;
  /** How long the package runs, counted in `unit`. */
  duration: number;
  /**
   * Its own unit, not inherited: a per-day product may still offer a 12-hour
   * package. Values match the `rental_unit` enum.
   */
  unit: 'hour' | 'day';
}

/** Cardinality lives in valibot (`RentalPackagesSchema`), as it does for media. */
export const EMPTY_RENTAL_PACKAGES: RentalPackage[] = [];
