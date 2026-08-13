/**
 * The input side of money. `format.ts` renders an amount; this reads one back.
 *
 * Money is a decimal string end to end — `numeric(12,2)` in Postgres, a string on
 * the wire — so nothing here returns a number. Arithmetic is done in whole cents
 * and formatted straight back to a string, because `15.10 + 0.20` in floats is
 * `15.299999999999999`.
 *
 * These live apart from any component so the rules stay one thing whatever chrome
 * wraps them — today the labelled `money-input.svelte` field, used everywhere an
 * operator types an amount.
 */

interface MoneyOptions {
  allowNegative?: boolean;
}

/**
 * What someone typed → a canonical `"0.00"`, or `null` when it is not a number at
 * all. Accepts `,` and `.` as the decimal separator: the operators are Italian and
 * their keyboards produce the comma.
 *
 *   "15"     → "15.00"      "15,5"  → "15.50"
 *   "15.567" → "15.56"      "-3"    → "0.00" unless negatives are allowed
 *   ""       → null         "abc"   → null
 *
 * `null` rather than `"0.00"` for junk, so a caller can put the previous value
 * back instead of silently pricing something at zero.
 */
export function parseMoney(text: string, { allowNegative = false }: MoneyOptions = {}): string | null {
  const raw = text.trim().replace(',', '.');
  const match = /^(-?)(\d*)(?:\.(\d*))?$/.exec(raw);
  if (!match || raw === '' || raw === '-') return null;

  const sign = allowNegative && match[1] === '-' ? '-' : '';
  const whole = match[2] || '0';
  // Truncated, not rounded: nobody typing a third decimal into a euro field means
  // to have the cents rounded up under them.
  const cents = ((match[3] ?? '') + '00').slice(0, 2);
  return `${sign}${whole}.${cents}`;
}

/** Moves an amount by whole currency units, clamped at zero unless told otherwise. */
export function stepMoney(
  value: string,
  byUnits: number,
  { allowNegative = false }: MoneyOptions = {},
): string {
  const cents = Math.round(Number(value) * 100) + Math.round(byUnits * 100);
  return ((allowNegative ? cents : Math.max(0, cents)) / 100).toFixed(2);
}

/** `"15.00"` → `"15,00"`, for what the field shows while being edited. */
export function toMoneyText(value: string): string {
  return value.replace('.', ',');
}

/** True when there is nothing left to subtract — for disabling a decrement. */
export function isAtZero(value: string): boolean {
  return Math.round(Number(value) * 100) <= 0;
}
