/**
 * The rental contract's side of placement: a rental is signed before it is
 * placed, and the checkout shows what it is signing first. The signed contract
 * itself is written by `contracts/checkout.ts`, inside the order's transaction.
 */

import type { Database } from '@mia/db';
import { NO_DELIVERY_FEE } from '@mia/pricing';
import type { CheckoutDraftInput, ContractSignatureInput, PlaceOrderInput } from '@mia/validators';

import { httpError } from '../../shared/http/errors.ts';
import { renderDraft } from '../contracts/checkout.ts';
import { type ContractTerms, contractTotals, rentalItems } from '../contracts/draft.ts';
import { productsRequireDeposit } from '../contracts/repo.ts';
import { deliverySnapshot, isRentedLine, resolveLines } from './placement-input.ts';
import type { ResolvedLine } from './resolve.ts';

/**
 * A rental is signed before it is placed, and a sale has nothing to sign. Only
 * the catalogue knows which lines are rented, so this runs after resolution —
 * a body disagreeing with it is a 422 like every other such disagreement.
 */
export function assertSignatureMatches(
  rented: boolean,
  signature: ContractSignatureInput | undefined,
): void {
  if (rented && !signature) {
    const message = 'A rental is placed with its contract signed.';
    throw httpError(422, message, 'unprocessable_entity', {
      fields: { contractSignature: message },
    });
  }
  if (!rented && signature) {
    const message = 'Nothing in this order is rented, so there is no contract to sign.';
    throw httpError(422, message, 'unprocessable_entity', {
      fields: { contractSignature: message },
    });
  }
}

/**
 * The contract terms for a checkout that has not been placed yet: the customer
 * block as typed, the rented lines as resolved, and — through the catalogue —
 * whether any of them is from a deposit category. `orderNumber` is filled in by
 * the caller once one exists.
 */
export async function contractTermsFor(
  db: Database,
  input: {
    customer: PlaceOrderInput['customer'];
    lines: ResolvedLine[];
    currency: string;
    shipTo: NonNullable<PlaceOrderInput['delivery']['address']> | null;
  },
): Promise<ContractTerms> {
  const rentedLines = input.lines.filter(isRentedLine);
  const items = rentalItems(rentedLines);
  const { customer } = input;
  return {
    orderNumber: null,
    customerType: customer.customerType,
    customerName: `${customer.firstName} ${customer.lastName}`.trim(),
    email: customer.email,
    phone: customer.phone,
    /* The delivery text as typed. The stored snapshot keeps it in `line1` with
       null city and CAP, which `addressLine` composes back to this same string. */
    address: input.shipTo?.line1 ?? '',
    codiceFiscale: customer.codiceFiscale ?? null,
    partitaIva: customer.partitaIva ?? null,
    items,
    ...contractTotals(items, NO_DELIVERY_FEE),
    shippingTotal: NO_DELIVERY_FEE,
    currency: input.currency,
    hasDepositProduct: await productsRequireDeposit(
      db,
      rentedLines.map((line) => line.productId),
    ),
  };
}

/**
 * The contract this checkout would sign, rendered — the contract step's "View"
 * button. Resolved exactly as `place` resolves it, so a request `place` would
 * refuse is refused here too, and nothing is written.
 */
export async function previewContract(
  db: Database,
  input: CheckoutDraftInput,
): Promise<{ html: string }> {
  const { lines, currency } = await resolveLines(db, input.items);
  if (!lines.some(isRentedLine)) {
    throw httpError(
      422,
      'Nothing in this order is rented, so there is no contract to sign.',
      'unprocessable_entity',
    );
  }
  const { shipTo } = deliverySnapshot(input.delivery);
  const terms = await contractTermsFor(db, { customer: input.customer, lines, currency, shipTo });
  return { html: renderDraft(terms) };
}
