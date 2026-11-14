import * as v from 'valibot';

import { PaginationSchema } from './common.ts';
import { LanguageCodeSchema } from './i18n.ts';

const DateOnlySchema = v.pipe(
  v.string(),
  v.trim(),
  v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.'),
);

export const PaymentQuerySchema = v.object({
  ...PaginationSchema.entries,
  q: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(120))),
  paymentStatus: v.optional(
    v.picklist(['unpaid', 'authorized', 'paid', 'partially_refunded', 'refunded', 'failed']),
  ),
  type: v.optional(v.picklist(['rental', 'fixed'])),
  from: v.optional(DateOnlySchema),
  to: v.optional(DateOnlySchema),
});

export type PaymentQuery = v.InferOutput<typeof PaymentQuerySchema>;

/** Starting (or restarting) an online payment: only the language travels. */
export const StartPaymentSchema = v.strictObject({
  language: v.optional(LanguageCodeSchema),
});

/** The result page's token: random, url-safe, ours. */
export const PaymentTokenParamSchema = v.object({
  token: v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{20,64}$/, 'Invalid payment link.')),
});

export type StartPaymentInput = v.InferOutput<typeof StartPaymentSchema>;
