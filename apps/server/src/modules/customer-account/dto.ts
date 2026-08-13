import type { AddressDto, OrderDeliveryDto, OrderItemDto, OrderTotalsDto } from '../orders/dto.ts';

/**
 * What a customer may see of their own order.
 *
 * A narrower shape than `AdminOrderDetailDto`, and narrower on purpose. Absent:
 * the internal id, the status timeline, operator notes, `allowedStatuses`, and the
 * fiscal identifiers — a customer reading back their own codice fiscale gains
 * nothing and it is the sort of field that ends up in a screenshot.
 */

export interface CustomerOrderSummaryDto {
  number: string;
  status: string;
  paymentStatus: string;
  itemCount: number;
  total: string;
  currency: string;
  /**
   * How the account came to be attached. `unverified` is what the UI badges with
   * "was this you?"; `confirmed` needs no prompt.
   */
  linkStatus: 'unverified' | 'confirmed';
  placedAt: string;
}

export interface CustomerOrderDetailDto {
  number: string;
  status: string;
  paymentStatus: string;
  totals: OrderTotalsDto;
  items: OrderItemDto[];
  shippingAddress: AddressDto | null;
  delivery: OrderDeliveryDto | null;
  /** What the customer themselves wrote at checkout, echoed back. */
  notes: string | null;
  linkStatus: 'unverified' | 'confirmed';
  placedAt: string;
}
