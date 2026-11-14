/**
 * What the storefront's payment result page shows, and its "try again".
 * The token in the page's URL is the whole authorisation: it is random, it
 * names one attempt, and it only ever reveals that attempt's order number,
 * amount and outcome.
 */

import type { Database } from '@mia/db';
import { eq } from '@mia/db';
import { orders, rentalExtensions } from '@mia/db/schema';
import type { LanguageCode } from '@mia/validators';

import { notFound } from '../../shared/http/errors.ts';
import * as attempts from './attempt-repo.ts';
import type { AttemptStatus } from './attempt-repo.ts';
import { settle } from './settle.ts';
import { isPayable, type PaymentStart, startForExtension, startForOrder } from './start.ts';

export interface PaymentResultDto {
  status: AttemptStatus;
  kind: 'order' | 'renewal';
  orderNumber: string;
  amount: string;
  currency: string;
  /** Whether "try again" can still work: unpaid, and not expired. */
  canRetry: boolean;
  /** When an unpaid order is cancelled, so the page can say how long is left. */
  paymentDueAt: string | null;
}

async function mustFind(db: Database, token: string) {
  const attempt = await attempts.findByToken(db, token);
  if (!attempt) throw notFound('Payment');
  return attempt;
}

/** Whether the thing this attempt paid for still waits for money. */
async function stillPayable(db: Database, orderId: string, extensionId: string | null) {
  if (extensionId) {
    const extension = await db.query.rentalExtensions.findFirst({
      where: eq(rentalExtensions.id, extensionId),
      columns: { status: true },
    });
    return { payable: extension?.status === 'renew_pending', dueAt: null };
  }
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { status: true, paymentStatus: true, paymentDueAt: true },
  });
  if (!order) return { payable: false, dueAt: null };
  return { payable: isPayable(order), dueAt: order.paymentDueAt };
}

export async function readResult(db: Database, token: string): Promise<PaymentResultDto> {
  const attempt = await mustFind(db, token);

  /* The customer is back from the gateway, often before its notification: ask
     it now rather than show "still processing" for something already decided. */
  let status = attempt.status;
  if (status === 'pending') {
    status = await settle(db, attempt).catch((error: unknown) => {
      console.error(
        `[payments] result page could not ask about ${attempt.providerReference}:`,
        error,
      );
      return 'pending' as const;
    });
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, attempt.orderId),
    columns: { number: true },
  });
  const target = await stillPayable(db, attempt.orderId, attempt.rentalExtensionId);

  return {
    status,
    kind: attempt.rentalExtensionId ? 'renewal' : 'order',
    orderNumber: order?.number ?? '',
    amount: attempt.amount,
    currency: attempt.currency,
    canRetry: status !== 'paid' && target.payable,
    paymentDueAt: target.dueAt?.toISOString() ?? null,
  };
}

/** A new attempt for whatever the old one was paying for. */
export async function retry(
  db: Database,
  token: string,
  language: LanguageCode,
): Promise<PaymentStart | null> {
  const attempt = await mustFind(db, token);
  if (attempt.rentalExtensionId) {
    return startForExtension(db, attempt.rentalExtensionId, language);
  }
  return startForOrder(db, attempt.orderId, language);
}
