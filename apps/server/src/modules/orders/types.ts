/** Internal records for the orders module. Not wire types — those live in dto.ts. */

import type { cartItems, carts, orderItems, orders, orderStatusEvents } from '@mia/db/schema';

export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;
export type OrderStatusEventRow = typeof orderStatusEvents.$inferSelect;
export type CartRow = typeof carts.$inferSelect;
export type CartItemRow = typeof cartItems.$inferSelect;

/** Just enough of the actor to render a timeline line. */
export interface ActorRef {
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
  userEmail: string | null;
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

/** Totals for the list header. Money stays a string all the way to the client. */
export interface OrderListStats {
  total: number;
  awaitingCount: number;
  pageValue: string;
}
