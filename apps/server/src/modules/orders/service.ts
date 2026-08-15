/**
 * Business orchestration for orders. Transport-agnostic.
 *
 * The rule this module exists to hold: a status only moves through here, the
 * move is checked against the state machine, and every accepted move writes a
 * timeline entry in the same transaction. There is no second path — which is
 * why `PATCH /orders/:id` cannot touch status at all.
 */

import type { Database } from '@mia/db';
import { NO_DELIVERY_FEE, addMoney } from '@mia/pricing';
import type { PlaceOrderInput } from '@mia/validators';

import type { SessionCustomer, SessionUser } from '../../shared/http/context.ts';
import { conflict, httpError, notFound } from '../../shared/http/errors.ts';
/* Identity is customer-auth's decision, not this module's. The dependency runs one
   way — customer-auth knows nothing about orders — which is why the helper lives
   in its own file there rather than in that module's service. */
import {
  type ResolvedOrderAccount,
  issueOrderMailTokens,
  resolveForOrder,
} from '../customer-auth/order-account.ts';
import * as notifications from '../notifications/service.ts';
import * as productRepo from '../products/catalog/repo.ts';
import { toPublicDetail } from '../products/mapper.ts';
import { multiply, sumMoney } from './mapper.ts';
import * as repo from './repo.ts';
import { type ResolvedLine, resolveLine, sumLines } from './resolve.ts';
import {
  canMoveOrder,
  canMovePayment,
  explainRejection,
  nextOrderStatuses,
  nextPaymentStatuses,
  type OrderStatus,
  type PaymentStatus,
} from './status.ts';
import type {
  CartAggregate,
  CartListFilters,
  CartSummaryRecord,
  OrderAggregate,
  OrderListFilters,
  OrderListStats,
  OrderSummaryRecord,
  PlacedOrder,
} from './types.ts';
import type { AdminUpdateOrderInput } from './validators.ts';

export async function list(
  db: Database,
  filters: OrderListFilters,
): Promise<{ rows: OrderSummaryRecord[]; total: number; stats: OrderListStats }> {
  const [result, awaitingCount] = await Promise.all([
    repo.findMany(db, filters),
    repo.countAwaiting(db),
  ]);

  return {
    rows: result.rows,
    total: result.total,
    stats: {
      total: result.total,
      awaitingCount,
      // Summed over the rows we are actually returning. The admin labels this
      // "this page" — a money figure must never imply more than it covers.
      pageValue: sumMoney(result.rows.map((row) => row.total)),
    },
  };
}

export async function calendarEntries(db: Database, from: string, to: string) {
  return repo.findCalendarEntries(db, from, to);
}

export async function searchCustomers(db: Database, q: string) {
  return repo.findCustomers(db, q);
}

/** Dashboard tiles. One round trip per figure, both indexed on `placed_at`. */
export async function windowStats(db: Database, windowDays: number) {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const [window, awaitingCount] = await Promise.all([
    repo.windowStats(db, since),
    repo.countAwaiting(db),
  ]);

  return {
    windowDays,
    revenue: window.revenue,
    currency: window.currency,
    orderCount: window.orderCount,
    awaitingCount,
    revenueBasis: 'Paid and fulfilled orders only',
  };
}

export async function getById(db: Database, id: string): Promise<OrderAggregate> {
  const order = await repo.findById(db, id);
  if (!order) throw notFound('Order');
  return order;
}

export async function update(
  db: Database,
  id: string,
  input: AdminUpdateOrderInput,
): Promise<OrderAggregate> {
  const order = await getById(db, id);

  const patch: repo.OrderPatch = {};
  if (input.notes !== undefined) patch.notes = input.notes;
  if (input.shippingAddress !== undefined) patch.shippingAddress = input.shippingAddress;
  if (input.billingAddress !== undefined) patch.billingAddress = input.billingAddress;

  /*
    The agreed delivery fee, arriving from a phone call rather than from any
    calculation — nothing prices delivery any more.

    The total is re-derived here rather than accepted from the client, for the
    same reason placement never read a fee off the request body: the amount owed
    is the shop's arithmetic, not the caller's. Recomputed from the order's own
    stored subtotal, so a stale figure in the admin cannot carry the items total
    backwards with it.
  */
  if (input.shippingTotal !== undefined) {
    patch.shippingTotal = input.shippingTotal;
    patch.total = addMoney(order.subtotal, input.shippingTotal);
  }

  await repo.update(db, id, patch);
  return getById(db, id);
}

