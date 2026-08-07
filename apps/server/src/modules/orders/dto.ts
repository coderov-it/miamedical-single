/**
 * Wire contracts for the orders module. What the admin sees.
 *
 * Every money field is a two-decimal **string**, never a number. Postgres
 * holds it as `numeric(12,2)`; turning it into a JS float on the way out would
 * throw away exactness for no reason, and the client only ever formats it.
 */

import type { PageMetaDto } from '../products/dto.ts';
import type { OrderStatus, PaymentStatus } from './status.ts';

export type { PageMetaDto };

export interface AddressDto {
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
}

export interface OrderItemDto {
  id: string;
  /** Null once the SKU has been deleted; the snapshot fields still read. */
  skuId: string | null;
  productTitle: string;
  skuLabel: string;
  sku: string;
  quantity: number;
  unitPrice: string;
  total: string;
}

export interface OrderEventDto {
  id: string;
  field: 'status' | 'paymentStatus';
  fromValue: string | null;
  toValue: string;
  note: string | null;
  /** Null for system events, and for actors whose account has been deleted. */
  actorName: string | null;
  createdAt: string;
}

export interface OrderTotalsDto {
  subtotal: string;
  shippingTotal: string;
  taxTotal: string;
  discountTotal: string;
  total: string;
  currency: string;
}

export interface AdminOrderSummaryDto {
  id: string;
  number: string;
  email: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  itemCount: number;
  total: string;
  currency: string;
  placedAt: string;
  updatedAt: string;
}

export interface AdminOrderDetailDto {
  id: string;
  number: string;
  email: string;
  userId: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totals: OrderTotalsDto;
  items: OrderItemDto[];
  shippingAddress: AddressDto | null;
  billingAddress: AddressDto | null;
  notes: string | null;
  /** Oldest first — a timeline is read downwards. */
  events: OrderEventDto[];
  /**
   * What this order may move to next, straight from the state machine. The
   * admin renders buttons from this rather than from its own copy, so a rule
   * change on the server reaches the UI without a deploy.
   */
  allowedStatuses: OrderStatus[];
  allowedPaymentStatuses: PaymentStatus[];
  placedAt: string;
  updatedAt: string;
}

/**
 * Header figures for the orders queue. `pageValue` covers **this page only**;
 * the admin labels it as such. A money total that silently means something
 * narrower than it appears is worse than no total at all.
 */
export interface OrderListStatsDto {
  awaitingCount: number;
  pageValue: string;
  currency: string;
}

/**
 * Trailing-window figures for the dashboard. `revenue` counts only orders that
 * are `paid` or `fulfilled` — `revenueBasis` carries that definition to the UI
 * so the tile can state it instead of leaving the reader to guess.
 */
export interface OrderWindowStatsDto {
  windowDays: number;
  revenue: string;
  currency: string;
  orderCount: number;
  awaitingCount: number;
  revenueBasis: string;
}

export interface AdminCartSummaryDto {
  id: string;
  token: string;
  userEmail: string | null;
  itemCount: number;
  subtotal: string;
  currency: string;
  /** Null means the cart never expires; past means abandoned. */
  expiresAt: string | null;
  isAbandoned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCartItemDto {
  id: string;
  skuId: string;
  /** Live from the catalog, not a snapshot — a cart is not a record of sale. */
  productTitle: string;
  productId: string;
  sku: string;
  quantity: number;
  unitPrice: string;
  total: string;
}

export interface AdminCartDetailDto extends AdminCartSummaryDto {
  items: AdminCartItemDto[];
}
