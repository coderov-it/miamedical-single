/** Record → DTO. Pure functions, no IO. */

import type {
  AddressDto,
  AdminCartDetailDto,
  AdminCartItemDto,
  AdminCartSummaryDto,
  AdminOrderDetailDto,
  AdminOrderSummaryDto,
  CalendarEventDto,
  OrderDeliveryDto,
  OrderEventDto,
  OrderItemDto,
  OrderTotalsDto,
  PlacedOrderDto,
} from './dto.ts';
import type { OrderItemConfiguration } from './resolve.ts';
import { nextOrderStatuses, nextPaymentStatuses } from './status.ts';
import type { CalendarEntryRow } from './repo.ts';
import type {
  ActorRef,
  CartAggregate,
  CartItemRecord,
  CartSummaryRecord,
  OrderAggregate,
  OrderItemRow,
  OrderStatusEventRecord,
  OrderSummaryRecord,
  PlacedOrder,
} from './types.ts';

const iso = (value: Date) => value.toISOString();

/**
 * Addresses are stored as a jsonb snapshot, so what comes back is whatever was
 * written — possibly from an older shape. Read field by field and fall back to
 * empty rather than trusting the blob: a malformed address must degrade to a
 * blank line on screen, never take down the order it belongs to.
 */
export function toAddress(value: Record<string, unknown> | null): AddressDto | null {
  if (!value || typeof value !== 'object') return null;

  const text = (key: string): string => (typeof value[key] === 'string' ? value[key] : '');
  const optional = (key: string): string | null =>
    typeof value[key] === 'string' && value[key] !== '' ? value[key] : null;

  return {
    fullName: text('fullName'),
    line1: text('line1'),
    line2: optional('line2'),
    city: text('city'),
    region: optional('region'),
    postalCode: text('postalCode'),
    country: text('country'),
    phone: optional('phone'),
  };
}

/**
 * The delivery block, read the same defensive way as an address: field by field,
 * with a missing one becoming null. It is written by this codebase, but it is
 * still a blob that outlives the shape that wrote it.
 */
export function toDelivery(value: Record<string, unknown> | null): OrderDeliveryDto | null {
  if (!value || typeof value !== 'object') return null;

  const optional = (key: string): string | null =>
    typeof value[key] === 'string' && value[key] !== '' ? (value[key] as string) : null;

  const method = optional('method');
  // A block with no method names nothing — the same rule as the CHECK constraint.
  if (!method) return null;

  return {
    method,
    deliveryAddress: optional('deliveryAddress'),
    deliveryPostalCode: optional('deliveryPostalCode'),
    pickupCity: optional('pickupCity'),
    /* Only an explicit `false` means somewhere else. A block written before this
       question existed has neither key, and "the same address" is what it meant. */
    returnToSameAddress: value.returnToSameAddress !== false,
    returnAddress: optional('returnAddress'),
  };
}

/**
 * The line's configuration snapshot.
 *
 * Trusted structurally — this module wrote it — but gated on the one field that
 * decides whether there is anything to render at all, so a line from before the
 * storefront checkout existed comes back as `null` rather than as a breakdown
 * with every row empty.
 */
export function toConfiguration(
  value: Record<string, unknown> | null,
): OrderItemConfiguration | null {
  if (!value || typeof value !== 'object' || typeof value.productSlug !== 'string') return null;
  return value as unknown as OrderItemConfiguration;
}

function actorName(actor: ActorRef | null): string | null {
  if (!actor) return null;
  return actor.fullName ?? actor.email;
}

export function toOrderItem(row: OrderItemRow): OrderItemDto {
  return {
    id: row.id,
    skuId: row.skuId,
    productTitle: row.productTitle,
    skuLabel: row.skuLabel,
    sku: row.sku,
    quantity: row.quantity,
    unitPrice: row.unitPrice,
    total: row.total,
    configuration: toConfiguration(row.configuration),
  };
}

export function toOrderEvent(row: OrderStatusEventRecord): OrderEventDto {
  return {
    id: row.id,
    // Written by this module and only ever one of two values; the cast keeps
    // the DTO honest without a runtime branch on our own audit trail.
    field: row.field as OrderEventDto['field'],
    fromValue: row.fromValue,
    toValue: row.toValue,
    note: row.note,
    actorName: actorName(row.actor),
    actorKind: row.actor?.kind ?? null,
    createdAt: iso(row.createdAt),
  };
}

