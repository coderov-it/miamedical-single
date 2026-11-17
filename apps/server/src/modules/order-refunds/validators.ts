import { UuidSchema } from '@mia/validators';
import * as v from 'valibot';

/** Up to two decimals, strictly positive; normalised to exactly two ("12.5" → "12.50"). */
export const RefundAmountSchema = v.pipe(
  v.string(),
  v.trim(),
  v.regex(/^\d{1,10}(\.\d{1,2})?$/, 'Use a decimal amount with up to two places, e.g. "12.50".'),
  v.transform((value) => Number(value).toFixed(2)),
  v.check((value) => value !== '0.00', 'The amount must be greater than zero.'),
);

export const RecordRefundSchema = v.object({
  amount: RefundAmountSchema,
  reason: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(3, 'Say why, in at least 3 characters.'),
    v.maxLength(500, 'Keep the reason under 500 characters.'),
  ),
  rentalExtensionId: v.optional(UuidSchema),
});

export type RecordRefundInput = v.InferOutput<typeof RecordRefundSchema>;
