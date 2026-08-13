/**
 * Runtime schemas for the orders module. Shared shapes are re-exported from
 * `@mia/validators` rather than restated, so the storefront checkout and the
 * back office cannot drift apart on what an address is.
 */

import { AddressSchema, OrderStatusSchema, PaginationSchema, UuidSchema } from '@mia/validators';
import * as v from 'valibot';

export { AddressSchema, OrderStatusSchema };

export const PaymentStatusSchema = v.picklist([
  'unpaid',
  'authorized',
  'paid',
  'partially_refunded',
  'refunded',
  'failed',
]);

export const OrderIdParamSchema = v.object({ id: UuidSchema });
export const CartIdParamSchema = v.object({ id: UuidSchema });

/** A calendar date, not a timestamp — the filter is inclusive of whole days. */
const DateOnlySchema = v.pipe(
  v.string(),
  v.trim(),
  v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.'),
);

export const AdminOrderQuerySchema = v.object({
  ...PaginationSchema.entries,
  q: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(120))),
  status: v.optional(OrderStatusSchema),
  paymentStatus: v.optional(PaymentStatusSchema),
  from: v.optional(DateOnlySchema),
  to: v.optional(DateOnlySchema),
});

export const AdminCartQuerySchema = v.object({
  ...PaginationSchema.entries,
  q: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(120))),
  state: v.optional(v.picklist(['active', 'abandoned'])),
});

/**
 * Editable-by-hand fields only. Status is deliberately absent: it moves
 * through `/status`, which runs the state machine and writes a timeline entry.
 * Letting it ride along on a PATCH would create a second, unaudited path.
 */
export const AdminUpdateOrderSchema = v.pipe(
  v.object({
    notes: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(2000)))),
    shippingAddress: v.optional(v.nullable(AddressSchema)),
    billingAddress: v.optional(v.nullable(AddressSchema)),
  }),
  v.check((input) => Object.keys(input).length > 0, 'Provide at least one field to update.'),
);

const NoteSchema = v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(500))));

export const OrderStatusTransitionSchema = v.object({
  to: OrderStatusSchema,
  note: NoteSchema,
});

export const PaymentStatusTransitionSchema = v.object({
  to: PaymentStatusSchema,
  note: NoteSchema,
});

export const CalendarQuerySchema = v.object({
  from: DateOnlySchema,
  to: DateOnlySchema,
});

/** Free-text lookup of past customers, for prefilling a manual contract. */
export const CustomerSearchQuerySchema = v.object({
  q: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(120)),
});

export type CalendarQuery = v.InferOutput<typeof CalendarQuerySchema>;
export type AdminOrderQuery = v.InferOutput<typeof AdminOrderQuerySchema>;
export type AdminCartQuery = v.InferOutput<typeof AdminCartQuerySchema>;
export type AdminUpdateOrderInput = v.InferOutput<typeof AdminUpdateOrderSchema>;
export type OrderStatusTransitionInput = v.InferOutput<typeof OrderStatusTransitionSchema>;
export type PaymentStatusTransitionInput = v.InferOutput<typeof PaymentStatusTransitionSchema>;
