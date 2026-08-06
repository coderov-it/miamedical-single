import * as v from 'valibot';

import { EmailSchema, PaginationSchema } from './common.ts';

export const AddressSchema = v.object({
  fullName: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(120)),
  line1: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(200)),
  line2: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(200)))),
  city: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120)),
  region: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(120)))),
  postalCode: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(20)),
  country: v.pipe(v.string(), v.trim(), v.toUpperCase(), v.length(2, 'Use a 2-letter ISO code.')),
  phone: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(32)))),
});

export const CheckoutSchema = v.object({
  email: EmailSchema,
  shippingAddress: AddressSchema,
  billingAddress: v.optional(AddressSchema),
  notes: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(1000)))),
});

export const OrderStatusSchema = v.picklist([
  'pending',
  'paid',
  'fulfilled',
  'cancelled',
  'refunded',
]);

export const UpdateOrderSchema = v.object({
  status: v.optional(OrderStatusSchema),
  paymentStatus: v.optional(
    v.picklist(['unpaid', 'authorized', 'paid', 'partially_refunded', 'refunded', 'failed']),
  ),
  notes: v.optional(v.nullable(v.string())),
});

export const OrderQuerySchema = v.object({
  ...PaginationSchema.entries,
  status: v.optional(OrderStatusSchema),
  q: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(120))),
});

export type Address = v.InferOutput<typeof AddressSchema>;
export type CheckoutInput = v.InferOutput<typeof CheckoutSchema>;
export type UpdateOrderInput = v.InferOutput<typeof UpdateOrderSchema>;
