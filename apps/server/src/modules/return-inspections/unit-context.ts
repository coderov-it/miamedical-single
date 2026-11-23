/** Shared reads behind both return lists: the unit's columns and its latest receipt. */

import type { Database, Transaction } from '@mia/db';
import { and, desc, eq, inArray } from '@mia/db';
import { adminUsers, orderItems, orders, orderStatusEvents, products } from '@mia/db/schema';

import { rentalEndDate, rentalStartDate } from '../../shared/rental-calendar.ts';
import { latestPerOrder, type ReceivedEvent } from './unit-details.ts';

/** Order, customer and product columns `toUnitDetails` reads. */
export const unitColumns = {
  quantity: orderItems.quantity,
  firstName: orders.firstName,
  lastName: orders.lastName,
  email: orders.email,
  phone: orders.phone,
  shippingAddress: orders.shippingAddress,
  media: products.media,
  rentalStartDate,
  rentalEndDate,
};

/** The latest `received` status event of each order, with the admin who made it. */
export async function findReceived(
  db: Database | Transaction,
  orderIds: string[],
): Promise<Map<string, ReceivedEvent>> {
  if (orderIds.length === 0) return new Map();
  const rows = await db
    .select({
      orderId: orderStatusEvents.orderId,
      at: orderStatusEvents.createdAt,
      adminName: adminUsers.fullName,
      adminEmail: adminUsers.email,
    })
    .from(orderStatusEvents)
    .leftJoin(adminUsers, eq(orderStatusEvents.actorAdminUserId, adminUsers.id))
    .where(
      and(
        inArray(orderStatusEvents.orderId, orderIds),
        eq(orderStatusEvents.field, 'status'),
        eq(orderStatusEvents.toValue, 'received'),
      ),
    )
    .orderBy(desc(orderStatusEvents.createdAt), desc(orderStatusEvents.id));
  return latestPerOrder(
    rows.map((row) => ({
      orderId: row.orderId,
      at: row.at,
      byName: row.adminName ?? row.adminEmail,
    })),
  );
}
