/**
 * Rental duration sets. The durations repeat, the prices vary — 58 rental
 * products across the catalogue share only 26 distinct duration sets, and the
 * longest set alone covers ten products.
 *
 * A tier returns a function wanting exactly one price per duration, in order.
 * Handing five prices to a six-duration tier does not compile.
 */
import { tiers } from '../../lib/tiers.ts';

/** `7 → { it: '7 giorni', en: '7 days' }`. The one place Italian belongs. */
const dayName = (duration: number) => ({
  it: `${duration} giorni`,
  en: `${duration} days`,
});

/** The catalogue's most common set. */
export const longStay = tiers({
  unit: 'day',
  durations: [7, 15, 30, 45, 60, 90],
  name: dayName,
});

/** Short rentals — post-operative, a holiday. */
export const shortStay = tiers({ unit: 'day', durations: [3, 7, 15, 30, 45], name: dayName });

/** Therapy devices, rented by the month. */
export const monthly = tiers({ unit: 'day', durations: [30, 60, 90], name: dayName });
