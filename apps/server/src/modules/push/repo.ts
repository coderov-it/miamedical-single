import type { Database } from '@mia/db';
import { and, eq, sql } from '@mia/db';
import { customerAccounts, pushDevices } from '@mia/db/schema';
import type { DevicePlatform, NotificationPreferences } from '@mia/validators';
import type { LanguageCode } from '@mia/validators/language';

/**
 * Reads and writes over `push_devices`, plus the two customer columns the
 * dispatcher needs alongside them.
 *
 * Every read is scoped to one account, for the same reason the notification repo
 * is: there is no caller for "every device" and its existence would be one
 * forgotten `WHERE` from pushing an order update to the entire customer base.
 */

export interface DeviceRow {
  id: string;
  token: string;
  platform: DevicePlatform;
  language: LanguageCode | null;
  appVersion: string;
}

export interface RegisterInput {
  customerAccountId: string;
  token: string;
  platform: DevicePlatform;
  language?: LanguageCode | undefined;
  appVersion: string;
}

/**
 * Register or refresh. Called on every launch, so it must be cheap and
 * idempotent rather than merely tolerant of repeats.
 *
 * The conflict target is the token alone. A phone that changes hands — sold,
 * lent, a second person signing into the family tablet — keeps its token and
 * arrives here under a new account; taking `customerAccountId` from the excluded
 * row is what moves the device rather than leaving both accounts pushing to it.
 *
 * That also means sign-out is the ONLY thing that detaches a device, which is why
 * `unregister` has to happen before the session is cleared. A token orphaned on
 * the previous owner would keep delivering their orders to somebody else's
 * handset until FCM eventually reported it dead — and it never would, because the
 * app is still installed.
 */
export async function register(db: Database, input: RegisterInput): Promise<void> {
  await db
    .insert(pushDevices)
    .values({
      customerAccountId: input.customerAccountId,
      token: input.token,
      platform: input.platform,
      language: input.language ?? null,
      appVersion: input.appVersion,
    })
    .onConflictDoUpdate({
      target: pushDevices.token,
      set: {
        customerAccountId: input.customerAccountId,
        platform: input.platform,
        language: input.language ?? null,
        appVersion: input.appVersion,
        lastSeenAt: sql`now()`,
      },
    });
}

/**
 * Scoped to the account that is asking, so a leaked token cannot be used to
 * silence somebody else's phone. A token that is not theirs simply deletes
 * nothing — the same answer as a token that was already gone, which is what
 * sign-out after a reinstall looks like.
 */
export async function unregister(
  db: Database,
  customerAccountId: string,
  token: string,
): Promise<void> {
  await db
    .delete(pushDevices)
    .where(and(eq(pushDevices.customerAccountId, customerAccountId), eq(pushDevices.token, token)));
}

/** Removed because FCM said the token is gone for good — see `DEAD_TOKEN_CODES`. */
export async function deleteByToken(db: Database, token: string): Promise<void> {
  await db.delete(pushDevices).where(eq(pushDevices.token, token));
}

export async function devicesFor(db: Database, customerAccountId: string): Promise<DeviceRow[]> {
  return db
    .select({
      id: pushDevices.id,
      token: pushDevices.token,
      platform: pushDevices.platform,
      language: pushDevices.language,
      appVersion: pushDevices.appVersion,
    })
    .from(pushDevices)
    .where(eq(pushDevices.customerAccountId, customerAccountId));
}

export interface RecipientSettings {
  language: LanguageCode | null;
  preferences: NotificationPreferences;
}

/**
 * The account's own two inputs to a push decision, read once per notification
 * rather than once per device.
 */
export async function settingsFor(
  db: Database,
  customerAccountId: string,
): Promise<RecipientSettings | undefined> {
  const [row] = await db
    .select({
      language: customerAccounts.language,
      preferences: customerAccounts.notificationPreferences,
    })
    .from(customerAccounts)
    .where(eq(customerAccounts.id, customerAccountId))
    .limit(1);

  if (!row) return undefined;
  return { language: row.language, preferences: row.preferences ?? {} };
}

/** The preference screen's write. Partial — unnamed categories are left alone. */
export async function savePreferences(
  db: Database,
  customerAccountId: string,
  next: NotificationPreferences,
): Promise<NotificationPreferences> {
  const [row] = await db
    .update(customerAccounts)
    .set({ notificationPreferences: next })
    .where(eq(customerAccounts.id, customerAccountId))
    .returning({ preferences: customerAccounts.notificationPreferences });

  return row?.preferences ?? {};
}
