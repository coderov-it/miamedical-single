import { toAddress, toDelivery, toOrderItem } from '../orders/mapper.ts';
import type { OrderAggregate, OrderSummaryRecord } from '../orders/types.ts';
import type { CustomerOrderDetailDto, CustomerOrderSummaryDto } from './dto.ts';

/**
 * Customer-facing order shapes, built from the same records the admin mapper reads
 * and reusing its item/address/delivery renderers — an order line means the same
 * thing to both audiences, so rendering it twice would only let the two drift.
 *
 * What differs is what is omitted, which is the whole point of a separate mapper.
 */

const iso = (value: Date) => value.toISOString();

/**
 * A rejected order has no account id, so it can never reach these functions. The
 * cast is narrowing the enum to the two states a customer can actually observe,
 * not asserting anything the queries do not already guarantee.
 */
type VisibleLinkStatus = 'unverified' | 'confirmed';

export function toCustomerOrderSummary(row: OrderSummaryRecord): CustomerOrderSummaryDto {
  return {
    number: row.number,
    status: row.status,
    paymentStatus: row.paymentStatus,
    itemCount: row.itemCount,
    total: row.total,
    currency: row.currency,
    linkStatus: row.customerLinkStatus as VisibleLinkStatus,
    placedAt: iso(row.placedAt),
  };
}

export function toCustomerOrderDetail(row: OrderAggregate): CustomerOrderDetailDto {
  return {
    number: row.number,
    status: row.status,
    paymentStatus: row.paymentStatus,
    totals: {
      subtotal: row.subtotal,
      shippingTotal: row.shippingTotal,
      taxTotal: row.taxTotal,
      discountTotal: row.discountTotal,
      total: row.total,
      currency: row.currency,
    },
    items: row.items.map(toOrderItem),
    // Billing is not echoed: today it is the same object as shipping, and showing
    // one snapshot twice invites the reader to think they differ.
    shippingAddress: toAddress(row.shippingAddress),
    delivery: toDelivery(row.delivery),
    notes: row.notes,
    linkStatus: row.customerLinkStatus as VisibleLinkStatus,
    placedAt: iso(row.placedAt),
  };
}
