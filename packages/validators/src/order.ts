import { DELIVERY_METHOD_IDS, MAX_ADDON_QUANTITY } from '@mia/pricing';
import * as v from 'valibot';

import { EmailSchema, PaginationSchema, SlugSchema, UuidSchema } from './common.ts';

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

export const PaymentStatusSchema = v.picklist([
  'unpaid',
  'authorized',
  'paid',
  'partially_refunded',
  'refunded',
  'failed',
]);

export const UpdateOrderSchema = v.object({
  status: v.optional(OrderStatusSchema),
  paymentStatus: v.optional(PaymentStatusSchema),
  notes: v.optional(v.nullable(v.string())),
});

export const OrderQuerySchema = v.object({
  ...PaginationSchema.entries,
  status: v.optional(OrderStatusSchema),
  q: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(120))),
});

/* ------------------------------------------- placing an order from the shop --- */

/**
 * The checkout wire format.
 *
 * It carries the customer's CHOICES, never their prices: a slug, option values,
 * add-on ids, dates and a quantity. Everything monetary is resolved server-side
 * from the catalogue, so a crafted request can change what is ordered but never
 * what it costs. Worked examples: docs/code/orders-placement.md.
 *
 * Shared with the storefront rather than restated there, so the form that writes
 * this and the endpoint that reads it cannot drift on a field name.
 */

/**
 * A ceiling on one order, matching the storefront's own. Not a business limit:
 * each line costs one catalogue read, so an unbounded list would let one request
 * fan out into arbitrarily many queries.
 */
export const MAX_ORDER_ITEMS = 20;

/** The storefront stepper's ceiling. A larger rental is a phone call, not a form. */
export const MAX_ITEM_QUANTITY = 10;

export const CustomerTypeSchema = v.picklist(['private', 'company', 'tourist']);
export const DeliveryMethodSchema = v.picklist(DELIVERY_METHOD_IDS);

/** ISO `YYYY-MM-DD`. A rental start is a whole day, never a timestamp. */
const DateOnlySchema = v.pipe(
  v.string(),
  v.trim(),
  v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.'),
);

/**
 * `HH:MM` local to the shop. Asked for only when the chosen package is quoted in
 * hours — a day package starts on a date and nothing finer.
 */
const TimeOnlySchema = v.pipe(
  v.string(),
  v.trim(),
  v.regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM.'),
);

/**
 * `{ groupKey: [optionValue, …] }`. An array even for a single-select group, so
 * a multi-select needs no second shape. Keys are the catalogue's own group and
 * question keys; unknown ones are rejected by the server, not ignored.
 */
const SelectionMapSchema = v.record(
  v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(64)),
  v.pipe(v.array(v.pipe(v.string(), v.trim(), v.maxLength(300))), v.maxLength(20)),
);

export const PlaceOrderItemSchema = v.strictObject({
  productSlug: SlugSchema,
  quantity: v.pipe(
    v.number(),
    v.integer('Quantity must be a whole number.'),
    v.minValue(1),
    v.maxValue(MAX_ITEM_QUANTITY),
  ),
  /**
   * Required together on a rental product; the server enforces that, since only
   * it knows the mode. There is no end date on the wire — the package's duration
   * decides it, and a customer-supplied one would be a second opinion about a
   * figure the catalogue already settles.
   */
  startDate: v.optional(DateOnlySchema),
  /** Required when the chosen package is quoted in hours, ignored otherwise. */
  startTime: v.optional(TimeOnlySchema),
  rentalPackageCode: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(64))),
  /**
   * `{ id, quantity }` rather than a list of ids: an add-on the back office
   * marked multiple-selectable can be taken more than once. The quantity is
   * clamped to that add-on's own bounds by the server.
   */
  addons: v.optional(
    v.pipe(
      v.array(
        v.strictObject({
          id: UuidSchema,
          quantity: v.optional(
            v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(MAX_ADDON_QUANTITY)),
            1,
          ),
        }),
      ),
      v.maxLength(20),
    ),
    [],
  ),
  variants: v.optional(SelectionMapSchema, {}),
  answers: v.optional(SelectionMapSchema, {}),
});

/**
 * The address as the checkout asks for it: ONE free-text block, as the customer
 * wrote it.
 *
 * This used to be four fields — a street line plus a comune and a CAP chosen down
 * a regione → provincia → comune → CAP ladder, and an ISTAT code identifying the
 * comune exactly. All of it existed to key a delivery fee on the comune. Nothing
 * prices delivery any more, so structuring the address bought nothing and cost the
 * customer four controls. `0003_drop_delivery_pricing_and_geography` removed the
 * ladder and the reference data behind it.
 *
 * It belongs to the DELIVERY, not to the customer. An order collected from a branch
 * has no address at all.
 *
 * Newlines are allowed and preserved: a real delivery address carries a floor, an
 * interno, a buzzer name, and the customer knows better than we do how to write
 * where they live. The server stores it verbatim in the address snapshot's `line1`
 * and a human reads it.
 */
export const CheckoutAddressSchema = v.strictObject({
  line1: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(6, 'Write the full delivery address.'),
    v.maxLength(500),
  ),
});