/**
 * Both transitions follow the same shape, so they share one body: read the
 * order, check the move against the machine, then hand the accepted move to
 * the repo, which writes the column and its audit entry atomically.
 */
async function transition(
  db: Database,
  id: string,
  field: 'status' | 'paymentStatus',
  to: string,
  note: string | null,
  actor: SessionUser | null,
): Promise<OrderAggregate> {
  const order = await getById(db, id);
  const from = field === 'status' ? order.status : order.paymentStatus;

  if (from === to) {
    throw conflict(`This order is already ${to}.`);
  }

  const allowed =
    field === 'status'
      ? nextOrderStatuses(from as OrderStatus)
      : nextPaymentStatuses(from as PaymentStatus);

  const permitted =
    field === 'status'
      ? canMoveOrder(from as OrderStatus, to as OrderStatus)
      : canMovePayment(from as PaymentStatus, to as PaymentStatus);

  if (!permitted) {
    throw conflict(explainRejection(field === 'status' ? 'order' : 'payment', from, to, allowed));
  }

  await repo.applyTransition(db, {
    orderId: id,
    field,
    fromValue: from,
    toValue: to,
    note: note ?? null,
    actorAdminUserId: actor?.id ?? null,
  });

  return getById(db, id);
}

export function moveStatus(
  db: Database,
  id: string,
  to: OrderStatus,
  note: string | null,
  actor: SessionUser | null,
): Promise<OrderAggregate> {
  return transition(db, id, 'status', to, note, actor);
}

export function movePaymentStatus(
  db: Database,
  id: string,
  to: PaymentStatus,
  note: string | null,
  actor: SessionUser | null,
): Promise<OrderAggregate> {
  return transition(db, id, 'paymentStatus', to, note, actor);
}

// --- placing an order ------------------------------------------------------

/**
 * The catalogue product behind one checkout line, as the storefront saw it.
 *
 * The storefront is Italian-only, so the locale is a constant — but it is the
 * SAME projection the product page was rendered from, which is what lets
 * `resolveLine` freeze the very labels the customer read.
 *
 * A product that has since been unpublished is a 422 naming the line, not a 404:
 * the request is well-formed, one thing in it can no longer be honoured, and the
 * checkout has to be able to say which.
 */
