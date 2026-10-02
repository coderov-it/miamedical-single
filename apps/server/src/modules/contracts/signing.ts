import type { Database, Transaction } from '@mia/db';
import type { ContractData } from '@mia/templates';

import { conflict, httpError, notFound } from '../../shared/http/errors.ts';
import * as notifications from '../notifications/mail.ts';
import { emit, emitToAdmins } from '../notifications/write.ts';
import { insertContractEvent } from '../orders/repo.ts';
import { activateForContract } from '../rental-extensions/activate.ts';
import { accountForOrder } from './issue.ts';
import { asContractLanguage, TEMPLATE_MAP } from './render.ts';
import * as repo from './repo.ts';
import type { ContractDetailRow } from './repo.ts';
import { hashToken, signingRefusal } from './token.ts';
import type { SigningRefusal } from './token.ts';

/**
 * The customer's side of a contract. Opening the link never spends it; only a
 * submitted signature does, and it does so in the same transaction that saves
 * the signature — see docs/code/contracts.md "Signing".
 */

function refusalError(refusal: SigningRefusal) {
  if (refusal === 'signed') return conflict('Contract is already signed.');
  if (refusal === 'voided') return conflict('Contract has been voided.');
  if (refusal === 'used') return httpError(410, 'This signing link has already been used.');
  return httpError(410, 'This signing link has expired.');
}

async function findUsable(db: Database, hash: string): Promise<ContractDetailRow> {
  const result = await repo.findSigningToken(db, hash);
  if (!result) throw notFound('Signing token');
  const refusal = signingRefusal(result.token, result.contract.status, new Date());
  if (refusal) throw refusalError(refusal);
  return result.contract;
}

/** GET of the link: the rendered contract, and `viewed` from a state before it. */
export async function loadForSigning(
  db: Database,
  rawToken: string,
): Promise<{ contract: ContractDetailRow; html: string }> {
  const contract = await findUsable(db, hashToken(rawToken));
  await repo.markViewed(db, contract.id);

  const render = TEMPLATE_MAP[contract.variant];
  const html = render(contract.contractData as unknown as ContractData);
  return { contract, html };
}

/**
 * The signature, once. Everything it causes commits together or not at all:
 *
 *   1. spend the token          only if unspent and unexpired
 *   2. contract → signed        only if still generated / sent / viewed
 *   3. timeline "signed", operator + customer feed rows
 *   4. a renewal's extension → active, order end date moved
 *
 * Either guard matching no row means another request got there first: the
 * transaction rolls back and the caller gets the reason. Any other failure
 * also rolls back, leaving the token usable for a retry. The receipt email
 * goes after commit — a failed send cannot unsign anything.
 */
export async function sign(
  db: Database,
  rawToken: string,
  signatureDataUrl: string,
  ipAddress: string,
  userAgent: string,
): Promise<ContractDetailRow> {
  const hash = hashToken(rawToken);
  const contract = await findUsable(db, hash);
  const signerAccountId = await accountForOrder(db, contract.orderId);

  await db.transaction(async (tx) => {
    const consumedFor = await repo.consumeSigningToken(tx, hash);
    if (consumedFor !== contract.id) throw await currentRefusal(tx, hash);

    const signed = await repo.updateStatusIf(tx, contract.id, repo.SIGNABLE_STATUSES, 'signed', {
      signedAt: new Date(),
      signatureData: { imageDataUrl: signatureDataUrl, ipAddress, userAgent },
    });
    if (!signed) throw await currentRefusal(tx, hash);

    await recordSignature(tx, contract, signerAccountId);
  });

  const data = contract.contractData as unknown as ContractData;
  await notifications.sendContractSigned(
    {
      email: data.customer.email,
      customerName: data.customer.fullName,
      contractNumber: contract.number,
      orderNumber: contract.orderNumber,
      language: asContractLanguage(contract.language),
    },
    { db, orderId: contract.orderId },
  );

  const fresh = await repo.findById(db, contract.id);
  if (!fresh) throw notFound('Contract');
  return fresh;
}

/** Re-reads, inside the losing transaction, what beat this request to it. */
async function currentRefusal(tx: Transaction, hash: string) {
  const result = await repo.findSigningToken(tx, hash);
  if (!result) return notFound('Signing token');
  const refusal = signingRefusal(result.token, result.contract.status, new Date());
  return refusalError(refusal ?? 'signed');
}

async function recordSignature(
  tx: Transaction,
  contract: ContractDetailRow,
  signerAccountId: string | null,
): Promise<void> {
  const data = contract.contractData as unknown as ContractData;
  const payload = {
    contractNumber: contract.number,
    orderNumber: contract.orderNumber,
    customerName: data.customer.fullName,
  };

  /* The status machine will not move this order to `paid` until the contract
     reads `signed`, so the operator's notice commits with the signature. */
  await emitToAdmins(tx, { type: 'contract.signed', orderId: contract.orderId, data: payload });
  if (signerAccountId) {
    await emit(tx, {
      audience: 'customer',
      customerAccountId: signerAccountId,
      type: 'contract.signed',
      orderId: contract.orderId,
      data: payload,
    });
  }

  if (!contract.orderId) return;
  await insertContractEvent(tx, {
    orderId: contract.orderId,
    fromValue: contract.status,
    toValue: 'signed',
    note: `Contract ${contract.number} signed by the customer.`,
  });
  /* A renewal contract signed is the extension made real: the order's end
     date moves now, in this transaction, not when it was paid. */
  await activateForContract(tx, contract.id);
}
