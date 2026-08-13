/**
 * How an order changes hands.
 *
 * TWO METHODS, and home delivery covers every kind of address — a house, a hotel,
 * a holiday let, an airport hotel, a clinic. There was a third, `hotelDelivery`,
 * with its own flat €25 and its own two fields (venue name, guest at reception).
 * It was removed: a hotel is an address, not a fulfilment method, and asking the
 * customer to classify their own building only invited them to get it wrong.
 *
 * NOTHING HERE PRICES DELIVERY, and nothing anywhere else does either. A zone
 * ladder used to quote a fee from the customer's CAP; it was retired in favour of
 * a distance-based fee that does not exist yet. Until it does, the storefront
 * shows the customer a message instead of an amount, an operator agrees the figure
 * by phone, and it is written onto `orders.shipping_total` from the admin.
 *
 * So every order is placed at `NO_DELIVERY_FEE`, and that is a real statement
 * rather than a placeholder: the order total records the part that is settled, and
 * the delivery amount joins it once somebody has actually agreed one.
 */

export const DELIVERY_METHODS = [{ id: 'homeDelivery' }, { id: 'storePickup' }] as const;

export type DeliveryMethodId = (typeof DELIVERY_METHODS)[number]['id'];

export const DELIVERY_METHOD_IDS = DELIVERY_METHODS.map((method) => method.id) as [
  DeliveryMethodId,
  ...DeliveryMethodId[],
];

/**
 * What a delivery costs when the order is placed, both methods alike.
 *
 * Collection from a branch is free and always will be. Home delivery is not free
 * — it is UNPRICED, and this is the amount an order carries until an operator
 * replaces it.
 */
export const NO_DELIVERY_FEE = '0.00';
