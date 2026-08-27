import * as v from 'valibot';

import { PaginationSchema } from './common.ts';

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
