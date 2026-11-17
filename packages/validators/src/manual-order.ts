import * as v from 'valibot';

import { CustomerPhoneSchema, EmailSchema, MoneySchema, UuidSchema } from './common.ts';
import { LanguageCodeSchema } from './i18n.ts';
import {
  CheckoutDeliverySchema,
  CustomerTypeSchema,
  MAX_ORDER_ITEMS,
  PlaceOrderItemSchema,
} from './order.ts';

/**
 * What an agent sends to raise an order for a customer who phoned or wrote.
 * Docs: docs/code/manual-orders.md. Like the checkout body it carries choices
 * only — there is no price field anywhere; every amount is quoted by the server.
 */

const ItemsSchema = v.pipe(
  v.array(PlaceOrderItemSchema),
  v.minLength(1, 'An order needs at least one item.'),
  v.maxLength(MAX_ORDER_ITEMS),
);

const NameSchema = v.pipe(v.string(), v.trim(), v.maxLength(80));
const FiscalSchema = v.pipe(v.string(), v.trim(), v.toUpperCase(), v.maxLength(32));

export const ManualDiscountSchema = v.strictObject({
  /** `0.00` removes the discount. */
  amount: MoneySchema,
  reason: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(300)))),
});

/** The lines and the agreed delivery fee: enough to price the order. */
export const ManualOrderQuoteSchema = v.strictObject({
  items: ItemsSchema,
  shippingTotal: v.optional(MoneySchema),
  /** Only the amount: the reason is checked when the order is created. */
  discountAmount: v.optional(MoneySchema),
});

export const ManualOrderSchema = v.strictObject({
  email: EmailSchema,
  /** An existing account the agent picked from the search. */
  customerAccountId: v.optional(UuidSchema),
  firstName: v.optional(NameSchema),
  lastName: v.optional(NameSchema),
  phone: v.optional(CustomerPhoneSchema),
  customerType: v.optional(CustomerTypeSchema),
  codiceFiscale: v.optional(FiscalSchema),
  partitaIva: v.optional(FiscalSchema),
  language: v.optional(LanguageCodeSchema),
  items: ItemsSchema,
  delivery: CheckoutDeliverySchema,
  shippingTotal: v.optional(MoneySchema),
  discount: v.optional(v.nullable(ManualDiscountSchema)),
  notes: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(1000))),
});

export const ORDER_LINK_STEPS = ['sign_pay', 'sign', 'pay'] as const;
export const OrderLinkStepsSchema = v.picklist(ORDER_LINK_STEPS);

export const SendOrderLinkSchema = v.strictObject({
  steps: OrderLinkStepsSchema,
  includeDetails: v.boolean(),
  /** `email` sends it to the customer; `copy` returns the URL for the agent. */
  deliver: v.picklist(['email', 'copy']),
});

export const MANUAL_PAYMENT_METHODS = ['bank_transfer', 'cash', 'card_pos'] as const;

export const RecordPaymentSchema = v.strictObject({
  method: v.picklist(MANUAL_PAYMENT_METHODS),
  reference: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(200)))),
});

export const CustomerAccountSearchSchema = v.object({
  q: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(120)),
});

/** Free-text catalogue search for the lines picker. */
export const LineProductSearchSchema = v.object({
  q: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(120)),
});

export type ManualOrderInput = v.InferOutput<typeof ManualOrderSchema>;
export type ManualOrderQuoteInput = v.InferOutput<typeof ManualOrderQuoteSchema>;
export type ManualDiscountInput = v.InferOutput<typeof ManualDiscountSchema>;
export type OrderLinkSteps = v.InferOutput<typeof OrderLinkStepsSchema>;
export type SendOrderLinkInput = v.InferOutput<typeof SendOrderLinkSchema>;
export type RecordPaymentInput = v.InferOutput<typeof RecordPaymentSchema>;
