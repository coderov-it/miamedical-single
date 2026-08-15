import * as v from 'valibot';

import { PaginationSchema, UuidSchema } from './common.ts';

export const ContractStatusSchema = v.picklist([
  'draft',
  'generated',
  'sent',
  'viewed',
  'signed',
  'voided',
]);

export const ContractVariantSchema = v.picklist([
  'carrozzina_italian',
  'carrozzina_tourist',
  'scooter_italian',
  'scooter_tourist',
]);

export const ContractQuerySchema = v.object({
  ...PaginationSchema.entries,
  status: v.optional(ContractStatusSchema),
  q: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(120))),
});

export const ContractIdParamSchema = v.object({ id: UuidSchema });

export const GenerateContractSchema = v.strictObject({
  orderId: UuidSchema,
});

const MoneySchema = v.pipe(
  v.string(),
  v.trim(),
  v.regex(/^\d+(\.\d{1,2})?$/, 'Use a decimal amount like 35.00.'),
);

const DateOnlySchema = v.pipe(
  v.string(),
  v.trim(),
  v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.'),
);

export const ManualContractItemSchema = v.strictObject({
  productTitle: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(200)),
  sku: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(80))),
  quantity: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(999)),
  unitPrice: MoneySchema,
  total: MoneySchema,
  startDate: DateOnlySchema,
  endDate: v.nullish(DateOnlySchema),
  /** The package's own duration, read in `durationUnit`. */
  duration: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(3650)),
  durationUnit: v.optional(v.picklist(['hour', 'day']), 'day'),
});

const FISCAL_MESSAGE = 'This customer type needs its fiscal identifier.';

/**
 * A contract typed in by an admin rather than derived from an order — walk-in
 * and phone rentals, or a fresh contract for a returning customer. Variant,
 * language and deposit resolve from `customerType` + `hasDepositProduct` on
 * the server, exactly as they do for order-generated contracts.
 *
 * Fiscal rules follow the checkout: a tourist carries no Italian fiscal
 * identifier, a private customer needs a codice fiscale, a company needs its
 * partita IVA — plus the codice univoco (SDI) the invoice will be routed to.
 */
export const ManualContractSchema = v.pipe(
  v.strictObject({
    customerType: v.picklist(['private', 'company', 'tourist']),
    fullName: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(200)),
    email: v.pipe(v.string(), v.trim(), v.email(), v.maxLength(254)),
    phone: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(40)),
    address: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(400)),
    codiceFiscale: v.nullish(v.pipe(v.string(), v.trim(), v.toUpperCase(), v.maxLength(16))),
    partitaIva: v.nullish(v.pipe(v.string(), v.trim(), v.maxLength(11))),
    codiceUnivoco: v.nullish(v.pipe(v.string(), v.trim(), v.toUpperCase(), v.maxLength(7))),
    hasDepositProduct: v.boolean(),
    items: v.pipe(v.array(ManualContractItemSchema), v.minLength(1), v.maxLength(50)),
    shippingTotal: v.optional(MoneySchema, '0.00'),
  }),
  v.forward(
    v.partialCheck(
      [['customerType'], ['codiceFiscale']],
      (input) => input.customerType !== 'private' || Boolean(input.codiceFiscale),
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
  v.forward(
    v.partialCheck(
      [['customerType'], ['codiceUnivoco']],
      (input) => input.customerType !== 'company' || Boolean(input.codiceUnivoco),
      FISCAL_MESSAGE,
    ),
    ['codiceUnivoco'],
  ),
);

export const VoidContractSchema = v.strictObject({
  reason: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(1000)),
});

export const SignContractSchema = v.strictObject({
  signatureDataUrl: v.pipe(
    v.string(),
    v.startsWith('data:image/', 'Signature must be a data URI image.'),
    v.maxLength(500_000),
  ),
});

export const SigningTokenQuerySchema = v.object({
  token: v.pipe(v.string(), v.trim(), v.minLength(1)),
});

export type ContractStatus = v.InferOutput<typeof ContractStatusSchema>;
export type ContractVariant = v.InferOutput<typeof ContractVariantSchema>;
export type ContractQuery = v.InferOutput<typeof ContractQuerySchema>;
export type GenerateContractInput = v.InferOutput<typeof GenerateContractSchema>;
export type ManualContractInput = v.InferOutput<typeof ManualContractSchema>;
export type VoidContractInput = v.InferOutput<typeof VoidContractSchema>;
export type SignContractInput = v.InferOutput<typeof SignContractSchema>;
