import * as v from 'valibot';

import { DateOnlySchema, MoneySchema, PaginationSchema } from './common.ts';

export const RentalStatusSchema = v.picklist(['active', 'overdue', 'completed']);

export const RentalQuerySchema = v.object({
  ...PaginationSchema.entries,
  q: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(120))),
  status: v.optional(RentalStatusSchema),
});

const PERIOD_ORDER_MESSAGE = 'The end date must be after the start date.';

/** A rented span on the wire — also what the contract update-period route takes. */
export const RentalPeriodInputSchema = v.pipe(
  v.strictObject({
    from: DateOnlySchema,
    to: DateOnlySchema,
  }),
  v.forward(
    v.check((input) => input.to > input.from, PERIOD_ORDER_MESSAGE),
    ['to'],
  ),
);

/** How long one extension may run. Generous: a year covers any real request. */
const MAX_EXTENSION_DAYS = 365;

const ExtensionDaysSchema = v.pipe(
  v.number(),
  v.integer(),
  v.minValue(1, 'Pick how many days to extend by.'),
  v.maxValue(MAX_EXTENSION_DAYS, `An extension runs at most ${MAX_EXTENSION_DAYS} days.`),
);

/** The customer asks for one of the offered extension lengths. */
export const RequestExtensionSchema = v.strictObject({
  days: ExtensionDaysSchema,
});

/**
 * An operator raises an extension. `amount` overrides the quote — the shop may
 * agree a price no package lists — and is required when no package matches.
 */
export const AdminRequestExtensionSchema = v.strictObject({
  days: ExtensionDaysSchema,
  amount: v.optional(MoneySchema),
});

export const EXTENSION_PAYMENT_METHODS = ['bank_transfer', 'cash', 'card_pos', 'other'] as const;

/** The operator records that the extension was paid, which sends its contract. */
export const RecordExtensionPaymentSchema = v.strictObject({
  method: v.picklist(EXTENSION_PAYMENT_METHODS, 'Pick how the customer paid.'),
  reference: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(120))),
  /** What was actually received, when it differs from the quote. */
  amount: v.optional(MoneySchema),
});

export const CancelExtensionSchema = v.strictObject({
  reason: v.pipe(v.string(), v.trim(), v.minLength(1, 'Say why.'), v.maxLength(500)),
});

export type RentalStatus = v.InferOutput<typeof RentalStatusSchema>;
export type RentalQuery = v.InferOutput<typeof RentalQuerySchema>;
export type RequestExtensionInput = v.InferOutput<typeof RequestExtensionSchema>;
export type AdminRequestExtensionInput = v.InferOutput<typeof AdminRequestExtensionSchema>;
export type RecordExtensionPaymentInput = v.InferOutput<typeof RecordExtensionPaymentSchema>;
export type ExtensionPaymentMethod = (typeof EXTENSION_PAYMENT_METHODS)[number];