const FiscalCodeSchema = v.pipe(v.string(), v.trim(), v.toUpperCase(), v.maxLength(32));

/**
 * `private` needs a codice fiscale, `company` needs a partita IVA and its own
 * codice fiscale, `tourist` needs neither — the same rule the checkout's own
 * step-1 validity applies, and the same one `orders_fiscal_check` holds in the
 * database. Raised on the field the customer was filling in.
 */
const FISCAL_MESSAGE = 'This customer type needs its fiscal identifier.';

export const CheckoutCustomerSchema = v.pipe(
  v.strictObject({
    firstName: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(80)),
    lastName: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(80)),
    email: EmailSchema,
    phone: v.pipe(v.string(), v.trim(), v.minLength(5), v.maxLength(32)),
    customerType: CustomerTypeSchema,
    codiceFiscale: v.optional(FiscalCodeSchema),
    partitaIva: v.optional(FiscalCodeSchema),
  }),
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

/**
 * Each method carries only the detail it needs, and the address is one of those
 * details rather than a fact about the customer:
 *
 *   homeDelivery   address    — where it goes, as one free-text block
 *   storePickup    pickupCity — which branch, and nothing else
 *
 * The address is REQUIRED on a home delivery and REFUSED on a collection, because
 * a delivery with nowhere to go and a collection with a delivery address are both
 * orders nobody can fulfil. That is the whole reason it moved out of the contact
 * step: there, every customer typed one whether or not anything was being
 * delivered.
 *
 * There is no field for an amount here, and no hotel: a hotel is an address, and
 * home delivery covers every kind. See `@mia/pricing`.
 *
 * The return pair below is method-independent on purpose. Both methods come back —
 * a home delivery is collected, a branch collection is brought back — so "somewhere
 * else, this time" is a question either one can be asked.
 */
export const CheckoutDeliverySchema = v.pipe(
  v.strictObject({
    method: DeliveryMethodSchema,
    address: v.optional(CheckoutAddressSchema),
    pickupCity: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(120))),

    /**
     * A rental comes back, and where FROM is a different question from where it
     * goes. Usually the same place, which is why this is a checkbox with a default
     * rather than a second address form.
     *
     * `true` unless stated: an order placed before this field existed, or by a
     * client that does not send it, means "the same place" — which is what every
     * such order already assumed.
     */
    returnToSameAddress: v.optional(v.boolean(), true),
    /** Free text, like the delivery address above it. A driver reads it and goes. */
    returnAddress: v.optional(v.pipe(v.string(), v.trim(), v.minLength(4), v.maxLength(300))),
  }),
  v.forward(
    v.partialCheck(
      [['returnToSameAddress'], ['returnAddress']],
      (input) => input.returnToSameAddress !== false || Boolean(input.returnAddress),
      'Tell us where to collect it from, or leave “same address” ticked.',
    ),
    ['returnAddress'],
  ),
  v.forward(
    v.partialCheck(
      [['returnToSameAddress'], ['returnAddress']],
      (input) => input.returnToSameAddress === false || !input.returnAddress,
      'This order is collected from the delivery address, so there is no second one.',
    ),
    ['returnAddress'],
  ),
  v.forward(
    v.partialCheck(
      [['method'], ['address']],
      (input) => input.method !== 'homeDelivery' || Boolean(input.address),
      'A home delivery needs the address it is going to.',
    ),
    ['address'],
  ),
  v.forward(
    v.partialCheck(
      [['method'], ['address']],
      (input) => input.method !== 'storePickup' || !input.address,
      'A collection has no delivery address.',
    ),
    ['address'],
  ),
  v.forward(
    v.partialCheck(
      [['method'], ['pickupCity']],
      (input) => input.method !== 'storePickup' || Boolean(input.pickupCity),
      'Choose which branch this order is collected from.',
    ),
    ['pickupCity'],
  ),
);

export const PlaceOrderSchema = v.strictObject({
  items: v.pipe(
    v.array(PlaceOrderItemSchema),
    v.minLength(1, 'An order needs at least one item.'),
    v.maxLength(MAX_ORDER_ITEMS),
  ),
  customer: CheckoutCustomerSchema,
  delivery: CheckoutDeliverySchema,
  notes: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(1000))),
});

export type OrderStatus = v.InferOutput<typeof OrderStatusSchema>;
export type PaymentStatus = v.InferOutput<typeof PaymentStatusSchema>;

export type Address = v.InferOutput<typeof AddressSchema>;
export type CheckoutInput = v.InferOutput<typeof CheckoutSchema>;
export type UpdateOrderInput = v.InferOutput<typeof UpdateOrderSchema>;

export type CustomerType = v.InferOutput<typeof CustomerTypeSchema>;
export type DeliveryMethod = v.InferOutput<typeof DeliveryMethodSchema>;
export type CheckoutAddress = v.InferOutput<typeof CheckoutAddressSchema>;
export type CheckoutCustomer = v.InferOutput<typeof CheckoutCustomerSchema>;
export type CheckoutDelivery = v.InferOutput<typeof CheckoutDeliverySchema>;
export type PlaceOrderItemInput = v.InferOutput<typeof PlaceOrderItemSchema>;
export type PlaceOrderInput = v.InferOutput<typeof PlaceOrderSchema>;
