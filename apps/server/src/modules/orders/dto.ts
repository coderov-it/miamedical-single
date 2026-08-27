/**
 * Wire contracts for the orders module. What the admin sees.
 *
 * Every money field is a two-decimal **string**, never a number. Postgres
 * holds it as `numeric(12,2)`; turning it into a JS float on the way out would
 * throw away exactness for no reason, and the client only ever formats it.
 */

import type { CustomerType, DeliveryMethod } from '@mia/validators';

import type { PageMetaDto } from '../products/dto.ts';
import type { OrderItemConfiguration } from './resolve.ts';
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
  /**
   * The configured rate — per rental unit on a rental line. Deliberately not
   * `total / quantity`: `configuration` below carries the duration and the
   * add-ons that make up the difference.
   */
  unitPrice: string;
  total: string;
  /**
   * What the customer configured. Null on an order that predates the storefront
   * checkout, or one an operator raised by hand — the admin renders the plain
   * line in that case rather than an empty breakdown.
   */
  configuration: OrderItemConfiguration | null;
}

/**
 * How the order changes hands. Read defensively out of `orders.delivery`, so an
 * older shape shows fewer rows rather than breaking the page it is part of.
 */
export interface OrderDeliveryDto {
  method: DeliveryMethod | string;
  deliveryAddress: string | null;
  deliveryPostalCode: string | null;
  pickupCity: string | null;
  /**
   * Where the rental is collected from at the end.
   *
   * `true` means the delivery address (or the branch) — including on orders placed
   * before the question was asked, which is what they already assumed. `false` puts
   * the address in `returnAddress`, and that is the one the driver needs.
   */
  returnToSameAddress: boolean;
  returnAddress: string | null;
}

export interface OrderEventDto {
  id: string;
  field: 'status' | 'paymentStatus' | 'customerLink' | 'contract';
  fromValue: string | null;
  toValue: string;
  note: string | null;
  /** Null for system events, and for actors whose account has been deleted. */
  actorName: string | null;
  /**
   * Which side acted. Null whenever `actorName` is. The UI needs it because
   * "confirmed" by an operator and by the customer are different facts.
   */
  actorKind: 'admin' | 'customer' | null;
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
  /** True when any line is rented — the case where a signed contract is owed. */
  hasRental: boolean;
  /** The newest non-voided contract's status, so the list can say "contract not signed". */
  contractStatus: string | null;
  total: string;
  currency: string;
  placedAt: string;
  updatedAt: string;
}

export interface AdminOrderDetailDto {
  id: string;
  number: string;
  email: string;
  /**
   * The rest of the contact block, as the storefront collected it. Null as a
   * group on an order raised any other way — the seed, or an operator taking one
   * over the phone.
   */
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  customerType: CustomerType | null;
  codiceFiscale: string | null;
  partitaIva: string | null;
  /**
   * The account this order is attached to, and how much that attachment is worth.
   * `unverified` means the email matched an account but nobody has confirmed it;
   * `rejected` orders always carry a null id.
   */
  customerAccountId: string | null;
  customerLinkStatus: 'unverified' | 'confirmed' | 'rejected';
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totals: OrderTotalsDto;
  items: OrderItemDto[];
  shippingAddress: AddressDto | null;
  billingAddress: AddressDto | null;
  delivery: OrderDeliveryDto | null;
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
 * What the storefront gets back when an order is accepted.
 *
 * Deliberately narrow: a reference to quote, the state it opened in, and the
 * figures the server itself computed — nothing the customer typed. Echoing the
 * contact block back would make an unauthenticated endpoint into a way of reading
 * one, and the page already has everything the customer entered.
 */
export interface PlacedOrderDto {
  number: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totals: OrderTotalsDto;
  itemCount: number;
  placedAt: string;
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

export interface CalendarEventDto {
  orderId: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  type: 'order-placed' | 'rental-start' | 'rental-end';
  date: string;
  productTitle: string | null;
}

export interface AdminCartSummaryDto {
  id: string;
  token: string;
  customerEmail: string | null;
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
