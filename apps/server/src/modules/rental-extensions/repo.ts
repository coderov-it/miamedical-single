import type { Database, DatabaseWriter } from '@mia/db';
import { and, desc, eq, inArray, sql } from '@mia/db';
import {
  contracts,
  orderItems,
  orderStatusEvents,
  orders,
  products,
  rentalExtensions,
} from '@mia/db/schema';
import type { RentalPackage } from '@mia/db/schema';

import type { ExtensionRow, ExtensionStatus, RentalLine } from './types.ts';

/** Both open states — the partial unique index allows one of these per order. */
export const OPEN_STATUSES: ExtensionStatus[] = ['renew_pending', 'awaiting_signature'];

const extensionFields = {
  extension: rentalExtensions,
  contractNumber: contracts.number,
  contractStatus: contracts.status,
};

function toRow(row: {
  extension: typeof rentalExtensions.$inferSelect;
  contractNumber: string | null;
  contractStatus: string | null;
}): ExtensionRow {
  return {
    ...row.extension,
    contractNumber: row.contractNumber,
    contractStatus: row.contractStatus,
  };
}

/** Every extension of the order, newest span first. */
export async function findByOrderId(db: Database, orderId: string): Promise<ExtensionRow[]> {
  const rows = await db
    .select(extensionFields)
    .from(rentalExtensions)
    .leftJoin(contracts, eq(rentalExtensions.contractId, contracts.id))
    .where(eq(rentalExtensions.orderId, orderId))
    .orderBy(desc(rentalExtensions.createdAt));
  return rows.map(toRow);
}

export async function findById(db: Database, id: string): Promise<ExtensionRow | undefined> {
  const [row] = await db
    .select(extensionFields)
    .from(rentalExtensions)
    .leftJoin(contracts, eq(rentalExtensions.contractId, contracts.id))
    .where(eq(rentalExtensions.id, id))
    .limit(1);
  return row ? toRow(row) : undefined;
}

export async function findOpenByContractId(
  db: DatabaseWriter,
  contractId: string,
): Promise<typeof rentalExtensions.$inferSelect | undefined> {
  const [row] = await db
    .select()
    .from(rentalExtensions)
    .where(
      and(
        eq(rentalExtensions.contractId, contractId),
        eq(rentalExtensions.status, 'awaiting_signature'),
      ),
    )
    .limit(1);
  return row;
}

export async function insert(
  db: DatabaseWriter,
  values: typeof rentalExtensions.$inferInsert,
): Promise<string> {
  const [row] = await db
    .insert(rentalExtensions)
    .values(values)
    .returning({ id: rentalExtensions.id });
  if (!row) throw new Error('rental_extensions insert returned no row');
  return row.id;
}

export async function update(
  db: DatabaseWriter,
  id: string,
  values: Partial<typeof rentalExtensions.$inferInsert>,
): Promise<void> {
  await db.update(rentalExtensions).set(values).where(eq(rentalExtensions.id, id));
}

/** The order header an extension is decided from. */
export async function findOrder(db: Database, orderId: string) {
  return db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: {
      id: true,
      number: true,
      status: true,
      currency: true,
      customerAccountId: true,
      firstName: true,
      lastName: true,
    },
  });
}

/**
 * The order's rental lines with the packages their product offers TODAY — an
 * extension is quoted at the current price list, not the one the order was
 * placed at. A deleted product has no packages, which leaves the operator to
 * type the amount.
 */
export async function findRentalLines(db: Database, orderId: string): Promise<RentalLine[]> {
  const rows = await db
    .select({
      id: orderItems.id,
      productTitle: orderItems.productTitle,
      quantity: orderItems.quantity,
      configuration: orderItems.configuration,
      packages: products.rentalPackages,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(
      and(
        eq(orderItems.orderId, orderId),
        sql`${orderItems.configuration}->>'pricingMode' = 'rental'`,
      ),
    );

  return rows.map((row) => {
    const rental = (row.configuration?.rental ?? null) as Record<string, unknown> | null;
    return {
      id: row.id,
      productTitle: row.productTitle,
      quantity: row.quantity,
      startDate: typeof rental?.startDate === 'string' ? rental.startDate : null,
      endDate: typeof rental?.endDate === 'string' ? rental.endDate : null,
      unit: rental?.unit === 'hour' ? 'hour' : 'day',
      packages: (row.packages ?? []) as RentalPackage[],
    };
  });
}

/**
 * Moves every rental line's end to the extension's end. The start stays — it is
 * the day the equipment went out — and `duration` becomes the whole span, so the
 * line keeps describing the rental as it now stands.
 */
export async function extendRentalLines(
  db: DatabaseWriter,
  orderId: string,
  toDate: string,
): Promise<void> {
  const items = await db.query.orderItems.findMany({ where: eq(orderItems.orderId, orderId) });
  for (const item of items) {
    const config = item.configuration as Record<string, unknown> | null;
    if (config?.pricingMode !== 'rental') continue;
    const rental = (config.rental as Record<string, unknown> | undefined) ?? {};
    const start = typeof rental.startDate === 'string' ? rental.startDate : toDate;
    const duration = Math.max(
      1,
      Math.round(
        (Date.parse(`${toDate}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000,
      ),
    );
    await db
      .update(orderItems)
      .set({ configuration: { ...config, rental: { ...rental, endDate: toDate, duration } } })
      .where(eq(orderItems.id, item.id));
  }
}

/**
 * An `extension` entry on the order timeline. Same table as status and contract
 * events, so the operator reads one ordered history.
 */
export async function insertEvent(
  db: DatabaseWriter,
  event: {
    orderId: string;
    fromValue: string | null;
    toValue: string;
    note: string;
    actorAdminUserId?: string | null;
    actorCustomerAccountId?: string | null;
  },
): Promise<void> {
  await db.insert(orderStatusEvents).values({
    orderId: event.orderId,
    field: 'extension',
    fromValue: event.fromValue,
    toValue: event.toValue,
    note: event.note,
    actorAdminUserId: event.actorAdminUserId ?? null,
    actorCustomerAccountId: event.actorCustomerAccountId ?? null,
  });
}

/** The open extension per order, for list rows. */
export async function findOpenStatusByOrderIds(
  db: Database,
  orderIds: string[],
): Promise<Map<string, ExtensionStatus>> {
  if (orderIds.length === 0) return new Map();
  const rows = await db
    .select({ orderId: rentalExtensions.orderId, status: rentalExtensions.status })
    .from(rentalExtensions)
    .where(
      and(
        inArray(rentalExtensions.orderId, orderIds),
        inArray(rentalExtensions.status, OPEN_STATUSES),
      ),
    );
  return new Map(rows.map((row) => [row.orderId, row.status]));
}
