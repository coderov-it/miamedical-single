/** Record → DTO. Pure functions, no IO. */

import type {
  AddressDto,
  AdminCartDetailDto,
  AdminCartItemDto,
  AdminCartSummaryDto,
  AdminOrderDetailDto,
  AdminOrderSummaryDto,
  OrderEventDto,
  OrderItemDto,
  OrderTotalsDto,
} from './dto.ts';
import { nextOrderStatuses, nextPaymentStatuses } from './status.ts';
import type {
  ActorRef,
  CartAggregate,
  CartItemRecord,
  CartSummaryRecord,
  OrderAggregate,
  OrderItemRow,
  OrderStatusEventRecord,
  OrderSummaryRecord,
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
    userId: row.userId,
    status: row.status,
    paymentStatus: row.paymentStatus,
    totals: toTotals(row),
    items: row.items.map(toOrderItem),
    shippingAddress: toAddress(row.shippingAddress),
    billingAddress: toAddress(row.billingAddress),
    notes: row.notes,
    events: row.events.map(toOrderEvent),
    allowedStatuses: [...nextOrderStatuses(row.status)],
    allowedPaymentStatuses: [...nextPaymentStatuses(row.paymentStatus)],
    placedAt: iso(row.placedAt),
    updatedAt: iso(row.updatedAt),
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
    userEmail: row.userEmail,
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
