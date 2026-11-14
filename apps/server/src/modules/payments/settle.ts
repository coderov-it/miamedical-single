/**
 * Turning the gateway's answer into money on the order. Three callers reach
 * here — the gateway's notification, the result page, and the sweep — and
 * whichever arrives first settles the attempt; the others find it final.
 *
 *   attempt MIA2026001042P1 pending, order pending/unpaid, €30.00
 *   1. ask the gateway          → paid, EXECUTED, VISA, op 8525…
 *   2. attempt → paid           (only one caller wins this)
 *   3. order → paid             payment follows; timeline "Paid online by card (VISA)…"
 *
 *   renewal attempt             → extension renew_pending → active, end date moves
 *   gateway says declined       → attempt failed; order stays unpaid and payable
 *   paid after the order expired → payment recorded anyway, the timeline says to refund
 */

import type { Database } from '@mia/db';

import { paymentGateway } from '../../infra/payments/index.ts';
import * as orderService from '../orders/service.ts';
import * as extensionService from '../rental-extensions/service.ts';
import * as attempts from './attempt-repo.ts';
import type { AttemptRow, AttemptStatus } from './attempt-repo.ts';

/** Settles a pending attempt from the gateway's own answer; returns its status after. */
export async function settle(db: Database, attempt: AttemptRow): Promise<AttemptStatus> {
  if (attempt.status !== 'pending' || !paymentGateway) return attempt.status;

  const outcome = await paymentGateway.outcome(attempt.providerReference);
  if (outcome.status === 'pending') return 'pending';

  const won = await attempts.finish(db, attempt.id, outcome.status, outcome);
  if (!won) {
    const current = await attempts.findByToken(db, attempt.accessToken);
    return current?.status ?? outcome.status;
  }

  if (outcome.status === 'paid') {
    if (outcome.amount && Number(outcome.amount) !== Number(attempt.amount)) {
      console.error(
        `[payments] ${attempt.providerReference} paid ${outcome.amount}, expected ${attempt.amount}.`,
      );
    }
    await applyPaid(db, attempt, outcome.circuit);
  }
  return outcome.status;
}

function paidNote(attempt: AttemptRow, circuit: string | null): string {
  const card = circuit ? ` (${circuit})` : '';
  return `Paid online by card${card}: ${attempt.amount} ${attempt.currency}, ${attempt.provider} ref. ${attempt.providerReference}.`;
}

/**
 * The money is real by now, so nothing here may throw it away: a failure to
 * move the order is logged loudly and left for an operator, never rolled into
 * "not paid".
 */
async function applyPaid(db: Database, attempt: AttemptRow, circuit: string | null) {
  const note = paidNote(attempt, circuit);

  if (attempt.rentalExtensionId) {
    try {
      await extensionService.recordPayment(
        db,
        attempt.rentalExtensionId,
        { method: 'card_online', reference: attempt.providerReference },
        null,
      );
    } catch (error) {
      console.error(`[payments] ${attempt.providerReference} paid, renewal not activated:`, error);
    }
    return;
  }

  const order = await orderService.getById(db, attempt.orderId);
  if (order.status === 'pending') {
    try {
      /* Moves the payment with it — see PAYMENT_FOLLOWS_ORDER. */
      await orderService.moveStatus(db, order.id, 'paid', note, null);
      return;
    } catch (error) {
      console.error(`[payments] ${attempt.providerReference} paid, order not moved:`, error);
    }
  }

  const fresh = await orderService.getById(db, attempt.orderId);
  if (fresh.paymentStatus !== 'unpaid') {
    /* Two gateway pages were open and both were paid: say so where an
       operator reads, rather than keep the second charge silently. */
    console.error(`[payments] ${attempt.providerReference} paid an order already paid.`);
    await attempts.noteOnTimeline(
      db,
      fresh.id,
      fresh.paymentStatus,
      `${note} The order was already paid — refund this one.`,
    );
    return;
  }
  const late =
    fresh.status === 'cancelled' ? ' Received after the order was cancelled — refund it.' : '';
  await orderService.movePaymentStatus(db, fresh.id, 'paid', `${note}${late}`, null);
}

/** The gateway posted a notification: check it is the gateway's own, then settle. */
export async function handleNotice(
  db: Database,
  body: unknown,
): Promise<'settled' | 'ignored' | 'refused'> {
  const notice = paymentGateway?.readNotice(body);
  if (!paymentGateway || !notice) return 'ignored';

  const attempt = await attempts.findByReference(db, paymentGateway.provider, notice.reference);
  if (!attempt) return 'ignored';
  if (attempt.providerSecret && notice.secret !== attempt.providerSecret) {
    console.warn(`[payments] notification for ${notice.reference} with a wrong secret, refused.`);
    return 'refused';
  }
  await settle(db, attempt);
  return 'settled';
}
