import type { Database } from '@mia/db';
import { and, count, desc, eq, ilike, or, sql } from '@mia/db';
import {
  adminUsers,
  contractSigningTokens,
  contracts,
  orders,
} from '@mia/db/schema';
import type { ContractStatus, ContractVariant } from '@mia/validators';

export interface ContractRow {
  id: string;
  number: string;
  orderId: string | null;
  variant: ContractVariant;
  status: ContractStatus;
  language: string;
  requiresDeposit: boolean;
  depositAmount: string | null;
  contractData: Record<string, unknown>;
  signedAt: Date | null;
  signatureData: Record<string, unknown> | null;
  sentAt: Date | null;
  viewedAt: Date | null;
  voidedAt: Date | null;
  voidedByAdminUserId: string | null;
  voidReason: string | null;
  pdfStorageKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractSummaryRow extends ContractRow {
  orderNumber: string | null;
}

export interface ContractDetailRow extends ContractSummaryRow {
  voidedByAdminName: string | null;
}

export interface ContractListFilters {
  page: number;
  perPage: number;
  status?: ContractStatus | undefined;
  q?: string | undefined;
}

async function nextContractNumber(tx: Pick<Database, 'execute'>): Promise<string> {
  const rows = await tx.execute<{ value: string }>(
    sql`SELECT nextval('contract_number_seq')::text AS value`,
  );
  const counter = rows[0]?.value ?? '0';
  return `CTR-${new Date().getUTCFullYear()}-${counter.padStart(6, '0')}`;
}

export async function create(
  db: Database,
  data: {
    orderId: string | null;
    variant: ContractVariant;
    language: string;
    requiresDeposit: boolean;
    depositAmount: string | null;
    contractData: Record<string, unknown>;
  },
): Promise<{ id: string; number: string }> {
  return db.transaction(async (tx) => {
    const number = await nextContractNumber(tx);
    const [row] = await tx
      .insert(contracts)
      .values({
        number,
        orderId: data.orderId,
        variant: data.variant,
        status: 'generated',
        language: data.language,
        requiresDeposit: data.requiresDeposit,
        depositAmount: data.depositAmount,
        contractData: data.contractData,
      })
      .returning({ id: contracts.id, number: contracts.number });
    if (!row) throw new Error('Contract insert returned no row.');
    return row;
  });
}

export async function findMany(
  db: Database,
  filters: ContractListFilters,
): Promise<{ rows: ContractSummaryRow[]; total: number }> {
  const clauses = [];
  if (filters.status) clauses.push(eq(contracts.status, filters.status));
  if (filters.q) {
    const term = `%${filters.q}%`;
    /* The customer fields live in the contractData snapshot, which both
       order-generated and manual contracts carry — one search path for both. */
    clauses.push(
      or(
        ilike(contracts.number, term),
        ilike(orders.number, term),
        sql`${contracts.contractData}->'customer'->>'fullName' ILIKE ${term}`,
        sql`${contracts.contractData}->'customer'->>'email' ILIKE ${term}`,
        sql`${contracts.contractData}->'customer'->>'phone' ILIKE ${term}`,
      ),
    );
  }
  const where = clauses.length > 0 ? and(...clauses) : undefined;

  const [rows, totals] = await Promise.all([
    db
      .select({ contract: contracts, orderNumber: orders.number })
      .from(contracts)
      .leftJoin(orders, eq(contracts.orderId, orders.id))
      .where(where)
      .orderBy(desc(contracts.createdAt))
      .limit(filters.perPage)
      .offset((filters.page - 1) * filters.perPage),
    db
      .select({ value: count() })
      .from(contracts)
      .leftJoin(orders, eq(contracts.orderId, orders.id))
      .where(where),
  ]);

  return {
    rows: rows.map((r) => ({ ...r.contract, orderNumber: r.orderNumber })),
    total: totals[0]?.value ?? 0,
  };
}

export async function findById(db: Database, id: string): Promise<ContractDetailRow | undefined> {
  const rows = await db
    .select({
      contract: contracts,
      orderNumber: orders.number,
      voidedByAdminName: adminUsers.fullName,
    })
    .from(contracts)
    .leftJoin(orders, eq(contracts.orderId, orders.id))
    .leftJoin(adminUsers, eq(contracts.voidedByAdminUserId, adminUsers.id))
    .where(eq(contracts.id, id));

  const row = rows[0];
  if (!row) return undefined;
  return { ...row.contract, orderNumber: row.orderNumber, voidedByAdminName: row.voidedByAdminName };
}

export async function findByOrderId(db: Database, orderId: string): Promise<ContractSummaryRow | undefined> {
  const rows = await db
    .select({ contract: contracts, orderNumber: orders.number })
    .from(contracts)
    .innerJoin(orders, eq(contracts.orderId, orders.id))
    .where(eq(contracts.orderId, orderId))
    .orderBy(desc(contracts.createdAt))
    .limit(1);

  const row = rows[0];
  if (!row) return undefined;
  return { ...row.contract, orderNumber: row.orderNumber };
}

export async function updateStatus(
  db: Database,
  id: string,
  status: ContractStatus,
  patch: Partial<typeof contracts.$inferInsert> = {},
): Promise<void> {
  await db.update(contracts).set({ status, ...patch }).where(eq(contracts.id, id));
}

export async function createSigningToken(
  db: Database,
  data: { id: string; contractId: string; expiresAt: Date },
): Promise<void> {
  await db.insert(contractSigningTokens).values(data);
}

export async function findSigningToken(
  db: Database,
  tokenHash: string,
): Promise<{
  token: typeof contractSigningTokens.$inferSelect;
  contract: ContractDetailRow;
} | undefined> {
  const tokenRow = await db.query.contractSigningTokens.findFirst({
    where: eq(contractSigningTokens.id, tokenHash),
  });
  if (!tokenRow) return undefined;

  const contract = await findById(db, tokenRow.contractId);
  if (!contract) return undefined;

  return { token: tokenRow, contract };
}

export async function consumeSigningToken(db: Database, tokenHash: string): Promise<void> {
  await db
    .update(contractSigningTokens)
    .set({ consumedAt: new Date() })
    .where(eq(contractSigningTokens.id, tokenHash));
}
