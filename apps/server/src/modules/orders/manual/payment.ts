/**
 * Recording money taken outside the gateway for a manual order.
 * Docs: docs/code/manual-orders.md (worked example (b)).
 *
 * ```
 * pending/unpaid, details complete, sale          → paid/paid, "Payment recorded: bank transfer, ref. CRO 1234."
 * pending, codice fiscale missing                 → 409 "Complete the customer details first." fields listed
 * pending rental, contract not signed             → 409 from moveStatus (assertContractSigned)
 * already paid or cancelled                       → 409
 * ```
 */

import type { Database } from '@mia/db';

import type { SessionUser } from '../../../shared/http/context.ts';
import { conflict } from '../../../shared/http/errors.ts';
import { getById, moveStatus } from '../service.ts';
import type { AdminOrderAggregate } from '../types.ts';
import { type RecordPaymentInput, paymentNote } from './payment-note.ts';
import { assertStartable } from './readiness.ts';

/**
 * `pending → paid` through `moveStatus`, which runs the signed-contract check, moves
 * the status, then the payment status (`PAYMENT_FOLLOWS_ORDER`), writing both events
 * with the note. Stock is already held since creation, so nothing more is taken.
 */
export async function recordPayment(
  db: Database,
  id: string,
  input: RecordPaymentInput,
  actor: SessionUser,
): Promise<AdminOrderAggregate> {
  const order = await getById(db, id);
  if (order.status !== 'pending') {
    throw conflict(`This order is ${order.status}, so a payment cannot be recorded on it.`);
  }
  assertStartable(order);
  return moveStatus(db, id, 'paid', paymentNote(input), actor);
}
