/**
 * How an order changes hands.
 *
 * TWO METHODS, and home delivery covers every kind of address — a house, a hotel,
 * a holiday let, an airport hotel, a clinic. There was a third, `hotelDelivery`,
 * with its own flat €25 and its own two fields (venue name, guest at reception).
 * It was removed: a hotel is an address, not a fulfilment method, and asking the
 * customer to classify their own building only invited them to get it wrong.
 *
 * HOME DELIVERY IS PRICED AT PLACEMENT by `resolveDeliveryFee` below: the highest
 * of each line's fee (the product's own, else the platform fallback), quantity
 * never counted, collection always free. When no line resolves to a fee the
 * delivery is UNPRICED (`null`) and the order carries `NO_DELIVERY_FEE` until an
 * operator agrees a figure. A future scheme (per-km, zones) replaces that one
 * function. Worked examples: docs/code/delivery-fee.md.
 */

import { ZERO, fromHundredths, toHundredths } from './money.ts';

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

/**
 * The delivery fee of an order, or `null` when home delivery is unpriced.
 *
 * `productFees` holds one entry per line, the product's OWN fee (`null` = none).
 * A line without one takes `fallback`; the highest line wins. No lines at all
 * resolves to the fallback. Compared in hundredths, never as floats.
 */
export function resolveDeliveryFee(
  method: DeliveryMethodId,
  productFees: readonly (string | null)[],
  fallback: string | null,
): string | null {
  if (method === 'storePickup') return ZERO;
  const lineFees = productFees.map((fee) => fee ?? fallback);
  if (lineFees.length === 0) return fallback;
  let highest: bigint | null = null;
  for (const fee of lineFees) {
    if (fee === null) continue;
    const hundredths = toHundredths(fee);
    if (highest === null || hundredths > highest) highest = hundredths;
  }
  if (highest === null) return null;
  return fromHundredths(highest);
}
