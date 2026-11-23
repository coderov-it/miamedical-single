/** Reads and the resolution lookup for the attention queue (`outcome = 'attention'`). */

import type { Database, Transaction } from '@mia/db';
import { and, asc, eq, inArray, isNull } from '@mia/db';
import {
  adminUsers,
  orderItems,
  orders,
  products,
  returnInspections,
} from '@mia/db/schema';

import { findReceived, unitColumns } from './unit-context.ts';
import { toUnitDetails, type UnitDetails, unitNumbers } from './unit-details.ts';

export interface AttentionRecord extends UnitDetails {
  id: string;
  orderId: string;
  orderNumber: string;
  productId: string | null;
  productTitle: string;
  /** Position among the line's inspection rows, by inspectedAt then id. */
  unitNumber: number;
  note: string | null;
  inspectedAt: Date;
  inspectedByName: string | null;
  resolution: 'repaired' | 'written_off' | null;
  resolutionNote: string | null;
  resolvedAt: Date | null;
}

const attentionSelect = {
  id: returnInspections.id,
  orderId: returnInspections.orderId,
  orderItemId: returnInspections.orderItemId,
  orderNumber: orders.number,
  productId: returnInspections.productId,
  productTitle: orderItems.productTitle,
  note: returnInspections.note,
  inspectedAt: returnInspections.inspectedAt,
  adminName: adminUsers.fullName,
  adminEmail: adminUsers.email,
  resolution: returnInspections.resolution,
  resolutionNote: returnInspections.resolutionNote,
  resolvedAt: returnInspections.resolvedAt,
  ...unitColumns,
};

function attentionQuery(db: Database | Transaction) {
  return db
    .select(attentionSelect)
    .from(returnInspections)
    .innerJoin(orders, eq(returnInspections.orderId, orders.id))
    .innerJoin(orderItems, eq(returnInspections.orderItemId, orderItems.id))
    .leftJoin(products, eq(orderItems.productId, products.id))
    .leftJoin(adminUsers, eq(returnInspections.inspectedByAdminUserId, adminUsers.id));
}

type AttentionRow = Awaited<ReturnType<typeof attentionQuery>>[number];

/** Adds the unit number and the receipt, which each need a query of their own. */
async function toRecords(
  db: Database | Transaction,
  rows: AttentionRow[],
): Promise<AttentionRecord[]> {
  if (rows.length === 0) return [];
  const siblings = await db
    .select({ id: returnInspections.id, orderItemId: returnInspections.orderItemId })
    .from(returnInspections)
    .where(
      inArray(returnInspections.orderItemId, [...new Set(rows.map((row) => row.orderItemId))]),
    )
    .orderBy(asc(returnInspections.inspectedAt), asc(returnInspections.id));
  const numbers = unitNumbers(siblings);
  const received = await findReceived(db, [...new Set(rows.map((row) => row.orderId))]);

  return rows.map((row) => {
    return {
      id: row.id,
      orderId: row.orderId,
      orderNumber: row.orderNumber,
      productId: row.productId,
      productTitle: row.productTitle,
      note: row.note,
      inspectedAt: row.inspectedAt,
      resolution: row.resolution,
      resolutionNote: row.resolutionNote,
      resolvedAt: row.resolvedAt,
      ...toUnitDetails(row, received.get(row.orderId)),
      unitNumber: numbers.get(row.id) ?? 1,
      inspectedByName: row.adminName ?? row.adminEmail,
    };
  });
}

/** Unresolved attention rows, oldest first. */
export async function findOpenAttention(db: Database): Promise<AttentionRecord[]> {
  const rows = await attentionQuery(db)
    .where(and(eq(returnInspections.outcome, 'attention'), isNull(returnInspections.resolution)))
    .orderBy(asc(returnInspections.inspectedAt), asc(returnInspections.id));
  return toRecords(db, rows);
}

export async function findAttentionById(
  db: Database | Transaction,
  id: string,
): Promise<AttentionRecord | undefined> {
  const rows = await attentionQuery(db).where(eq(returnInspections.id, id)).limit(1);
  return (await toRecords(db, rows))[0];
}
