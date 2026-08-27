/** Internal records for the orders module. Not wire types — those live in dto.ts. */

import type { cartItems, carts, orderItems, orders, orderStatusEvents } from '@mia/db/schema';

import type { ResolvedLine } from './resolve.ts';

export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;
export type OrderStatusEventRow = typeof orderStatusEvents.$inferSelect;
export type CartRow = typeof carts.$inferSelect;
export type CartItemRow = typeof cartItems.$inferSelect;

/**
 * Just enough of the actor to render a timeline line.
 *
 * `kind` says which table the id came from — an operator in `admin_users` or a
 * customer in `customer_accounts`. Both can now write events, and the two mean
 * different things, so the timeline has to be able to tell them apart.
 */
export interface ActorRef {
  kind: 'admin' | 'customer';
  id: string;
  email: string;
  fullName: string | null;
}

export interface OrderStatusEventRecord extends OrderStatusEventRow {
  actor: ActorRef | null;
}

/** What the list endpoint needs: the order plus a line count, no line rows. */
export interface OrderSummaryRecord extends OrderRow {
  itemCount: number;
}

/** The admin list row: the summary plus what the contract column reads. */
export interface AdminOrderSummaryRecord extends OrderSummaryRecord {
  /** True when any line is rented — the case where a contract is owed. */
  hasRental: boolean;
  /** The newest non-voided contract's status, or null when none exists. */
  contractStatus: string | null;
}

export interface OrderAggregate extends OrderRow {
  items: OrderItemRow[];
  events: OrderStatusEventRecord[];
}

/**
 * A cart line carries no snapshot — unlike an order line, its title has to be
 * read live from the SKU it points at, and can change under it.
 */
export interface CartItemRecord extends CartItemRow {
  productTitle: string;
  sku: string;
  productId: string;
}

export interface CartSummaryRecord extends CartRow {
  itemCount: number;
  /** Sum of `unitPrice * quantity`, as a two-decimal string. */
  subtotal: string;
  customerEmail: string | null;
}

export interface CartAggregate extends CartSummaryRecord {
  items: CartItemRecord[];
}

export interface OrderListFilters {
  page: number;
  perPage: number;
  q?: string | undefined;
  status?: OrderRow['status'] | undefined;
  paymentStatus?: OrderRow['paymentStatus'] | undefined;
  type?: 'rental' | 'fixed' | undefined;
  /** Inclusive ISO dates against `placedAt`. */
  from?: string | undefined;
  to?: string | undefined;
}

export interface CartListFilters {
  page: number;
  perPage: number;
  q?: string | undefined;
  /** `active` still has time on the clock; `abandoned` is past `expiresAt`. */
  state?: 'active' | 'abandoned' | undefined;
}

/**
 * What `service.place` hands back: the created order's identity, the figures the
 * server computed, and the resolved lines it computed them from.
 */
export interface PlacedOrder {
  id: string;
  number: string;
  placedAt: Date;
  subtotal: string;
  shippingTotal: string;
  total: string;
  currency: string;
  items: ResolvedLine[];
}

/** Totals for the list header. Money stays a string all the way to the client. */
export interface OrderListStats {
  total: number;
  awaitingCount: number;
  pageValue: string;
}
