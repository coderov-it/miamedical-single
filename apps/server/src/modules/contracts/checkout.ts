import type { Database, Transaction } from '@mia/db';

import * as notifications from '../notifications/mail.ts';
import { insertContractEvent } from '../orders/repo.ts';
import { type ContractTerms, draftContract } from './draft.ts';
import { contractRow } from './issue.ts';
import { TEMPLATE_MAP } from './render.ts';
import * as repo from './repo.ts';

/**
 * The contract signed on the checkout's contract step, before the order exists.
 * The emailed signing link (`signing.ts`) stays for what checkout does not
 * cover — the admin's "Generate contract", manual contracts and renewals.
 *
 *   1. step 3 opens       POST /api/orders/contract-preview → `renderDraft`
 *                         numbered BOZZA / DRAFT, nothing written
 *   2. "Firma e continua" signature + consent kept in the page, not sent
 *   3. "Invia"            POST /api/orders { …, contractSignature }
 *                         ┌ one transaction ──────────────────────────────┐
 *                         │ order + lines              (orders/repo)      │
 *                         │ contract CTR-…, born `signed`  `issueSigned`  │
 *                         │ timeline "signed"                             │
 *                         └───────────────────────────────────────────────┘
 *                         → after commit: "contratto firmato" email
 *
 * The preview and the stored contract are built from the same request by the
 * same `draftContract`, so what was signed is what is stored — only the number
 * changes, from BOZZA to the one the sequence draws.
 */

/** The contract the terms would produce, as HTML, for reading before signing. */
export function renderDraft(terms: ContractTerms): string {
  const { variant, data } = draftContract(terms, null);
  return TEMPLATE_MAP[variant.variant](data);
}

export interface CheckoutSignature {
  imageDataUrl: string;
  ipAddress: string;
  userAgent: string;
}

/** Runs inside the placement transaction: the order and its signed contract commit together. */
export async function issueSigned(
  tx: Transaction,
  order: { id: string; number: string },
  terms: ContractTerms,
  signature: CheckoutSignature,
): Promise<{ id: string; number: string }> {
  const signedAt = new Date();
  const contract = await repo.create(tx, {
    ...contractRow(order.id, terms),
    signed: {
      signedAt,
      signatureData: { ...signature, consentedAt: signedAt.toISOString(), channel: 'checkout' },
    },
  });
  await insertContractEvent(tx, {
    orderId: order.id,
    fromValue: null,
    toValue: 'signed',
    note: `Contract ${contract.number} signed by the customer at checkout.`,
  });
  return contract;
}

/** The signed copy's receipt. After commit, and a failed send never unsigns anything. */
export async function sendSignedReceipt(
  db: Database,
  order: { id: string; number: string },
  contract: { number: string },
  terms: ContractTerms,
): Promise<void> {
  const { variant } = draftContract(terms, null);
  await notifications.sendContractSigned(
    {
      email: terms.email,
      customerName: terms.customerName,
      contractNumber: contract.number,
      orderNumber: order.number,
      language: variant.language,
    },
    { db, orderId: order.id },
  );
}
