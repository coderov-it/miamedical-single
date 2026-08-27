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

/**
 * The renewed period, and optionally the price agreed for it. Every renewal
 * issues a fresh contract for exactly this span; without a new `total` the
 * contract quotes the rental line's current amount, which is only right when
 * the price genuinely has not changed.
 */
export const RenewRentalSchema = v.pipe(
  v.strictObject({
    from: DateOnlySchema,
    to: DateOnlySchema,
    /** The agreed rental amount for the renewed period — the line's new total. */
    total: v.optional(MoneySchema),
  }),
  v.forward(
    v.check((input) => input.to > input.from, PERIOD_ORDER_MESSAGE),
    ['to'],
  ),
);

export type RentalStatus = v.InferOutput<typeof RentalStatusSchema>;
export type RentalQuery = v.InferOutput<typeof RentalQuerySchema>;
export type RenewRentalInput = v.InferOutput<typeof RenewRentalSchema>;
