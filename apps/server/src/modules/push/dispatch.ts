import type { Database } from '@mia/db';
import { and, eq, isNull, lt, sql } from '@mia/db';
import { notifications } from '@mia/db/schema';
import { mayPush, type NotificationData, type NotificationType } from '@mia/validators';

import { pushSender } from '../../infra/push/index.ts';
import { deviceLanguage } from './language.ts';
import { buildAlert, tapRoute } from './message.ts';
import * as repo from './repo.ts';

/**
 * Turning a committed notification row into notifications on phones.
 *
 * The table is its own outbox. `pushed_at` is claimed with a conditional UPDATE,
 * so a row is sent exactly once no matter how many processes are listening, and
 * anything left unclaimed is retried by the sweep. There is no queue, because
 * there is nothing a queue would add that the row does not already record.
 *
 * Failure policy sits between the other two channels. A feed row IS the record,
 * so `write.ts` fails the transaction when it cannot be written; an email is
 * best-effort because the order is already stored. A push is a nudge about a row
 * that is already committed and already readable, so a failure is logged and the
 * claim stands — retrying forever would mean a customer whose phone was off for a
 * week getting a week of stale lock-screen alerts the moment it came back.
 */

/** How far back the sweep looks. Older than this, a push has stopped being news. */
const RETRY_WINDOW_HOURS = 6;

/** Enough to drain a backlog, small enough not to hold a connection all day. */
const SWEEP_BATCH = 100;

interface ClaimedRow {
  id: string;
  type: string;
  data: NotificationData;
  customerAccountId: string;
}

/**
 * Claims one row, or returns null because somebody else already has it.
 *
 * This UPDATE is the entire concurrency design. Postgres takes a row lock for the
 * duration of the statement, so of two workers racing on the same id exactly one
 * matches `pushed_at IS NULL` and the other matches nothing — no advisory lock,
 * no leader election, and no decision about which process runs the dispatcher.
 *
 * The mark is written BEFORE the send rather than after. A crash between the two
 * therefore drops a push rather than repeating one, which is the right way round:
 * a missed notification is invisible, while a duplicate lock-screen alert is the
 * kind of thing people uninstall an app over.
 */
async function claim(db: Database, id: string): Promise<ClaimedRow | null> {
  const [row] = await db
    .update(notifications)
    .set({ pushedAt: sql`now()` })
    .where(
      and(
        eq(notifications.id, id),
        isNull(notifications.pushedAt),
        eq(notifications.audience, 'customer'),
      ),
    )
    .returning({
      id: notifications.id,
      type: notifications.type,
      data: notifications.data,
      customerAccountId: notifications.customerAccountId,
    });

  if (!row?.customerAccountId) return null;
  return { ...row, customerAccountId: row.customerAccountId };
}

/**
 * One notification, every device its owner holds.
 *
 * Called from the hub the instant the row commits, and again from the sweep for
 * anything the hub missed. Both paths end here, and the claim makes running both
 * harmless.
 */
export async function dispatch(db: Database, id: string): Promise<void> {
  const row = await claim(db, id);
  if (!row) return;

  const settings = await repo.settingsFor(db, row.customerAccountId);
  /* The account was deleted between the notification and this read. The cascade
     has already taken its devices, so there is nothing to send to. */
  if (!settings) return;

  if (!mayPush(row.type, settings.preferences)) return;

  const devices = await repo.devicesFor(db, row.customerAccountId);
  if (devices.length === 0) return;

  const route = tapRoute(row.type as NotificationType, row.data);
  const data: Record<string, string> = {
    notificationId: row.id,
    type: row.type,
    ...(route ? { route } : {}),
  };

  for (const device of devices) {
    const alert = buildAlert({
      type: row.type as NotificationType,
      data: row.data,
      appVersion: device.appVersion,
      language: deviceLanguage(device.language, settings.language),
    });

    const result = await pushSender.send({ token: device.token, alert, data });
    if (result.ok) continue;

    /* The only self-healing this table gets. FCM never volunteers that an app was
       uninstalled — it says so when we try to use the token, and this is the one
       moment we can act on it. */
    if (result.deadToken) {
      await repo.deleteByToken(db, device.token);
      continue;
    }

    console.error('[push] send failed', { notificationId: row.id, reason: result.reason });
  }
}

/**
 * Everything the live path missed.
 *
 * `LISTEN` has no backlog: a notification raised while this process was
 * restarting was delivered to nobody and no error was raised anywhere. The feed
 * survives that because the next screen load re-reads the table — a closed app
 * has no next screen load, so without this a push raised during a deploy is
 * simply lost.
 *
 * Bounded by `RETRY_WINDOW_HOURS` at the old end, because an alert about
 * something that happened yesterday is worse than no alert. Those rows are left
 * claimed-but-unsent rather than marked, which keeps `pushed_at IS NULL` honest
 * as "never attempted".
 */
export async function sweepPending(db: Database): Promise<number> {
  const pending = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        isNull(notifications.pushedAt),
        eq(notifications.audience, 'customer'),
        sql`${notifications.createdAt} > now() - ${`${RETRY_WINDOW_HOURS} hours`}::interval`,
      ),
    )
    .limit(SWEEP_BATCH);

  for (const row of pending) await dispatch(db, row.id);
  return pending.length;
}

/**
 * Retires rows the window has passed by, so the partial index stays small and the
 * sweep does not re-scan the same stale backlog on every tick.
 *
 * Marked with the timestamp they would have had, not with a tombstone: the column
 * answers "did we attempt this", and an expired row was attempted and judged too
 * old. The log line is what distinguishes the two cases when somebody asks.
 */
export async function expireStale(db: Database): Promise<number> {
  const rows = await db
    .update(notifications)
    .set({ pushedAt: sql`now()` })
    .where(
      and(
        isNull(notifications.pushedAt),
        eq(notifications.audience, 'customer'),
        lt(notifications.createdAt, sql`now() - ${`${RETRY_WINDOW_HOURS} hours`}::interval`),
      ),
    )
    .returning({ id: notifications.id });

  if (rows.length > 0) console.warn(`[push] expired ${rows.length} unsent notification(s)`);
  return rows.length;
}
