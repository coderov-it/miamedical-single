/**
 * Placing an order from the storefront. Docs: docs/code/orders-placement.md,
 * and docs/code/contracts.md § Signed at checkout for the rental contract.
 */

import type { Database } from '@mia/db';
import { NO_DELIVERY_FEE, addMoney } from '@mia/pricing';
import type { PlaceOrderInput } from '@mia/validators';

import type { SessionCustomer } from '../../shared/http/context.ts';
import { httpError } from '../../shared/http/errors.ts';
import { issueSigned, sendSignedReceipt } from '../contracts/checkout.ts';
/* Identity is customer-auth's decision, not this module's. The dependency runs one
   way — customer-auth knows nothing about orders — which is why the helper lives
   in its own file there rather than in that module's service. */
import { resolveForOrder } from '../customer-auth/order-account.ts';
import { assertSignatureMatches, contractTermsFor } from './placement-contract.ts';
import {
  addressSnapshot,
  deliverySnapshot,
  isRentedLine,
  resolveLines,
} from './placement-input.ts';
import { sendPlacementMail } from './placement-mail.ts';
import * as repo from './repo.ts';
import { sumLines } from './resolve.ts';
import type { AccountInvite, PlacedOrder } from './types.ts';

export { previewContract } from './placement-contract.ts';

/**
 * Turns a finished checkout into an order.
 *
 * Everything monetary is rebuilt here from the catalogue — see `resolve.ts` —
 * so the request decides only what was ordered. The order opens `pending` /
 * `unpaid` because nothing is charged online: the phone call settles payment, and
 * the admin's state machine takes it from there.
 *
 * A rental arrives with its contract already signed (`contractSignature`), and
 * the contract is written in the order's own transaction — see
 * `contracts/checkout.ts`.
 */
export interface PlacementContext {
  /** Present when the order was placed from inside a signed-in storefront session. */
  session: SessionCustomer | null;
  ipAddress: string | null;
  /** Stored with a checkout signature, as the emailed signing link stores it. */
  userAgent: string | null;
}