async function loadProduct(db: Database, slug: string, field: string) {
  const hit = await productRepo.findIdBySlug(db, slug);
  const product = hit ? await productRepo.findAggregate(db, hit.productId) : undefined;

  if (!product || product.status !== 'active') {
    throw httpError(422, 'That product is no longer available.', 'unprocessable_entity', {
      fields: { [`${field}.productSlug`]: 'That product is no longer available.' },
    });
  }

  return toPublicDetail(product, 'it');
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
function addressSnapshot(
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
function deliverySnapshot(delivery: PlaceOrderInput['delivery']): {
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

/**
 * Turns a finished checkout into an order.
 *
 * Everything monetary is rebuilt here from the catalogue — see `resolve.ts` —
 * so the request decides only what was ordered. The order opens `pending` /
 * `unpaid` because nothing is charged online: the phone call settles payment, and
 * the admin's state machine takes it from there.
 */
export interface PlacementContext {
  /** Present when the order was placed from inside a signed-in storefront session. */
  session: SessionCustomer | null;
  ipAddress: string | null;
}

export async function place(
  db: Database,
  input: PlaceOrderInput,
  context: PlacementContext,
): Promise<PlacedOrder> {
  const lines: ResolvedLine[] = [];

  /* Sequential rather than `Promise.all`: at most 20 lines, and the first
     rejection should name the first bad line rather than whichever query lost a
     race. */
  for (const [index, item] of input.items.entries()) {
    const field = `items.${index}`;
    const product = await loadProduct(db, item.productSlug, field);
    lines.push(resolveLine(product, item, field));
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
  const currency = lines[0]?.currency ?? 'EUR';

  const subtotal = sumLines(lines);

  /* A return address only means something if something is coming back. The
     storefront only asks when a line is rented, so a body carrying one for an
     outright sale disagrees with the catalogue — which is a 422 here, the same as
     any other request that does. */
  if (input.delivery.returnToSameAddress === false) {
    const rented = lines.some((line) => line.configuration.pricingMode === 'rental');
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

  const created = await repo.insertOrder(db, {
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
      skuId: line.skuId,
      productTitle: line.productTitle,
      skuLabel: line.skuLabel,
      sku: line.sku,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      total: line.total,
      configuration: line.configuration as unknown as Record<string, unknown>,
    })),
  });

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

  try {
    const { generateForOrder } = await import('../contracts/service.ts');

    const address = snapshot
      ? `${(snapshot as Record<string, string>).line1 ?? ''}, ${(snapshot as Record<string, string>).postalCode ?? ''} ${(snapshot as Record<string, string>).city ?? ''}`
      : '';

    await generateForOrder(db, {
      orderId: created.id,
      orderNumber: created.number,
      customerType: input.customer.customerType,
      customerName: `${input.customer.firstName} ${input.customer.lastName}`,
      email: input.customer.email,
      phone: input.customer.phone,
      address,
      codiceFiscale: input.customer.codiceFiscale ?? null,
      partitaIva: input.customer.partitaIva ?? null,
      items: lines.map((line) => ({
        productTitle: line.productTitle,
        sku: line.sku,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        total: line.total,
        startDate: line.configuration?.rental?.startDate ?? '',
        endDate: line.configuration?.rental?.endDate ?? null,
        duration: line.configuration?.rental?.duration ?? 1,
        durationUnit: line.configuration?.rental?.unit ?? 'day',
      })),
      subtotal,
      shippingTotal,
      total,
      currency,
      hasDepositProduct: false,
    });
  } catch (error) {
    console.error(`[orders] order ${created.number} placed but contract generation failed:`, error);
  }

  return { ...created, subtotal, shippingTotal, total, currency, items: lines };
}

/**
 * The one email an order sends, in whichever of its three forms applies.
 *
 * Every form carries a fresh `order_report` token, so "I did not place this order"
 * is reachable from any of them — an already-activated account is exactly the case
 * where somebody else ordering under that address matters most.
 */
async function sendPlacementMail(
  db: Database,
  input: {
    account: ResolvedOrderAccount;
    orderId: string;
    order: { number: string; total: string; currency: string };
    ipAddress: string | null;
  },
): Promise<void> {
  const { account, order } = input;
  if (account.mailPlan === 'none') return;

  const needsActivation =
    account.mailPlan === 'newAccount' || account.mailPlan === 'activateReminder';

  /*
    Both tokens reference this order. That is what lets the activation link double
    as the confirmation of the account link: following it proves the customer reads
    the inbox the order was placed under, which is exactly the claim `unverified`
    was recording.
  */
  const { activationToken, reportToken } = await issueOrderMailTokens(db, {
    customerAccountId: account.customerAccountId,
    orderId: input.orderId,
    ipAddress: input.ipAddress,
    withActivation: needsActivation,
  });

  const common = {
    email: account.email,
    firstName: account.firstName,
    lastName: account.lastName,
    order,
    reportToken,
  };

  switch (account.mailPlan) {
    case 'newAccount':
      // `needsActivation` guarantees the token; the check keeps the type honest.
      if (activationToken) {
        await notifications.sendOrderPlacedNewAccount({ ...common, activationToken });
      }
      return;
    case 'activateReminder':
      if (activationToken) {
        await notifications.sendOrderPlacedActivateReminder({ ...common, activationToken });
      }
      return;
    case 'confirmation':
      await notifications.sendOrderPlacedConfirmation(common);
      return;
  }
}

// --- carts -----------------------------------------------------------------

export function listCarts(
  db: Database,
  filters: CartListFilters,
): Promise<{ rows: CartSummaryRecord[]; total: number }> {
  return repo.findCarts(db, filters);
}

export async function getCartById(db: Database, id: string): Promise<CartAggregate> {
  const cart = await repo.findCartById(db, id);
  if (!cart) throw notFound('Cart');
  return cart;
}

export { multiply, sumMoney };
