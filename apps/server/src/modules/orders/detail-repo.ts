/**
 * Single-order reads for the back office: the order with its lines, timeline,
 * refunds, contract status and the creating agent's name. Plain records out.
 * Re-exported by `repo.ts`, which keeps the writes.
 */

import type { Database } from '@mia/db';
import { and, asc, desc, eq, ne } from '@mia/db';
import {
  adminUsers,
  contracts,
  customerAccounts,
  orderItems,
  orderRefunds,
  orders,
  orderStatusEvents,
  returnInspections,
} from '@mia/db/schema';

import type {
  ActorRef,
  AdminOrderAggregate,
  OrderRefundRecord,
  OrderStatusEventRecord,
} from './types.ts';

export async function findById(db: Database, id: string): Promise<AdminOrderAggregate | undefined> {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, id) });
  if (!order) return undefined;

  const [items, events, refunds, createdByName, contractStatus, inspections] = await Promise.all([
    db.query.orderItems.findMany({
      where: eq(orderItems.orderId, id),
      orderBy: asc(orderItems.id),
    }),
    findEvents(db, id),
    findRefunds(db, id),
    findAdminName(db, order.createdByAdminUserId),
    findContractStatus(db, id),
    db.query.returnInspections.findMany({
      where: eq(returnInspections.orderId, id),
      orderBy: [asc(returnInspections.inspectedAt), asc(returnInspections.id)],
    }),
  ]);

  return { ...order, items, events, refunds, createdByName, contractStatus, inspections };
}

/** The newest non-voided contract's status — what the manual stage reads. */
async function findContractStatus(db: Database, orderId: string): Promise<string | null> {
  const row = await db.query.contracts.findFirst({
    where: and(eq(contracts.orderId, orderId), ne(contracts.status, 'voided')),
    orderBy: desc(contracts.createdAt),
    columns: { status: true },
  });
  return row?.status ?? null;
}

/** The agent's name, else email; null for an online order or a deleted agent. */
async function findAdminName(db: Database, adminId: string | null): Promise<string | null> {
  if (!adminId) return null;
  const row = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.id, adminId),
    columns: { fullName: true, email: true },
  });
  return row ? (row.fullName ?? row.email) : null;
}

/** Newest first; `id` breaks ties between refunds written in one instant. */
export async function findRefunds(db: Database, orderId: string): Promise<OrderRefundRecord[]> {
  const rows = await db
    .select({
      id: orderRefunds.id,
      amount: orderRefunds.amount,
      reason: orderRefunds.reason,
      rentalExtensionId: orderRefunds.rentalExtensionId,
      actorEmail: adminUsers.email,
      actorFullName: adminUsers.fullName,
      createdAt: orderRefunds.createdAt,
    })
    .from(orderRefunds)
    .leftJoin(adminUsers, eq(orderRefunds.actorAdminUserId, adminUsers.id))
    .where(eq(orderRefunds.orderId, orderId))
    .orderBy(desc(orderRefunds.createdAt), desc(orderRefunds.id));

  return rows.map(({ actorEmail, actorFullName, ...row }) => ({
    ...row,
    actorName: actorFullName ?? actorEmail,
  }));
}

export async function findEvents(db: Database, orderId: string): Promise<OrderStatusEventRecord[]> {
  const rows = await db
    .select({
      event: orderStatusEvents,
      adminId: adminUsers.id,
      adminEmail: adminUsers.email,
      adminName: adminUsers.fullName,
      customerId: customerAccounts.id,
      customerEmail: customerAccounts.email,
      customerFirstName: customerAccounts.firstName,
      customerLastName: customerAccounts.lastName,
    })
    .from(orderStatusEvents)
    // Two actor tables, at most one of which matches: an operator moved a status,
    // or a customer confirmed or rejected the account link.
    .leftJoin(adminUsers, eq(orderStatusEvents.actorAdminUserId, adminUsers.id))
    .leftJoin(customerAccounts, eq(orderStatusEvents.actorCustomerAccountId, customerAccounts.id))
    .where(eq(orderStatusEvents.orderId, orderId))
    // Oldest first: a timeline is read downwards. `id` breaks ties so two
    // events written in the same transaction keep a stable order.
    .orderBy(asc(orderStatusEvents.createdAt), asc(orderStatusEvents.id));

  return rows.map((row) => ({
    ...row.event,
    actor: resolveActor(row),
  }));
}

/**
 * Collapses the two actor joins into one reference. `kind` matters to the reader:
 * "Confermato" from an operator and from the customer are different facts, and
 * without it the timeline would present them identically.
 */
function resolveActor(row: {
  adminId: string | null;
  adminEmail: string | null;
  adminName: string | null;
  customerId: string | null;
  customerEmail: string | null;
  customerFirstName: string | null;
  customerLastName: string | null;
}): ActorRef | null {
  if (row.adminId && row.adminEmail) {
    return { kind: 'admin', id: row.adminId, email: row.adminEmail, fullName: row.adminName };
  }

  if (row.customerId && row.customerEmail) {
    return {
      kind: 'customer',
      id: row.customerId,
      email: row.customerEmail,
      fullName: `${row.customerFirstName ?? ''} ${row.customerLastName ?? ''}`.trim() || null,
    };
  }

  return null;
}
