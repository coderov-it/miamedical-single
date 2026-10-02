import type { Database } from '@mia/db';
import { orderStatusEvents } from '@mia/db/schema';

/**
 * What a quiet send tells its caller. It never throws — a business flow reads
 * `sent` and decides what to claim, e.g. contract issuance writes "sent" on the
 * timeline only when this says so.
 */
export type MailResult = { sent: true } | { sent: false; error: string };

/** Which message failed — stored as the `email` timeline entry's `toValue`. */
export type MailKind =
  | 'order_placed_new_account'
  | 'order_placed_activate_reminder'
  | 'order_placed_confirmation'
  | 'contract_ready'
  | 'contract_signed'
  | 'rental_reminder'
  | 'dispute_alert';

/** The order a message is about: where its failure gets written down. */
export interface OrderTrail {
  db: Database;
  orderId: string | null;
}

/** Long provider bodies are cut — the timeline is read, not parsed. */
const MAX_ERROR_LENGTH = 300;

export function errorText(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  if (text.length <= MAX_ERROR_LENGTH) return text;
  return `${text.slice(0, MAX_ERROR_LENGTH)}…`;
}

/**
 * A failed send on the order's timeline, so the operator sees that the customer
 * was not told rather than assuming they were. No retry: the entry is the whole
 * of it, and the operator resends by hand.
 *
 *   field 'email' · toValue 'contract_ready'
 *   note  "Email to ada@example.com failed (contract CTR-2026-000042 ready): DOMAIN_NOT_VERIFIED"
 *
 * Best effort itself: a database hiccup here is logged, never thrown, because the
 * flow that sent the mail has already committed what it was about.
 */
export async function recordMailFailure(
  trail: OrderTrail,
  kind: MailKind,
  input: { to: string[]; context: string; error: string },
): Promise<void> {
  if (!trail.orderId) return;
  try {
    await trail.db.insert(orderStatusEvents).values({
      orderId: trail.orderId,
      field: 'email',
      fromValue: null,
      toValue: kind,
      note: `Email to ${input.to.join(', ')} failed (${input.context}): ${input.error}`,
    });
  } catch (error) {
    console.error(`[notifications] could not record the ${kind} failure on the order:`, error);
  }
}