export async function place(
  db: Database,
  input: PlaceOrderInput,
  context: PlacementContext,
): Promise<PlacedOrder> {
  const { lines, currency } = await resolveLines(db, input.items);
  const rented = lines.some(isRentedLine);
  assertSignatureMatches(rented, input.contractSignature);

  const subtotal = sumLines(lines);

  /* A return address only means something if something is coming back. The
     storefront only asks when a line is rented, so a body carrying one for an
     outright sale disagrees with the catalogue — which is a 422 here, the same as
     any other request that does. */
  if (input.delivery.returnToSameAddress === false) {
    if (!rented) {
      throw httpError(
        422,
        'Nothing in this order is rented, so there is nothing to collect later.',
        'unprocessable_entity',
        { fields: { 'delivery.returnAddress': 'This order has no return.' } },
      );
    }
  }

  const { block, shipTo } = deliverySnapshot(input.delivery);

  /*
    NO DELIVERY FEE IS SET HERE, for either method, and none is read off the
    request body either — a crafted body must not be able to name its own shipping
    total any more than it could when a zone ladder priced this.

    Delivery is not quoted online at all now: the storefront tells the customer we
    will contact them about it, an operator agrees an amount on the phone, and it
    reaches the order through `update` above. So the order is placed recording the
    part that is actually settled — the goods — and the delivery amount joins the
    total the moment somebody agrees one. `docs/code/orders-placement.md`.
  */
  const shippingTotal = NO_DELIVERY_FEE;
  const total = addMoney(subtotal, shippingTotal);

  /*
    Both snapshots come from the delivery, and both are NULL on a collection.

    The checkout asks for an address only when something is being delivered, so a
    collected order genuinely has none — inventing one from the customer record
    would be storing a fact nobody stated. An invoice for a company still needs a
    registered address; that is a field the checkout does not yet ask for, and
    guessing it from the delivery address would be worse than its absence.
    Recorded in the known gaps of docs/code/orders-placement.md.
  */
  const snapshot = addressSnapshot(input.customer, shipTo);

  /*
    Who this order belongs to. Decided before the insert so the order is never
    written unattached and then patched — a half-linked order is a state no reader
    should have to allow for. The branches, and why an unverified link is the
    honest default, are in modules/customer-auth/order-account.ts.
  */
  const account = await resolveForOrder(
    db,
    {
      email: input.customer.email,
      firstName: input.customer.firstName,
      lastName: input.customer.lastName,
      phone: input.customer.phone,
    },
    context.session,
    context.ipAddress,
  );

  /*
    What the customer signed on the contract step, rebuilt from this same request
    — the preview they read was built by the same function from the same body.
  */
  const terms = rented
    ? await contractTermsFor(db, { customer: input.customer, lines, currency, shipTo })
    : null;
  const signature = input.contractSignature;
  /* Written by the hook below, inside the transaction; read after it commits. */
  const signed: { contract?: { id: string; number: string } } = {};

  const created = await repo.insertOrder(
    db,
    {
      customerAccountId: account.customerAccountId,
      customerLinkStatus: account.customerLinkStatus,
      /*
      The name as its own columns, not only inside the address snapshot. A store
      pickup has no address, so snapshotting the name into a null address lost it
      outright — see the two `storePickup` rows that predate this.
    */
      firstName: input.customer.firstName,
      lastName: input.customer.lastName,
      email: input.customer.email,
      phone: input.customer.phone,
      customerType: input.customer.customerType,
      codiceFiscale: input.customer.codiceFiscale ?? null,
      partitaIva: input.customer.partitaIva ?? null,
      currency,
      subtotal,
      shippingTotal,
      total,
      shippingAddress: snapshot,
      billingAddress: snapshot,
      delivery: block,
      notes: input.notes ?? null,
      items: lines.map((line) => ({
        productId: line.productId,
        productTitle: line.productTitle,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        total: line.total,
        configuration: line.configuration as unknown as Record<string, unknown>,
      })),
    },
    /* The order and its signed contract commit together or not at all: a rental
       order never exists unsigned, and a signature never outlives its order. */
    async (tx, order) => {
      if (!terms || !signature) return;
      signed.contract = await issueSigned(tx, order, terms, {
        imageDataUrl: signature.signatureDataUrl,
        ipAddress: context.ipAddress ?? 'unknown',
        userAgent: context.userAgent ?? 'unknown',
      });
    },
  );

  /*
    Mail goes out only after the transaction has committed, and a failure to send
    is logged rather than thrown. The order is a recorded fact the moment it
    commits; letting an SES outage propagate from here would turn a delivery
    problem into a lost order, and the customer already has their number on screen.

    `notifications` swallows transport errors itself — the try/catch is for the two
    database writes above it (the report token, and reading the account back).
  */
  try {
    await sendPlacementMail(db, {
      account,
      orderId: created.id,
      order: { number: created.number, total, currency },
      ipAddress: context.ipAddress,
    });
  } catch (error) {
    console.error(`[orders] order ${created.number} placed but its email failed:`, error);
  }

  /* The signed copy's receipt, after commit. */
  if (terms && signed.contract) {
    await sendSignedReceipt(db, created, signed.contract, {
      ...terms,
      orderNumber: created.number,
    });
  }

  /*
    One line on the confirmation panel, and only when it is true.

    `mailPlan === 'confirmation'` is exactly the set of orders whose account is
    already claimed — a signed-in session, or an address activated some time ago —
    so everything else is an account with an activation link in the inbox and
    nobody who has used it yet. Reading it off the plan rather than re-querying
    keeps one decision in one place: whichever mail went out is what the panel
    tells them to go and look for.
  */
  const accountInvite: AccountInvite = account.mailPlan === 'confirmation' ? null : 'activate';

  return { ...created, subtotal, shippingTotal, total, currency, items: lines, accountInvite };
}
