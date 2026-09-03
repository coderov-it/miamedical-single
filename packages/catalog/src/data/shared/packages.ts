/**
 * The catalogue's package-naming convention, and the only place package copy is
 * written.
 *
 * `days(7, '30.00')` is one package: seven days, thirty euro, named
 * `7 giorni`, coded `7-days`. Duration and price sit on the same line, so
 * nothing has to be counted to learn what a duration costs, and every product
 * stays free to write a package longhand when its name is not its duration:
 *
 *   packages: [
 *     { duration: 2, unit: 'day', price: '20.00',
 *       code: 'weekend', name: { it: 'Weekend', en: 'Weekend' } },
 *     days(7, '30.00'),
 *     days(15, '35.00'),
 *   ]
 *
 * These are two shorthands in the DATA layer, not part of the API: the shop can
 * change how a package is worded, or stop using them, without the authoring
 * package knowing. That is also why the Italian lives here — `lib/` is English
 * throughout, and this is customer copy.
 */
import type { Amount, RentalPackageInput } from '../../lib/types.ts';

/** `1 giorno`, `7 giorni` — a package of one is not a package of seven. */
const plural = (duration: number, one: string, many: string) => (duration === 1 ? one : many);

/** A package counted in days. The common case: every rental product has these. */
export function days(duration: number, price: Amount): RentalPackageInput {
  const unit = plural(duration, 'day', 'days');
  return {
    duration,
    unit: 'day',
    price,
    name: {
      it: `${duration} ${plural(duration, 'giorno', 'giorni')}`,
      en: `${duration} ${unit}`,
    },
    code: `${duration}-${unit}`,
  };
}

/** A package counted in hours — the one case a customer is asked for a time. */
export function hours(duration: number, price: Amount): RentalPackageInput {
  const unit = plural(duration, 'hour', 'hours');
  return {
    duration,
    unit: 'hour',
    price,
    name: {
      it: `${duration} ${plural(duration, 'ora', 'ore')}`,
      en: `${duration} ${unit}`,
    },
    code: `${duration}-${unit}`,
  };
}
