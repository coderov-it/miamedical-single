import { and, eq, or, sql } from '@mia/db';
import { adminUsers, notifications } from '@mia/db/schema';
import type { NotificationPayloads } from '@mia/validators';

import {
  ADMIN_EVENT_PERMISSION,
  NOTIFY_CHANNEL,
  type AdminEventType,
  type NotificationEnvelope,
  type NotificationInput,
  type NotificationTx,
} from './types.ts';

/**
 * Writing a notification. Two statements, both inside the caller's transaction:
 * the row, then the `pg_notify` that tells the hub to look at it.
 *
 * That pairing is the whole design. Postgres queues a `NOTIFY` and releases it
 * at COMMIT, so the push cannot outlive a rolled-back order transition and no
 * call site has to remember to fire one "after the await". The alternative — an
 * in-process emitter called by hand at each site — is correct only for as long
 * as every caller keeps getting it right, and is wrong the moment a second
 * worker appears.
 *
 * Failure policy is the inverse of `mail.ts`. Email is best-effort because the
 * order is already recorded; a feed row IS the record, so a failure here fails
 * the transaction that caused it. That is the right answer: it means the fact
 * and the notice of the fact can never disagree.
 */

/** One row, one recipient. Returns the id written, or null if nothing was. */
export async function emit(tx: NotificationTx, input: NotificationInput): Promise<string | null> {
  const [row] = await tx
    .insert(notifications)
    .values({
      audience: input.audience,
      customerAccountId: input.audience === 'customer' ? input.customerAccountId : null,
      adminUserId: input.audience === 'admin' ? input.adminUserId : null,
      type: input.type,
      data: input.data,
      orderId: input.orderId ?? null,
      dedupeKey: input.dedupeKey ?? null,
    })
    /* The sweep passes a dedupeKey; event-driven callers pass none, and a NULL
       never conflicts against the partial unique index, so this clause is inert
       for them rather than a rule they have to opt out of.

       The `where` is not optional and not decoration: inferring a PARTIAL unique
       index requires the statement to repeat the index's own predicate, and
       without it Postgres raises "no unique or exclusion constraint matching the
       ON CONFLICT specification" — at runtime, on the first sweep tick. It must
       stay identical to the predicate on `notifications_dedupe_key`. */
    .onConflictDoNothing({
      target: notifications.dedupeKey,
      where: sql`${notifications.dedupeKey} IS NOT NULL`,
    })
    .returning({ id: notifications.id });

  // Nothing inserted — a repeated sweep tick, or a second worker that lost the
  // race. Say nothing: the notification already exists and was already pushed.
  if (!row) return null;

  const envelope: NotificationEnvelope = {
    id: row.id,
    type: input.type,
    audience: input.audience,
    recipientId: input.audience === 'customer' ? input.customerAccountId : input.adminUserId,
  };

  /* Queued by Postgres, delivered to every listener at COMMIT — or dropped with
     everything else if this transaction rolls back. */
  await tx.execute(sql`select pg_notify(${NOTIFY_CHANNEL}, ${JSON.stringify(envelope)})`);

  return row.id;
}

/**
 * Every operator who may look at the thing being reported, one row each.
 *
 * `N` inserts where `N` is the size of the operations team — currently a
 * handful. A shared row plus a `notification_reads` join table would buy nothing
 * at that size and would leave two mechanisms answering "have I read this". It
 * is the one decision in this module that is clearly wrong at fifty thousand
 * recipients and clearly right at five.
 *
 * `dedupeKeyBase` is suffixed with each recipient's id, because the unique index
 * is global: one base key across five operators would let the first insert win
 * and silently drop the other four.
 *
 * Who hears an event is read from `ADMIN_EVENT_PERMISSION` rather than passed
 * in: a call site that chose its own audience would be one copy-paste away from
 * telling the wrong operators, and the catalogue is where that decision can be
 * reviewed in one sitting.
 */
export async function emitToAdmins<T extends AdminEventType>(
  tx: NotificationTx,
  input: {
    type: T;
    data: NotificationPayloads[T];
    orderId?: string | null;
    dedupeKeyBase?: string | null;
  },
): Promise<number> {
  const recipients = await findAdminsWithPermission(tx, ADMIN_EVENT_PERMISSION[input.type]);

  let written = 0;
  for (const recipient of recipients) {
    const id = await emit(tx, {
      audience: 'admin',
      adminUserId: recipient.id,
      type: input.type,
      data: input.data,
      orderId: input.orderId ?? null,
      dedupeKey: input.dedupeKeyBase ? `${input.dedupeKeyBase}:${recipient.id}` : null,
    });
    if (id) written += 1;
  }
  return written;
}

/**
 * The same integer check `@mia/permissions` runs in memory, expressed in SQL so
 * the fan-out does not load every operator to filter five of them in Node.
 * `is_superuser` short-circuits exactly as `can()` does — it means every code,
 * including ones added to the catalog after the account was made.
 */
async function findAdminsWithPermission(
  tx: NotificationTx,
  permission: number,
): Promise<{ id: string }[]> {
  return tx
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(
      and(
        eq(adminUsers.isActive, true),
        or(eq(adminUsers.isSuperuser, true), sql`${permission} = ANY(${adminUsers.permissions})`),
      ),
    );
}
