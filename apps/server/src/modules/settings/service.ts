import type { Database } from '@mia/db';
import { eq } from '@mia/db';
import { platformSettings } from '@mia/db/schema';
import { NotificationRecipientsSchema, type NotificationRecipientsInput } from '@mia/validators';
import * as v from 'valibot';

/**
 * Operator-editable platform settings.
 *
 * Flat like `modules/terms`: one table, one key so far, no mapping worth a file.
 * The value column is jsonb, so every read parses it through the key's schema
 * rather than casting — a hand-edited row, or one written by an older version of
 * this code, must degrade to the default instead of reaching a caller as a shape
 * it does not expect.
 */

export const NOTIFICATION_RECIPIENTS_KEY = 'notificationRecipients';

const NO_RECIPIENTS: NotificationRecipientsInput = { emails: [] };

export async function getNotificationRecipients(
  db: Database,
): Promise<NotificationRecipientsInput> {
  const row = await db.query.platformSettings.findFirst({
    where: eq(platformSettings.key, NOTIFICATION_RECIPIENTS_KEY),
  });
  if (!row) return NO_RECIPIENTS;

  const parsed = v.safeParse(NotificationRecipientsSchema, row.value);
  return parsed.success ? parsed.output : NO_RECIPIENTS;
}

export async function setNotificationRecipients(
  db: Database,
  input: NotificationRecipientsInput,
  adminUserId: string,
): Promise<NotificationRecipientsInput> {
  await db
    .insert(platformSettings)
    .values({
      key: NOTIFICATION_RECIPIENTS_KEY,
      value: input,
      updatedByAdminUserId: adminUserId,
    })
    .onConflictDoUpdate({
      target: platformSettings.key,
      set: { value: input, updatedByAdminUserId: adminUserId, updatedAt: new Date() },
    });

  return input;
}
