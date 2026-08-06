import { pgEnum } from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['customer', 'staff', 'admin']);

export const productStatus = pgEnum('product_status', ['draft', 'active', 'archived']);

export const orderStatus = pgEnum('order_status', [
  'pending',
  'paid',
  'fulfilled',
  'cancelled',
  'refunded',
]);

export const paymentStatus = pgEnum('payment_status', [
  'unpaid',
  'authorized',
  'paid',
  'partially_refunded',
  'refunded',
  'failed',
]);

export const addressKind = pgEnum('address_kind', ['shipping', 'billing']);
