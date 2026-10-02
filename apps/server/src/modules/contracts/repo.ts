import type { Database, DatabaseWriter } from '@mia/db';
import { and, count, desc, eq, gt, ilike, inArray, isNull, ne, or, sql } from '@mia/db';
import {
  adminUsers,
  categories,
  contractSigningTokens,
  contracts,
  orderItems,
  orders,
  products,
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

/**
 * Inserts a `generated` contract. The number is drawn first so the stored
 * snapshot carries it from the start — `build` receives it. Called inside the
 * issuing transaction, which also writes the signing token.
 */
export async function create(
  db: DatabaseWriter,
  data: {
    orderId: string | null;
    variant: ContractVariant;
    language: string;
    requiresDeposit: boolean;
    depositAmount: string | null;
    contractData: (number: string) => Record<string, unknown>;
  },
): Promise<{ id: string; number: string }> {
  const number = await nextContractNumber(db);
  const [row] = await db
    .insert(contracts)
    .values({
      number,
      orderId: data.orderId,
      variant: data.variant,
      status: 'generated',
      language: data.language,
      requiresDeposit: data.requiresDeposit,
      depositAmount: data.depositAmount,
      contractData: data.contractData(number),
    })
    .returning({ id: contracts.id, number: contracts.number });
  if (!row) throw new Error('Contract insert returned no row.');
  return row;
}

/**
 * Holds the order row for the rest of the issuing transaction, so two
 * concurrent "Generate contract" calls queue behind each other and the second
 * sees the first's contract in its live-contract check.
 */
export async function lockOrder(db: DatabaseWriter, orderId: string): Promise<void> {
  await db.select({ id: orders.id }).from(orders).where(eq(orders.id, orderId)).for('update');
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

export async function findById(
  db: DatabaseWriter,
  id: string,
): Promise<ContractDetailRow | undefined> {
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
  return {
    ...row.contract,
    orderNumber: row.orderNumber,
    voidedByAdminName: row.voidedByAdminName,
  };
}

/**
 * Every contract ever issued against the order, newest first. Renewals add a
 * contract per period, so an order accumulates a history rather than owning a
 * single row — the first element is the one whose state currently matters.
 */
export async function findAllByOrderId(
  db: Database,
  orderId: string,
): Promise<ContractSummaryRow[]> {
  const rows = await db
    .select({ contract: contracts, orderNumber: orders.number })
    .from(contracts)
    .innerJoin(orders, eq(contracts.orderId, orders.id))
    .where(eq(contracts.orderId, orderId))
    .orderBy(desc(contracts.createdAt));

  return rows.map((row) => ({ ...row.contract, orderNumber: row.orderNumber }));
}

/** The newest contract that still counts — voided ones are dead paper. */
export async function findLatestActiveByOrderId(
  db: DatabaseWriter,
  orderId: string,
): Promise<ContractSummaryRow | undefined> {
  const rows = await db
    .select({ contract: contracts, orderNumber: orders.number })
    .from(contracts)
    .innerJoin(orders, eq(contracts.orderId, orders.id))
    .where(and(eq(contracts.orderId, orderId), ne(contracts.status, 'voided')))
    .orderBy(desc(contracts.createdAt))
    .limit(1);

  const row = rows[0];
  if (!row) return undefined;
  return { ...row.contract, orderNumber: row.orderNumber };
}

/**
 * Whether any RENTED line of the order is an aid from a deposit category — the
 * fact that selects the scooter contract variants. Only rental lines count: the
 * deposit secures the return of a rented aid, and a scooter bought outright on
 * the same order must not drag a deposit clause into the wheelchair's contract.
 * Read through the live catalogue (item → product → category) so one
 * query serves placement, admin generation and renewal alike; a line whose product
 * has since been deleted simply contributes nothing.
 */
export async function orderRequiresDeposit(db: Database, orderId: string): Promise<boolean> {
  const rows = await db
    .select({ value: sql<boolean>`bool_or(${categories.requiresDeposit})` })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        eq(orderItems.orderId, orderId),
        sql`${orderItems.configuration}->>'pricingMode' = 'rental'`,
      ),
    );

  return rows[0]?.value ?? false;
}

/** States a signature may still be taken from. */
export const SIGNABLE_STATUSES: ContractStatus[] = ['generated', 'sent', 'viewed'];

/**
 * Moves the contract to `status` only while it is still in one of `from` — the
 * guard that keeps a void from overwriting a signature committed a moment
 * earlier, and a second signature from overwriting the first. False when the
 * row had already moved on; the caller decides what that means.
 */
export async function updateStatusIf(
  db: DatabaseWriter,
  id: string,
  from: ContractStatus[],
  status: ContractStatus,
  patch: Partial<typeof contracts.$inferInsert> = {},
): Promise<boolean> {
  const rows = await db
    .update(contracts)
    .set({ status, ...patch })
    .where(and(eq(contracts.id, id), inArray(contracts.status, from)))
    .returning({ id: contracts.id });
  return rows.length > 0;
}

/** Rewrites the snapshot of a contract that is not yet signed or voided. */
export async function updateDataIfOpen(
  db: DatabaseWriter,
  id: string,
  contractData: Record<string, unknown>,
): Promise<boolean> {
  const rows = await db
    .update(contracts)
    .set({ contractData })
    .where(and(eq(contracts.id, id), inArray(contracts.status, SIGNABLE_STATUSES)))
    .returning({ id: contracts.id });
  return rows.length > 0;
}

/**
 * Opening the link: `viewed`, from a state before it only. The first view's
 * time is kept across resends. A viewed, signed or voided contract is untouched.
 */
export async function markViewed(db: DatabaseWriter, id: string): Promise<void> {
  await db
    .update(contracts)
    .set({ status: 'viewed', viewedAt: sql`COALESCE(${contracts.viewedAt}, now())` })
    .where(and(eq(contracts.id, id), inArray(contracts.status, ['generated', 'sent'])));
}

export async function createSigningToken(
  db: DatabaseWriter,
  data: { id: string; contractId: string; expiresAt: Date },
): Promise<void> {
  await db.insert(contractSigningTokens).values(data);
}

export async function findSigningToken(
  db: DatabaseWriter,
  tokenHash: string,
): Promise<
  | {
      token: typeof contractSigningTokens.$inferSelect;
      contract: ContractDetailRow;
    }
  | undefined
> {
  const tokenRow = await db.query.contractSigningTokens.findFirst({
    where: eq(contractSigningTokens.id, tokenHash),
  });
  if (!tokenRow) return undefined;

  const contract = await findById(db, tokenRow.contractId);
  if (!contract) return undefined;

  return { token: tokenRow, contract };
}

/**
 * Spends the token, but only one that is unspent and unexpired — the contract
 * id it was for, or null. Runs inside the signing transaction, so a signature
 * that fails to save leaves the token as it was.
 */
export async function consumeSigningToken(
  db: DatabaseWriter,
  tokenHash: string,
): Promise<string | null> {
  const [row] = await db
    .update(contractSigningTokens)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(contractSigningTokens.id, tokenHash),
        isNull(contractSigningTokens.consumedAt),
        gt(contractSigningTokens.expiresAt, new Date()),
      ),
    )
    .returning({ contractId: contractSigningTokens.contractId });
  return row?.contractId ?? null;
}
