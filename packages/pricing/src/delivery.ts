/**
 * How an order changes hands.
 *
 * TWO METHODS, and home delivery covers every kind of address — a house, a hotel,
 * a holiday let, an airport hotel, a clinic. There was a third, `hotelDelivery`,
 * with its own flat €25 and its own two fields (venue name, guest at reception).
 * It was removed: a hotel is an address, not a fulfilment method, and asking the
 * customer to classify their own building only invited them to get it wrong.
 *
 * NO FEE TABLE ANY MORE. Home delivery is priced from the customer's CAP through
 * the zone ladder (`POST /api/delivery/quote`, and `resolveQuote` inside the
 * server), so there is no number here that a storefront and a server could
 * disagree about. Collection from a branch is the one fixed figure, and it is
 * fixed because it is zero.
 *
 * Reasoning and worked examples: docs/code/delivery-pricing.md.
 */

export const DELIVERY_METHODS = [{ id: 'homeDelivery' }, { id: 'storePickup' }] as const;

export type DeliveryMethodId = (typeof DELIVERY_METHODS)[number]['id'];

export const DELIVERY_METHOD_IDS = DELIVERY_METHODS.map((method) => method.id) as [
  DeliveryMethodId,
  ...DeliveryMethodId[],
];

/** Nothing is charged to collect an order in person. */
export const STORE_PICKUP_FEE = '0.00';

/**
 * Whether this method needs an address priced at all.
 *
 * The one place that question is answered, so the storefront's card and the
 * server's total cannot take different views of it.
 */
export function methodNeedsQuote(id: DeliveryMethodId): boolean {
  return id === 'homeDelivery';
}
