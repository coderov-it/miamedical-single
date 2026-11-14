import type { Database } from '@mia/db';

import * as orderService from '../orders/service.ts';
import * as attempts from './attempt-repo.ts';
import { settle } from './settle.ts';

/**
 * The minute tick for online payments. Two jobs, in this order:
 *
 *   1. attempts still pending 20 min after they began — the gateway's page
 *      lives 15 — are asked about once more (a notification may never have
 *      arrived), and closed as `expired` if the gateway still has nothing.
 *   2. unpaid orders past `payment_due_at` with no attempt in flight are
 *      cancelled, which puts their stock back (orders/stock.ts).
 *
 *   order placed 10:00 by a guest, due 11:00, customer never pays
 *   11:00 tick → attempt from 10:01 asked, nothing → expired
 *              → order pending → cancelled, "Not paid in time", stock +1
 *
 * Job 1 runs first so job 2 never cancels an order whose money is arriving.
 */
const TICK_MS = 60_000;
const ATTEMPT_LIFETIME_MS = 20 * 60_000;

export function startPaymentSweep(db: Database): NodeJS.Timeout {
  const tick = () => {
    void run(db);
  };
  tick();
  const timer = setInterval(tick, TICK_MS);
  timer.unref();
  return timer;
}

async function run(db: Database): Promise<void> {
  try {
    await closeStaleAttempts(db);
    await cancelOverdueOrders(db);
  } catch (error) {
    /* A missed tick is an order cancelled a minute late; the next tick retries. */
    console.error('[payments] sweep failed', error);
  }
}

async function closeStaleAttempts(db: Database): Promise<void> {
  const stale = await attempts.findStale(db, new Date(Date.now() - ATTEMPT_LIFETIME_MS));
  for (const attempt of stale) {
    try {
      const status = await settle(db, attempt);
      if (status !== 'pending') continue;
      await attempts.finish(db, attempt.id, 'expired', {
        result: null,
        operationId: null,
        circuit: null,
      });
    } catch (error) {
      console.error(`[payments] could not close ${attempt.providerReference}:`, error);
    }
  }
}

async function cancelOverdueOrders(db: Database): Promise<void> {
  for (const order of await attempts.findOverdueOrders(db, new Date())) {
    if (await attempts.hasPending(db, order.id)) continue;
    try {
      await orderService.moveStatus(
        db,
        order.id,
        'cancelled',
        'Not paid in time — cancelled automatically, stock returned.',
        null,
      );
    } catch (error) {
      console.error(`[payments] could not cancel overdue order ${order.number}:`, error);
    }
  }
}
