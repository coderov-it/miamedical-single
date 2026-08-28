import type { Localized } from './i18n.ts';

/**
 * Rental packages: the price of a rental product, as fixed-duration offers.
 *
 * A rental product does not have a rate. It has packages, and a customer buys
 * one of them — "3 giorni, 25,00 €" is 25,00 €, not three times some daily
 * figure. Every amount here is typed by the back office and nothing derives it,
 * because the arithmetic does not hold: the same product advertised at 1,10 € a
 * day sells three days for 25,00 €, and the shop means both numbers. The one on
 * `products.marketing_rate` is copy; the ones here are money.
 *
 * That is why there is no per-unit fallback and no open-ended period. Without a
 * package there is no duration, no total, and nothing to put on an order.
 *
 * No table, for the same reason `media-types.ts` gives: packages are not
 * searched, not filtered, and never shared between products, so rows would buy
 * referential integrity nothing needs. One typed jsonb column on `products`.
 *
 * A package is a PRICE, never a thing on a shelf. It does not affect `stock`:
 * fifteen packages on one bed are fifteen ways to pay for the same bed, and
 * counting them separately would report fifteen beds the shop does not own.
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
  /**
   * How long the package runs, counted in `unit`. The customer picks a start
   * and this decides the end: 3 days from 10 August ends 13 August.
   */
  duration: number;
  /**
   * Its own unit, not inherited: a per-day product may still offer a 12-hour
   * package, and an hour package is the one case where the customer is asked
   * for a time of day. Values match the `rental_unit` enum.
   */
  unit: 'hour' | 'day';
}

/**
 * The `rental_packages` default, and the only value a fixed product may hold.
 * A rental product is CHECKed to have at least one — cardinality beyond that
 * lives in valibot (`RentalPackagesSchema`), as it does for media.
 */
export const EMPTY_RENTAL_PACKAGES: RentalPackage[] = [];
