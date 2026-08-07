import * as v from 'valibot';

import { UuidSchema } from './common.ts';

const QuantitySchema = v.pipe(
  v.number(),
  v.integer('Quantity must be a whole number.'),
  v.minValue(1),
  v.maxValue(999),
);

export const AddToCartSchema = v.object({
  skuId: UuidSchema,
  quantity: v.optional(QuantitySchema, 1),
});

export const UpdateCartItemSchema = v.object({
  /** 0 removes the line. */
  quantity: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(999)),
});

export type AddToCartInput = v.InferOutput<typeof AddToCartSchema>;
export type UpdateCartItemInput = v.InferOutput<typeof UpdateCartItemSchema>;
