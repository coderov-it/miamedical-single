import * as v from 'valibot';

import { LanguageCodeSchema } from './i18n.ts';
import { CheckoutCustomerFieldsSchema, ContractSignatureSchema, FISCAL_MESSAGE } from './order.ts';

/**
 * What the customer's browser sends to the private order link (`/api/order-links`).
 * Docs: docs/code/manual-orders.md. The token is the whole authorisation, so it is the
 * only thing a query carries; bodies hold choices, never an amount.
 */

export const OrderLinkQuerySchema = v.object({
  token: v.pipe(v.string(), v.trim(), v.minLength(20), v.maxLength(200)),
});

/**
 * The customer block without the email (the order has it) and with the same
 * fiscal rules as `CheckoutCustomerSchema`, so a link and a checkout agree.
 */
export const OrderLinkDetailsSchema = v.pipe(
  v.omit(CheckoutCustomerFieldsSchema, ['email']),
  v.forward(
    v.partialCheck(
      [['customerType'], ['codiceFiscale']],
      (input) => input.customerType === 'tourist' || Boolean(input.codiceFiscale),
      FISCAL_MESSAGE,
    ),
    ['codiceFiscale'],
  ),
  v.forward(
    v.partialCheck(
      [['customerType'], ['partitaIva']],
      (input) => input.customerType !== 'company' || Boolean(input.partitaIva),
      FISCAL_MESSAGE,
    ),
    ['partitaIva'],
  ),
);

export const OrderLinkSignSchema = v.strictObject({
  /** Same signature and consent as the checkout's contract step. */
  ...ContractSignatureSchema.entries,
  /** The order total the contract preview showed; a changed order is refused, not signed blind. */
  expectedTotal: v.pipe(v.string(), v.trim(), v.maxLength(20)),
});

export const OrderLinkPaymentSchema = v.strictObject({
  language: v.optional(LanguageCodeSchema),
});

export type OrderLinkDetailsInput = v.InferOutput<typeof OrderLinkDetailsSchema>;
export type OrderLinkSignInput = v.InferOutput<typeof OrderLinkSignSchema>;
