/**
 * Money and decimals: what a data file writes, and what PostgreSQL stores.
 *
 * A data file writes a plain number. `days(1, 90)` is one day at 90 euro, and
 * `'max-load': 100` is 100 kg. The column is `numeric`, which Drizzle surfaces
 * as a string, so one function stands between the two:
 *
 *   authored      parsed          column           read back
 *   90            '90.00'         numeric(12,2)    '90.00'
 *   90.5          '90.50'         numeric(12,2)    '90.50'
 *   0.1           '0.10'          numeric(12,2)    '0.10'
 *   13            '13.0000'       numeric(14,4)    '13.0000'
 *   20.005        REJECTED        numeric(12,2)    would have stored 20.01
 *   29.999        REJECTED        numeric(12,2)    would have stored 30.00
 *   99999999999   REJECTED        numeric(12,2)    would have raised overflow
 *
 * The two rejections in the middle are the reason this exists. Postgres raises
 * on overflow but rounds excess decimals in silence, so an amount the shop
 * never typed reaches the shelf and nothing reports it. Both were checked
 * against the live column, not assumed.
 *
 * Why a JS number is safe to author with, given the project's rule that money
 * is never a number: the rule guards arithmetic and round trips, and neither
 * happens here. A price is a literal in a source file, parsed exactly once into
 * the string that is written, and no total is ever computed from it. Every
 * value the column can hold — ten integer digits and two decimals, twelve
 * significant figures — is exactly representable as a double, so the conversion
 * loses nothing. What leaves this module is a string, and it stays a string.
 */

/** What a data file writes. */
export type Amount = number;

/** What a `numeric` column is given — the only form that leaves this module. */
export type Money = `${number}.${number}`;

/**
 * `numeric(12,2)` and `numeric(14,4)` both allow ten integer digits, so both
 * share this bound: `A field with precision 12, scale 2 must round to an
 * absolute value less than 10^10`.
 */
const MAX_EXCLUSIVE = 10_000_000_000;

/** Money columns are `numeric(12,2)`; spec values are `numeric(14,4)`. */
type Scale = 2 | 4;

/**
 * One authored number as the exact decimal string its column wants.
 *
 * `field` names the value for the failure message, and the caller owes it a
 * path a person can act on — `slim-self-propelled / package weekend / price`,
 * not `price`.
 */
export function parseDecimal(value: Amount, scale: Scale, field: string): string {
  const reject = (reason: string): never => {
    throw new Error(`${field}: ${reason} (received ${String(value)})`);
  };

  if (!Number.isFinite(value)) reject('must be a finite number');
  if (value < 0) reject('must not be negative');
  if (value >= MAX_EXCLUSIVE) reject('exceeds numeric precision — under 10 integer digits');

  /**
   * `String` gives the shortest text that round-trips the double, so a literal
   * written with two decimals reads back with two. That makes the digits after
   * the point countable, which is the check no column type performs.
   */
  const text = String(value);
  const parsed = /^(\d+)(?:\.(\d+))?$/.exec(text);
  if (!parsed) reject('is not a plain decimal number');

  const [, whole = '0', fraction = ''] = parsed as RegExpExecArray;
  if (fraction.length > scale)
    reject(`has ${String(fraction.length)} decimal places; the column keeps ${String(scale)}`);

  return `${whole}.${fraction.padEnd(scale, '0')}`;
}

/** A price, a base price, a marketing rate, an add-on — `numeric(12,2)`. */
export function parseMoney(value: Amount, field: string): Money {
  return parseDecimal(value, 2, field) as Money;
}

/** A spec value, a filter bound — `numeric(14,4)`, four decimals not two. */
export function parseSpecNumber(value: Amount, field: string): string {
  return parseDecimal(value, 4, field);
}
