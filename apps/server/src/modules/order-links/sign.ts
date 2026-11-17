/**
 * The contract at the order link: read it, then sign it. Docs: docs/code/manual-orders.md.
 *
 * ```
 * preview   details complete            → renderDraft(termsFromOrder), "BOZZA", nothing written
 *           details missing             → 409 + fields (the contract states the customer)
 * sign      expectedTotal 160.00 = order total 160.00
 *           ┌ one transaction, order row locked ──────────────────────────┐
 *           │ re-check: still pending, not signed, details complete, total │
 *           │ issueSigned(…, 'order_link')   contract CTR-…, born signed   │
 *           │ feed rows: operators with contract:read + the creating agent │
 *           └──────────────────────────────────────────────────────────────┘
 *           → after commit: signed receipt email
 *           order total changed since the preview (discount edited)  → 409, nothing signed
 * ```
 */

import type { Database } from '@mia/db';
import { eq } from '@mia/db';
import { orders } from '@mia/db/schema';
import type { OrderLinkSignInput } from '@mia/validators';

import { notFound } from '../../shared/http/errors.ts';
import { issueSigned, renderDraft, sendSignedReceipt } from '../contracts/checkout.ts';
import * as contractsRepo from '../contracts/repo.ts';
import { termsFromOrder } from '../contracts/service.ts';
import {
  allowedSteps,
  assertCanSign,
  assertDetailsComplete,
  assertSameTotal,
  goneError,
} from './access.ts';
import { emitContractSigned } from './notify.ts';
import { type LinkContext, redeem } from './redeem.ts';
import { orderHasRental } from './summary.ts';

function allowedOf(link: LinkContext) {
  return allowedSteps({
    steps: link.token.steps as 'sign_pay' | 'sign' | 'pay',
    includeDetails: link.token.includeDetails,
    hasRental: orderHasRental(link.order.items),
  });
}

export async function previewLinkContract(
  db: Database,
  rawToken: string,
): Promise<{ html: string; total: string }> {
  const link = await redeem(db, rawToken);
  assertCanSign({ allowed: allowedOf(link), contractSigned: link.contractStatus === 'signed' });
  assertDetailsComplete(link.order);
  return { html: renderDraft(await termsFromOrder(db, link.order.id)), total: link.order.total };
}

export async function signFromLink(
  db: Database,
  rawToken: string,
  input: OrderLinkSignInput,
  context: { ipAddress: string; userAgent: string },
): Promise<void> {
  const link = await redeem(db, rawToken);
  const allowed = allowedOf(link);

  const signed = await db.transaction(async (tx) => {
    await contractsRepo.lockOrder(tx, link.order.id);
    const order = await tx.query.orders.findFirst({ where: eq(orders.id, link.order.id) });
    if (!order) throw notFound('Order');
    if (order.status !== 'pending')
      throw goneError(order.paymentStatus === 'paid' ? 'paid' : 'closed');

    const contract = await contractsRepo.findLatestActiveByOrderId(tx, order.id);
    assertCanSign({ allowed, contractSigned: contract?.status === 'signed' });
    assertDetailsComplete(order);
    assertSameTotal(input.expectedTotal, order.total);

    /* Built under the lock, from what is committed now: the terms are the amount charged. */
    const terms = await termsFromOrder(tx, order.id);
    const issued = await issueSigned(
      tx,
      order,
      terms,
      {
        imageDataUrl: input.signatureDataUrl,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
      'order_link',
    );
    await emitContractSigned(tx, {
      orderId: order.id,
      contractNumber: issued.number,
      orderNumber: order.number,
      customerName: terms.customerName,
      createdByAdminUserId: order.createdByAdminUserId,
    });
    return { order, contract: issued, terms };
  });

  await sendSignedReceipt(db, signed.order, signed.contract, signed.terms);
}
