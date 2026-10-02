import type { Database, DatabaseWriter, Transaction } from '@mia/db';
import { eq } from '@mia/db';
import { orders } from '@mia/db/schema';
import type { ContractData } from '@mia/templates';

import { conflict } from '../../shared/http/errors.ts';
import * as notifications from '../notifications/mail.ts';
import { emit } from '../notifications/write.ts';
/* One-way dependency: the orders repo knows nothing about contracts. The event
   writer lives there because the timeline is the orders module's artefact. */
import { insertContractEvent } from '../orders/repo.ts';
import { defaultDamages } from './render.ts';
import * as repo from './repo.ts';
import { generateToken, tokenExpiry } from './token.ts';
import { resolveVariant } from './variant.ts';

/**
 * Runs inside the issuing transaction once the contract row exists — how a
 * renewal links the new contract to its extension. A throw rolls the contract
 * back with it, so a contract never exists unlinked.
 */
export type IssueHook = (
  tx: Transaction,
  contract: { id: string; number: string },
) => Promise<void>;

export interface IssueContractInput {
  orderId: string | null;
  orderNumber: string | null;
  customerType: 'private' | 'company' | 'tourist';
  customerName: string;
  email: string;
  phone: string;
  address: string;
  codiceFiscale: string | null;
  partitaIva: string | null;
  /** SDI e-invoice code — collected on manual company contracts only. */
  codiceUnivoco?: string | null;
  items: ContractData['items'];
  subtotal: string;
  shippingTotal: string;
  total: string;
  currency: string;
  hasDepositProduct: boolean;
  damages?: ContractData['damages'];
  /** A renewal is a new contract for a new period on the same order. */
  kind?: 'initial' | 'renewal';
  /** The operator who triggered it, for the order timeline. Null = system. */
  actorAdminUserId?: string | null;
  onIssued?: IssueHook;
}

/**
 * Two phases, because the email cannot be inside a transaction:
 *
 *   1. one transaction   contract row (generated) + signing token + `onIssued`
 *   2. after commit      email → on success: status sent, timeline "sent", feed row
 *                                on failure: stays generated, failure on the timeline
 *
 * A failed email leaves a real, issued contract the operator can resend; the
 * timeline never claims "sent" for a message that did not go.
 */
export async function issueContract(
  db: Database,
  input: IssueContractInput,
): Promise<{ id: string; number: string }> {
  const { variant, language, requiresDeposit, depositAmount } = resolveVariant(
    input.customerType,
    input.hasDepositProduct,
  );

  const snapshot = (contractNumber: string): ContractData => ({
    contractNumber,
    orderNumber: input.orderNumber,
    customer: {
      fullName: input.customerName,
      email: input.email,
      phone: input.phone,
      address: input.address,
      codiceFiscale: input.codiceFiscale,
      partitaIva: input.partitaIva,
      codiceUnivoco: input.codiceUnivoco ?? null,
      customerType: input.customerType,
    },
    items: input.items,
    subtotal: input.subtotal,
    shippingTotal: input.shippingTotal,
    total: input.total,
    currency: input.currency,
    requiresDeposit,
    depositAmount,
    damages: input.damages ?? defaultDamages(language),
    generatedAt: new Date().toISOString().slice(0, 10),
  });

  const token = generateToken();
  const contract = await db.transaction(async (tx) => {
    if (input.orderId) {
      await repo.lockOrder(tx, input.orderId);
      await assertNoLiveContract(tx, input.orderId);
    }
    const created = await repo.create(tx, {
      orderId: input.orderId,
      variant,
      language,
      requiresDeposit,
      depositAmount,
      contractData: (number) => snapshot(number) as unknown as Record<string, unknown>,
    });
    await repo.createSigningToken(tx, {
      id: token.hash,
      contractId: created.id,
      expiresAt: tokenExpiry(),
    });
    if (input.onIssued) await input.onIssued(tx, created);
    return created;
  });

  const mail = await notifications.sendContractReady(
    {
      email: input.email,
      customerName: input.customerName,
      contractNumber: contract.number,
      orderNumber: input.orderNumber,
      signingToken: token.raw,
      language,
    },
    { db, orderId: input.orderId },
  );
  if (!mail.sent) return contract;

  await recordSent(db, contract, input);
  return contract;
}

/**
 * One live contract at a time. A signed one may be followed (that is what a
 * renewal is); an unsigned one still out for signature must be resent or
 * voided, not silently duplicated. Read under the order lock, so two
 * concurrent issues cannot both pass it.
 */
async function assertNoLiveContract(db: DatabaseWriter, orderId: string): Promise<void> {
  const latest = await repo.findLatestActiveByOrderId(db, orderId);
  if (latest && latest.status !== 'signed') {
    throw conflict(
      `Contract ${latest.number} is still awaiting signature. Resend it, or void it before issuing a new one.`,
    );
  }
}

/** The email went: the contract is `sent`, and the order and the customer are told. */
async function recordSent(
  db: Database,
  contract: { id: string; number: string },
  input: IssueContractInput,
): Promise<void> {
  const accountId = await accountForOrder(db, input.orderId);
  await db.transaction(async (tx) => {
    // Guarded: a customer who already opened the link keeps `viewed`.
    await repo.updateStatusIf(tx, contract.id, ['generated'], 'sent', { sentAt: new Date() });

    if (accountId) {
      await emit(tx, {
        audience: 'customer',
        customerAccountId: accountId,
        type: 'contract.awaiting_signature',
        orderId: input.orderId,
        data: { contractNumber: contract.number, orderNumber: input.orderNumber },
      });
    }

    if (!input.orderId) return;
    const first = input.items[0];
    let note = `Contract ${contract.number} sent to ${input.email} for signing.`;
    if (input.kind === 'renewal') {
      note = `Renewal contract ${contract.number} sent for signing (${first?.startDate ?? '?'} → ${first?.endDate ?? '?'}).`;
    }
    await insertContractEvent(tx, {
      orderId: input.orderId,
      fromValue: null,
      toValue: 'sent',
      note,
      actorAdminUserId: input.actorAdminUserId ?? null,
    });
  });
}

/**
 * The account a contract's order belongs to, or null.
 *
 * Null is ordinary, not an error: a manual contract has no order at all, and an
 * order taken over the phone may never be claimed by an account. Both mean
 * there is nobody to put a feed row in front of, and the email still goes.
 */
export async function accountForOrder(
  db: DatabaseWriter,
  orderId: string | null,
): Promise<string | null> {
  if (!orderId) return null;
  const [row] = await db
    .select({ accountId: orders.customerAccountId })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  return row?.accountId ?? null;
}
