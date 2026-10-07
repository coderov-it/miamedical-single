/**
 * The placement request read into what gets stored: its lines resolved and
 * priced from the catalogue, and its delivery as the two snapshots the order
 * keeps. Shared by `placement.ts` and the contract preview in
 * `placement-contract.ts`, which must read a request exactly the same way.
 */

import type { Database } from '@mia/db';
import type { PlaceOrderInput } from '@mia/validators';

import { httpError } from '../../shared/http/errors.ts';
import { availableProduct, loadLineProducts } from './checkout-products.ts';
import { type ResolvedLine, resolveLine } from './resolve.ts';

export const isRentedLine = (line: ResolvedLine) => line.configuration.pricingMode === 'rental';

/**
 * Every line's product in two queries, then the lines checked IN ORDER, so the
 * first rejection still names the first bad line — whether it is a product that
 * is gone or a choice the catalogue no longer offers.
 */
export async function resolveLines(
  db: Database,
  items: PlaceOrderInput['items'],
): Promise<{ lines: ResolvedLine[]; currency: string }> {
  const products = await loadLineProducts(db, items);
  const lines: ResolvedLine[] = [];
  for (const [index, item] of items.entries()) {
    const field = `items.${index}`;
    lines.push(resolveLine(availableProduct(products[index], field), item, field));
  }

  /* Single-currency shop. Reading it off the lines rather than hardcoding means a
     mixed-currency order fails here instead of silently summing two currencies. */
  const currencies = new Set(lines.map((line) => line.currency));
  if (currencies.size > 1) {
    throw httpError(
      422,
      'These products are priced in different currencies.',
      'unprocessable_entity',
    );
  }
  return { lines, currency: lines[0]?.currency ?? 'EUR' };
}

/**
 * Composes the `AddressSchema`-shaped snapshot the order stores.
 *
 * The checkout asks for one street line, a city and a CAP; the name, the phone and
 * the country come from elsewhere in the same request. Written out in full so the
 * admin can read, edit and save an address without first having to invent the
 * fields the form never asked about.
 *
 * `null` for a collection, which has no address — see `deliverySnapshot`.
 */
export function addressSnapshot(
  customer: PlaceOrderInput['customer'],
  address: NonNullable<PlaceOrderInput['delivery']['address']> | null,
): Record<string, unknown> | null {
  if (!address) return null;
  /*
    The SHAPE of this snapshot is unchanged on purpose. `city` and `postalCode` are
    no longer asked for — the checkout takes the delivery address as one free-text
    block — but the keys stay and hold null, because contract generation and the
    admin both read this record and compose "line1, postalCode city" from it. They
    already coalesce a missing part to an empty string, so they degrade to the line
    alone without a single change on their side.
  */
  return {
    fullName: `${customer.firstName} ${customer.lastName}`.trim(),
    line1: address.line1,
    line2: null,
    city: null,
    region: null,
    postalCode: null,
    country: 'IT',
    phone: customer.phone,
  };
}

/**
 * Where the order is going, and the one detail the chosen method needs.
 *
 * Only the fields belonging to the CHOSEN method are kept. A customer who filled
 * the alternate-address panel and then switched to collection would otherwise
 * leave both in the record, and an operator reading it could not tell which one is
 * real.
 */
export function deliverySnapshot(delivery: PlaceOrderInput['delivery']): {
  block: Record<string, unknown>;
  /** Where the goods go, or `null` for a branch collection. */
  shipTo: NonNullable<PlaceOrderInput['delivery']['address']> | null;
} {
  /*
    Where it comes back from. Kept for both methods and recorded even when it is
    the default, because "the customer said the same address" and "the customer was
    never asked" are different facts and the driver's route depends on which.
  */
  const returnBlock = {
    returnToSameAddress: delivery.returnToSameAddress,
    returnAddress: delivery.returnAddress ?? null,
  };

  if (delivery.method === 'storePickup') {
    return {
      block: { method: delivery.method, pickupCity: delivery.pickupCity ?? null, ...returnBlock },
      shipTo: null,
    };
  }

  /* Home delivery, which covers every kind of address — a house, a hotel, a
     holiday let. The schema guarantees the address is here; the fallback keeps
     this function total rather than asserting. */
  const address = delivery.address ?? null;
  return {
    block: {
      method: delivery.method,
      /*
        The whole address, as the customer wrote it, newlines and all.

        This block used to carry `deliveryCity` and `deliveryPostalCode` beside it,
        and briefly a `deliveryIstatCode` naming the comune exactly. All three came
        from a picker that existed to key a delivery fee on the comune. Nothing
        prices delivery, so the structure bought nothing and cost the customer four
        controls; per-kilometre pricing will geocode this text.
      */
      deliveryAddress: address?.line1 ?? null,
      ...returnBlock,
    },
    shipTo: address,
  };
}
