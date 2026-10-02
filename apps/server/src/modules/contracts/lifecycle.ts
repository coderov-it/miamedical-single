import type { Database, Transaction } from '@mia/db';
import type { ContractData } from '@mia/templates';

import { conflict, httpError, notFound } from '../../shared/http/errors.ts';
import * as links from '../notifications/links.ts';
import * as notifications from '../notifications/mail.ts';
import { insertContractEvent } from '../orders/repo.ts';
import { updateRentalPeriods } from '../rentals/repo.ts';
import { asContractLanguage } from './render.ts';
import * as repo from './repo.ts';
import type { ContractDetailRow } from './repo.ts';
import { generateToken, tokenExpiry } from './token.ts';

/**
 * What an operator does to a contract that is out for signature: resend it,
 * hand over a link, move its period, void it. Every status write is guarded on
 * the state it expects, so none of them can overwrite a signature that landed
 * between the read and the write — they answer 409 instead.
 */

async function loadOpen(db: Database, id: string): Promise<ContractDetailRow> {
  const contract = await repo.findById(db, id);
  if (!contract) throw notFound('Contract');
  if (contract.status === 'signed') throw conflict('Contract is already signed.');
  if (contract.status === 'voided') throw conflict('Contract is voided.');
  return contract;
}

/**
 * A fresh signing email. Unlike issuance, the operator asked for exactly this,
 * so a failed send is their answer: 502, with the failure also on the order's
 * timeline. The token minted for it simply goes unused.
 */
export async function resend(db: Database, id: string): Promise<void> {
  const contract = await loadOpen(db, id);

  const token = generateToken();
  await repo.createSigningToken(db, {
    id: token.hash,
    contractId: contract.id,
    expiresAt: tokenExpiry(),
  });

  const data = contract.contractData as unknown as ContractData;
  const mail = await notifications.sendContractReady(
    {
      email: data.customer.email,
      customerName: data.customer.fullName,
      contractNumber: contract.number,
      orderNumber: contract.orderNumber,
      signingToken: token.raw,
      language: asContractLanguage(contract.language),
    },
    { db, orderId: contract.orderId },
  );
  if (!mail.sent) {
    throw httpError(
      502,
      `The signing email to ${data.customer.email} could not be sent: ${mail.error}`,
      'mail_failed',
    );
  }

  await db.transaction(async (tx) => {
    const moved = await repo.updateStatusIf(tx, id, repo.SIGNABLE_STATUSES, 'sent', {
      sentAt: new Date(),
    });
    if (!moved) throw conflict('Contract was signed or voided while it was being resent.');
    if (!contract.orderId) return;
    await insertContractEvent(tx, {
      orderId: contract.orderId,
      fromValue: contract.status,
      toValue: 'sent',
      note: `Contract ${contract.number} resent to ${data.customer.email} for signing.`,
    });
  });
}

export async function getSigningLink(db: Database, id: string): Promise<string> {
  const contract = await loadOpen(db, id);

  const token = generateToken();
  await repo.createSigningToken(db, {
    id: token.hash,
    contractId: contract.id,
    expiresAt: tokenExpiry(),
  });

  return links.contractSigningUrl(token.raw);
}

export async function updatePeriodAndResend(
  db: Database,
  id: string,
  from: string,
  to: string,
): Promise<void> {
  const contract = await loadOpen(db, id);

  /* Duration moves with the dates: the contract prints both, and a 30-day span
     beside "3 days" would be a document contradicting itself. */
  const durationDays = periodDays(from, to);
  const data = { ...(contract.contractData as Record<string, unknown>) } as unknown as ContractData;
  data.items = data.items.map((item) => ({
    ...item,
    startDate: from,
    endDate: to,
    duration: durationDays,
    durationUnit: 'day' as const,
  }));

  const updated = await repo.updateDataIfOpen(db, id, data as unknown as Record<string, unknown>);
  if (!updated) throw conflict('Contract was signed or voided before its period could change.');

  /* The order is the source the rentals page and reminder emails read, so its
     lines follow the contract — otherwise the customer signs one period while
     Rent Management chases another. */
  if (contract.orderId) {
    await updateRentalPeriods(db, contract.orderId, from, to, durationDays);
    await insertContractEvent(db, {
      orderId: contract.orderId,
      fromValue: contract.status,
      toValue: contract.status,
      note: `Contract ${contract.number} period updated to ${from} → ${to}.`,
    });
  }

  await resend(db, id);
}

/** Whole days between two YYYY-MM-DD dates — the rental industry's count. */
function periodDays(from: string, to: string): number {
  return Math.max(
    1,
    Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000),
  );
}

export async function voidContract(
  db: Database,
  id: string,
  reason: string,
  adminUserId: string,
): Promise<void> {
  await db.transaction((tx) => voidWithin(tx, id, reason, adminUserId));
}

/**
 * The void itself, for a caller that must stay atomic with it — cancelling a
 * renewal voids its contract and cancels the extension in one transaction.
 * Conditional on the contract still being open: a signature committed a
 * moment earlier wins, and the void answers 409.
 */
export async function voidWithin(
  tx: Transaction,
  id: string,
  reason: string,
  adminUserId: string,
): Promise<void> {
  const contract = await repo.findById(tx, id);
  if (!contract) throw notFound('Contract');

  const voided = await repo.updateStatusIf(tx, id, repo.SIGNABLE_STATUSES, 'voided', {
    voidedAt: new Date(),
    voidedByAdminUserId: adminUserId,
    voidReason: reason,
  });
  if (!voided && contract.status === 'voided') throw conflict('Contract is already voided.');
  if (!voided) throw conflict('Cannot void a signed contract.');

  if (contract.orderId) {
    await insertContractEvent(tx, {
      orderId: contract.orderId,
      fromValue: contract.status,
      toValue: 'voided',
      note: `Contract ${contract.number} voided: ${reason}`,
      actorAdminUserId: adminUserId,
    });
  }
}
