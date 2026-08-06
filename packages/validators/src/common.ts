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

/** Money in minor units. Integer, non-negative, capped to a sane maximum. */
export const CentsSchema = v.pipe(
  v.number(),
  v.integer('Amount must be a whole number of cents.'),
  v.minValue(0),
  v.maxValue(100_000_000),
);

export const CurrencySchema = v.pipe(v.string(), v.length(3), v.toUpperCase());

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
