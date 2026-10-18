import type { Database } from '@mia/db';
import type { PlaceExtensionInput } from '@mia/validators';

import { conflict, httpError } from '../../shared/http/errors.ts';
import { issueSigned, renderDraft, sendSignedReceipt } from '../contracts/checkout.ts';
import { assertNoLiveContract } from '../contracts/issue.ts';
import * as contractRepo from '../contracts/repo.ts';
import { type RenewalSpan, termsFromOrder } from '../contracts/service.ts';
import { emitToAdmins } from '../notifications/write.ts';
import type { RentalExtensionDto } from './dto.ts';
import { toExtension } from './mapper.ts';
import { extensionOptions } from './quote.ts';
import * as repo from './repo.ts';
import { BLOCK_MESSAGES, type Loaded, load } from './service.ts';
import type { ExtensionOption } from './types.ts';

/**
 * Renewing from the customer's account — the server half of the renewal modal.
 * Worked example: docs/code/rental-extensions.md § Renewed from the account.
 *
 *   step 1 "Durata"      GET  /api/customer/rental-extensions/:number   options + prices
 *   step 2 "Contratto"   POST …/:number/contract-preview { days }      BOZZA, nothing written
 *   step 3 "Conferma"    POST …/:number { days, contractSignature }
 *                        ┌ one transaction ─────────────────────────────────┐
 *                        │ order locked, no unsigned contract before it     │
 *                        │ renewal contract CTR-…, born `signed`            │
 *                        │ rental_extensions row, renew_pending → contract  │
 *                        └──────────────────────────────────────────────────┘
 *                        → after commit: "contratto firmato" email
 *   then                 operator records payment → active (service.recordPayment)
 *
 * The preview and the stored contract are built by the same `termsFromOrder`
 * from the same quote, so what was signed is what is stored.
 */

export interface SignatureContext {
  ipAddress: string | null;
  userAgent: string | null;
}

/** The offered length the customer picked, priced — or why it cannot be had. */
async function quote(
  db: Database,
  orderId: string,
  days: number,
): Promise<{ loaded: Loaded; option: ExtensionOption; span: RenewalSpan }> {
  const loaded = await load(db, orderId);
  if (loaded.blockedBy) throw conflict(BLOCK_MESSAGES[loaded.blockedBy]);
  if (!loaded.endDate) throw conflict('This rental has no end date to extend from.');

  const options = extensionOptions(loaded.lines, loaded.endDate, 'it');
  const option = options.find((candidate) => candidate.days === days);
  if (!option) {
    const message = `Pick one of the offered lengths: ${options.map((o) => o.days).join(', ')} days.`;
    throw httpError(422, message, 'unprocessable_entity', { fields: { days: message } });
  }
  const span = {
    fromDate: option.fromDate,
    toDate: option.toDate,
    days: option.days,
    lineAmounts: option.lineAmounts,
  };
  return { loaded, option, span };
}

/** The renewal contract the modal's step 2 shows, as HTML. Writes nothing. */
export async function previewRenewal(
  db: Database,
  orderId: string,
  days: number,
): Promise<{ html: string }> {
  const { span } = await quote(db, orderId, days);
  return { html: renderDraft(await termsFromOrder(db, orderId, span)) };
}

/**
 * The modal's "Conferma": the extension and its signed contract, together. The
 * extension waits for payment like any other; it differs only in that paying
 * it activates it at once, because the paperwork is already done.
 */
export async function placeRenewal(
  db: Database,
  orderId: string,
  input: PlaceExtensionInput,
  customerId: string,
  context: SignatureContext,
): Promise<RentalExtensionDto> {
  const { loaded, option, span } = await quote(db, orderId, input.days);
  const terms = await termsFromOrder(db, orderId, span);
  const { order } = loaded;

  const placed = await db.transaction(async (tx) => {
    await contractRepo.lockOrder(tx, orderId);
    await assertNoLiveContract(tx, orderId);
    /* Read before the lock; a second tab may have renewed since. The partial
       unique index would refuse it too, but as a 500 instead of a reason. */
    if (await repo.hasOpen(tx, orderId)) throw conflict(BLOCK_MESSAGES.open);

    const contract = await issueSigned(
      tx,
      order,
      terms,
      {
        imageDataUrl: input.contractSignature.signatureDataUrl,
        ipAddress: context.ipAddress ?? 'unknown',
        userAgent: context.userAgent ?? 'unknown',
      },
      'account_renewal',
    );
    const id = await repo.insert(tx, {
      orderId,
      fromDate: span.fromDate,
      toDate: span.toDate,
      days: span.days,
      amount: option.amount,
      currency: order.currency,
      lineAmounts: span.lineAmounts,
      requestedByCustomerAccountId: customerId,
      contractId: contract.id,
    });
    await repo.insertEvent(tx, {
      orderId,
      fromValue: null,
      toValue: 'renew_pending',
      note: `Extension requested by the customer with contract ${contract.number} signed: +${span.days} days (${span.fromDate} → ${span.toDate}), ${option.amount} ${order.currency}. Waiting for payment.`,
      actorCustomerAccountId: customerId,
    });
    await emitToAdmins(tx, {
      type: 'rental.extension_requested',
      orderId,
      data: {
        orderNumber: order.number,
        days: span.days,
        amount: option.amount,
        currency: order.currency,
        customerName: `${order.firstName ?? ''} ${order.lastName ?? ''}`.trim() || '—',
      },
    });
    return { id, contract };
  });

  await sendSignedReceipt(db, order, placed.contract, terms);
  const row = await repo.findById(db, placed.id);
  if (!row) throw conflict('The extension was placed but could not be read back. Reload the page.');
  return toExtension(row);
}
