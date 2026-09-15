import type { Transaction } from '@mia/db';
import { P } from '@mia/permissions';
import type { NotificationAudience, NotificationPayloads, NotificationType } from '@mia/validators';

/**
 * The shapes the live pipeline is written against. What each event *says* lives
 * in `@mia/validators/notification`; what happens to it lives here.
 */

/**
 * A database handle inside an open transaction.
 *
 * `emit` deliberately accepts nothing else. Postgres holds a `NOTIFY` until the
 * transaction commits and discards it on rollback, which is the entire reason
 * this pipeline needs no delivery guarantees of its own — and a caller that
 * emitted outside a transaction would quietly give that up. Typing the
 * parameter as the transaction handle is what stops that being possible rather
 * than merely discouraged.
 */
export type NotificationTx = Transaction;

/**
 * The `pg_notify` channel. One channel for every notification: the envelope
 * carries the recipient, and a channel per recipient would mean a `LISTEN` per
 * customer.
 */
export const NOTIFY_CHANNEL = 'mia_notification';

/**
 * What travels over `pg_notify` — routing only, never content.
 *
 * `NOTIFY` payloads are capped at 8000 bytes and the error is raised *at
 * commit*, so a fat payload would turn a notification into a failed order
 * transition. These four short fields cannot approach the cap. The hub reads the
 * row itself, and only when somebody is listening for it.
 */
export interface NotificationEnvelope {
  id: string;
  type: string;
  audience: NotificationAudience;
  recipientId: string;
}

/** One row to write, as a caller describes it. */
export type NotificationInput<T extends NotificationType = NotificationType> = {
  type: T;
  data: NotificationPayloads[T];
  orderId?: string | null;
  /** Set by the sweep only — see `sweep.ts`. */
  dedupeKey?: string | null;
} & (
  { audience: 'customer'; customerAccountId: string } | { audience: 'admin'; adminUserId: string }
);

/**
 * Which permission an operator must hold to be told about each admin-facing
 * event.
 *
 * Reusing the existing read grants rather than minting notification codes of
 * their own: being told an order arrived and being allowed to open it are the
 * same question, and a separate code would let the two disagree — an operator
 * alerted to something they cannot look at, or looking after nobody told them.
 *
 * `satisfies` rather than an annotation, so an event added to the catalogue
 * without deciding who hears it does not silently reach nobody.
 */
export const ADMIN_EVENT_PERMISSION = {
  'order.placed': P.ORDER_READ,
  'order.link_disputed': P.ORDER_DISPUTE_READ,
  'contract.signed': P.CONTRACT_READ,
  'contract.unsigned_blocking': P.CONTRACT_READ,
  'rental.ending_soon': P.RENTAL_READ,
} as const satisfies Partial<Record<NotificationType, number>>;

export type AdminEventType = keyof typeof ADMIN_EVENT_PERMISSION;
