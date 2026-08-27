import * as v from 'valibot';

export const UuidSchema = v.pipe(v.string(), v.uuid('Must be a valid UUID.'));

export const SlugSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, 'Slug is required.'),
  v.maxLength(120),
  v.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only.'),
);

export const EmailSchema = v.pipe(
  v.string(),
  v.trim(),
  v.toLowerCase(),
  v.email('Enter a valid email address.'),
  v.maxLength(254),
);

export const PasswordSchema = v.pipe(
  v.string(),
  v.minLength(12, 'Use at least 12 characters.'),
  v.maxLength(128),
);

/**
 * Money is a `numeric(12, 2)`-shaped decimal **string** — `"35.00"`, never a
 * JS number. A JSON number 10.00 serialises back as 10; a string does not,
 * and float arithmetic is exactly what this project forbids. Server-side
 * maths goes through `money.ts` in bigint hundredths.
 */
export const MoneySchema = v.pipe(
  v.string(),
  v.trim(),
  v.regex(/^\d{1,10}\.\d{2}$/, 'Use a decimal amount with two places, e.g. "35.00".'),
);

/** Price modifiers may be negative — "cheaper without the headboard". */
export const SignedMoneySchema = v.pipe(
  v.string(),
  v.trim(),
  v.regex(/^-?\d{1,10}\.\d{2}$/, 'Use a decimal amount with two places, e.g. "-4.00".'),
);

export const CurrencySchema = v.pipe(v.string(), v.length(3), v.toUpperCase());

/** A calendar date on the wire — `"2026-09-01"`, never a timestamp. */
export const DateOnlySchema = v.pipe(
  v.string(),
  v.trim(),
  v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.'),
);

/** Coerces `?page=2` style query strings into numbers before validating. */
const numericQuery = (fallback: number) =>
  v.pipe(
    v.optional(v.union([v.string(), v.number()]), fallback),
    v.transform((value) => (typeof value === 'string' ? Number(value) : value)),
    v.number(),
    v.integer(),
  );

export const PaginationSchema = v.object({
  page: v.pipe(numericQuery(1), v.minValue(1)),
  perPage: v.pipe(numericQuery(24), v.minValue(1), v.maxValue(100)),
});

export type Pagination = v.InferOutput<typeof PaginationSchema>;
