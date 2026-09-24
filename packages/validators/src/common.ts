import * as v from 'valibot';

import {
  ADMIN_PASSWORD_MIN_LENGTH,
  CUSTOMER_PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} from './password-policy.ts';

export * from './password-policy.ts';

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

/**
 * The two password rules. Their lengths, and why they differ, are in
 * `password-policy.ts` — a dependency-free module so the storefront can read the
 * number in the browser without bundling valibot.
 */
export const PasswordSchema = v.pipe(
  v.string(),
  v.minLength(ADMIN_PASSWORD_MIN_LENGTH, `Use at least ${ADMIN_PASSWORD_MIN_LENGTH} characters.`),
  v.maxLength(PASSWORD_MAX_LENGTH),
);

export const CustomerPasswordSchema = v.pipe(
  v.string(),
  v.minLength(
    CUSTOMER_PASSWORD_MIN_LENGTH,
    `Use at least ${CUSTOMER_PASSWORD_MIN_LENGTH} characters.`,
  ),
  v.maxLength(PASSWORD_MAX_LENGTH),
);

/** A person's name, as an operator or a customer types it. */
export const FullNameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(2, 'Enter a name.'),
  v.maxLength(120),
);

/** Free-form on purpose: a number may be a mobile, a desk or an extension. */
export const PhoneSchema = v.pipe(v.string(), v.trim(), v.maxLength(40));

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
