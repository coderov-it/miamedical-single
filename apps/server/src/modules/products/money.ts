/**
 * Exact money arithmetic on `numeric(12,2)` decimal strings ("35.00").
 *
 * The whole point of storing money as strings is that IEEE-754 never touches
 * an amount — so this module does its maths in bigint hundredths and formats
 * back. No `parseFloat`, no `Number()` on amounts, anywhere.
 */

const MONEY_RE = /^(-?)(\d+)\.(\d{2})$/;

/**
 * Restore the two-decimal form of a money value that came back through a
 * JSON-aggregated relation.
 *
 * Drizzle's relational queries fetch nested rows with
 * `json_agg(json_build_array(...))`, and Postgres renders a `numeric` inside
 * JSON as a JSON *number*. By the time drizzle's `numeric` mapper stringifies
 * it, `0.00` has become `"0"` and `289.00` has become `"289"` — the scale the
 * column exists to preserve is gone. Top-level columns are unaffected; they
 * arrive over the wire protocol as text and keep their scale.
 *
 * `numeric(12,2)` tops out at 9,999,999,999.99 — under 2^53 hundredths — so the
 * round trip through a double loses no value, only the formatting. Anything
 * that is already well-formed passes straight through, and anything genuinely
 * unparseable is handed on untouched so `toHundredths` still rejects it loudly
 * rather than quietly inventing a zero.
 */
export function asMoney(value: string | number): string {
  if (typeof value === 'number') return Number.isFinite(value) ? value.toFixed(2) : String(value);
  if (MONEY_RE.test(value)) return value;
  const parsed = Number(value);
  return value.trim() !== '' && Number.isFinite(parsed) ? parsed.toFixed(2) : value;
}

/** "35.00" → 3500n. Throws on anything that is not a two-decimal string. */
export function toHundredths(amount: string): bigint {
  const match = MONEY_RE.exec(amount);
  if (!match) throw new Error(`Not a money string: "${amount}"`);
  const [, sign, whole, cents] = match;
  const value = BigInt(whole!) * 100n + BigInt(cents!);
  return sign === '-' ? -value : value;
}

/** 3500n → "35.00". */
export function fromHundredths(hundredths: bigint): string {
  const negative = hundredths < 0n;
  const abs = negative ? -hundredths : hundredths;
  const whole = abs / 100n;
  const cents = (abs % 100n).toString().padStart(2, '0');
  return `${negative ? '-' : ''}${whole}.${cents}`;
}

export function addMoney(...amounts: string[]): string {
  return fromHundredths(amounts.reduce((sum, amount) => sum + toHundredths(amount), 0n));
}

/**
 * amount × factor, half-up (commercial rounding, away from zero) to 2 dp.
 * `factor` is a decimal string or a plain number with at most 4 decimals —
 * a spec value like "16.5", never money itself.
 */
export function mulMoney(amount: string, factor: string | number): string {
  const factorStr = typeof factor === 'number' ? factor.toString() : factor;
  const match = /^(-?)(\d+)(?:\.(\d{1,4}))?$/.exec(factorStr);
  if (!match) throw new Error(`Not a numeric factor: "${factorStr}"`);
  const [, sign, whole, fraction = ''] = match;
  const scale = BigInt(10 ** fraction.length);
  const factorScaled =
    (BigInt(whole!) * scale + BigInt(fraction || '0')) * (sign === '-' ? -1n : 1n);

  const raw = toHundredths(amount) * factorScaled;
  const quotient = raw / scale;
  const remainder = raw % scale;
  const negative = raw < 0n;
  const roundUp = (negative ? -remainder : remainder) * 2n >= scale;
  return fromHundredths(quotient + (roundUp ? (negative ? -1n : 1n) : 0n));
}

export function isNegative(amount: string): boolean {
  return toHundredths(amount) < 0n;
}