function toTotals(row: OrderAggregate | OrderSummaryRecord): OrderTotalsDto {
  return {
    subtotal: row.subtotal,
    shippingTotal: row.shippingTotal,
    taxTotal: row.taxTotal,
    discountTotal: row.discountTotal,
    total: row.total,
    currency: row.currency,
  };
}

export function toOrderSummary(row: OrderSummaryRecord): AdminOrderSummaryDto {
  return {
    id: row.id,
    number: row.number,
    email: row.email,
    status: row.status,
    paymentStatus: row.paymentStatus,
    itemCount: row.itemCount,
    total: row.total,
    currency: row.currency,
    placedAt: iso(row.placedAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function toOrderDetail(row: OrderAggregate): AdminOrderDetailDto {
  return {
    id: row.id,
    number: row.number,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    customerType: row.customerType,
    codiceFiscale: row.codiceFiscale,
    partitaIva: row.partitaIva,
    customerAccountId: row.customerAccountId,
    customerLinkStatus: row.customerLinkStatus,
    status: row.status,
    paymentStatus: row.paymentStatus,
    totals: toTotals(row),
    items: row.items.map(toOrderItem),
    shippingAddress: toAddress(row.shippingAddress),
    billingAddress: toAddress(row.billingAddress),
    delivery: toDelivery(row.delivery),
    notes: row.notes,
    events: row.events.map(toOrderEvent),
    allowedStatuses: [...nextOrderStatuses(row.status)],
    allowedPaymentStatuses: [...nextPaymentStatuses(row.paymentStatus)],
    placedAt: iso(row.placedAt),
    updatedAt: iso(row.updatedAt),
  };
}

/**
 * The storefront's receipt. Tax and discount are stated as zero rather than
 * omitted: the checkout renders a totals block, and a missing field would read as
 * an unknown amount instead of one that does not apply.
 */
export function toPlacedOrder(placed: PlacedOrder): PlacedOrderDto {
  return {
    number: placed.number,
    status: 'pending',
    paymentStatus: 'unpaid',
    totals: {
      subtotal: placed.subtotal,
      shippingTotal: placed.shippingTotal,
      taxTotal: '0.00',
      discountTotal: '0.00',
      total: placed.total,
      currency: placed.currency,
    },
    itemCount: placed.items.length,
    placedAt: iso(placed.placedAt),
  };
}

// --- calendar --------------------------------------------------------------

export function toCalendarEvent(row: CalendarEntryRow): CalendarEventDto {
  return {
    orderId: row.orderId,
    orderNumber: row.orderNumber,
    orderStatus: row.orderStatus as CalendarEventDto['orderStatus'],
    type: row.type,
    date: row.date,
    productTitle: row.productTitle,
  };
}

// --- carts -----------------------------------------------------------------

function isAbandoned(expiresAt: Date | null, now: Date): boolean {
  return expiresAt !== null && expiresAt.getTime() < now.getTime();
}

export function toCartSummary(row: CartSummaryRecord, now = new Date()): AdminCartSummaryDto {
  return {
    id: row.id,
    token: row.token,
    customerEmail: row.customerEmail,
    itemCount: row.itemCount,
    subtotal: row.subtotal,
    currency: row.currency,
    expiresAt: row.expiresAt ? iso(row.expiresAt) : null,
    isAbandoned: isAbandoned(row.expiresAt, now),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function toCartItem(row: CartItemRecord): AdminCartItemDto {
  return {
    id: row.id,
    skuId: row.skuId,
    productTitle: row.productTitle,
    productId: row.productId,
    sku: row.sku,
    quantity: row.quantity,
    unitPrice: row.unitPrice,
    // Computed here rather than stored: a cart line has no captured total, and
    // recomputing from the captured `unitPrice` keeps the arithmetic exact.
    total: multiply(row.unitPrice, row.quantity),
  };
}

export function toCartDetail(row: CartAggregate, now = new Date()): AdminCartDetailDto {
  return {
    ...toCartSummary(row, now),
    items: row.items.map(toCartItem),
  };
}

/**
 * Two-decimal string × integer, without going through a float. `12.30 * 3` in
 * IEEE-754 is `36.900000000000006`; in cents it is exactly 3690.
 */
export function multiply(amount: string, quantity: number): string {
  const cents = Math.round(Number(amount) * 100) * quantity;
  return (cents / 100).toFixed(2);
}

/** Sum of two-decimal strings, again via cents. */
export function sumMoney(amounts: readonly string[]): string {
  const cents = amounts.reduce((total, amount) => total + Math.round(Number(amount) * 100), 0);
  return (cents / 100).toFixed(2);
}
