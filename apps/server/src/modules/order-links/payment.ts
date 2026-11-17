/**
 * Starting the Nexi payment from the order link. Docs: docs/code/manual-orders.md.
 *
 * ```
 * one transaction, order row locked (SELECT … FOR UPDATE)
 *   1. isPayable                 pending + unpaid                       else 409
 *   2. assertStartable           customer details complete              else 409 + fields
 *   3. rental signed             latest contract `signed`               else 409 "Sign the contract first."
 *   4. attempt row written       amount = the total read UNDER the lock
 * commit → lock released
 * 5. gateway session (HTTP)     outside the lock; Nexi fails → attempt failed, the result page offers a retry
 * ```
 * `setDiscount` takes the same lock and then looks for an open attempt, so a discount edit
 * either lands before step 4 (the attempt carries the new total) or is refused after it.
 */

import type { Database } from '@mia/db';
import { eq } from '@mia/db';
import { orders } from '@mia/db/schema';
import type { LanguageCode } from '@mia/validators';

import { paymentGateway } from '../../infra/payments/index.ts';
import { conflict, notFound } from '../../shared/http/errors.ts';
import * as contractsRepo from '../contracts/repo.ts';
import { assertStartable } from '../orders/manual/readiness.ts';
import {
  type BeginInput,
  dispatch,
  isPayable,
  openAttempt,
  type PaymentStart,
} from '../payments/start.ts';
import { allowedSteps, assertCanPay, goneError } from './access.ts';
import { redeem } from './redeem.ts';
import { orderHasRental } from './summary.ts';

export async function startLinkPayment(
  db: Database,
  rawToken: string,
  language: LanguageCode,
): Promise<PaymentStart> {
  if (!paymentGateway) throw conflict('Online payment is not available.');
  const link = await redeem(db, rawToken);

  const { opened, input } = await db.transaction(async (tx) => {
    await contractsRepo.lockOrder(tx, link.order.id);
    const order = await tx.query.orders.findFirst({
      where: eq(orders.id, link.order.id),
      with: { items: true },
    });
    if (!order) throw notFound('Order');
    if (order.status !== 'pending') {
      throw goneError(order.paymentStatus === 'paid' ? 'paid' : 'closed');
    }
    if (!isPayable(order)) throw conflict(`Order ${order.number} can no longer be paid online.`);

    const hasRental = orderHasRental(order.items);
    const contract = await contractsRepo.findLatestActiveByOrderId(tx, order.id);
    assertCanPay({
      allowed: allowedSteps({
        steps: link.token.steps as 'sign_pay' | 'sign' | 'pay',
        includeDetails: link.token.includeDetails,
        hasRental,
      }),
      hasRental,
      contractSigned: contract?.status === 'signed',
    });
    assertStartable(order);

    const attemptInput: BeginInput = {
      orderId: order.id,
      orderNumber: order.number,
      rentalExtensionId: null,
      amount: order.total,
      currency: order.currency,
      email: order.email,
      description: `Order ${order.number}`,
      language,
    };
    return { opened: await openAttempt(tx, attemptInput), input: attemptInput };
  });

  return dispatch(db, opened, input);
}
