/**
 * Rental package tiers: the durations a category offers, declared once, priced
 * per product.
 *
 * 58 of the catalogue's rental products share only 26 distinct duration sets —
 * one set covers ten products — so the durations are the repetition and the
 * prices are the variation. Declaring a tier gives back a function that wants
 * exactly as many prices as there are durations, in the same order:
 *
 *   const shortStay = tiers({ unit: 'day', durations: [3, 7, 15] , … });
 *   shortStay(['25.00', '30.00', '35.00'])     // three prices, three packages
 *   shortStay(['25.00', '30.00'])              // Source has 2, target requires 3
 *
 * The length check is the tuple type `{ [K in keyof D]: Money }`, which maps a
 * tuple of durations to a same-length tuple of prices. Nothing runs to verify
 * it; a mismatch does not compile.
 */
import type { Localized, Money, NonEmpty, RentalPackageInput } from './types.ts';

/** Durations must be non-empty — a rental product with no package has no price. */
export type Durations = readonly [number, ...number[]];

export interface TierDefinition<D extends Durations> {
  unit: 'hour' | 'day';
  durations: D;
  /**
   * The name a customer reads, built from the duration. This is the one place
   * Italian belongs — `(n) => ({ it: `${n} giorni`, en: `${n} days` })`.
   */
  name: (duration: number, unit: 'hour' | 'day') => Localized;
}

/**
 * A priced tier set. The returned function takes one price per duration and
 * hands back the packages a product's `packages` field wants.
 *
 * Package codes are generated in English — `7-days`, `12-hours` — because a
 * code is the handle an order line records, not text anybody reads.
 */
export function tiers<const D extends Durations>(
  definition: TierDefinition<D>,
): (prices: { [K in keyof D]: Money }) => NonEmpty<RentalPackageInput> {
  return (prices) => {
    const packages = definition.durations.map((duration, index) => ({
      code: `${duration}-${definition.unit}s`,
      name: definition.name(duration, definition.unit),
      // The tuple type guarantees one price per duration, which no index
      // signature can express to `noUncheckedIndexedAccess`.
      price: (prices as readonly Money[])[index] as Money,
      duration,
      unit: definition.unit,
    }));

    // `durations` is `[number, ...number[]]`, so `map` produced at least one
    // package. The compiler cannot carry non-emptiness through `map`.
    return packages as unknown as NonEmpty<RentalPackageInput>;
  };
}
