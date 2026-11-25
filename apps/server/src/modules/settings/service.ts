import type { Database } from '@mia/db';
import { eq } from '@mia/db';
import { platformSettings } from '@mia/db/schema';
import {
  DeliveryFeeSettingsSchema,
  NotificationRecipientsSchema,
  type DeliveryFeeSettingsInput,
  type NotificationRecipientsInput,
} from '@mia/validators';
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

export const DELIVERY_FEE_KEY = 'deliveryFee';

const NO_DELIVERY_FEE_SETTINGS: DeliveryFeeSettingsInput = { fallback: null };

/** The fee for products without their own — see docs/code/delivery-fee.md. */
export async function getDeliveryFeeSettings(db: Database): Promise<DeliveryFeeSettingsInput> {
  const row = await db.query.platformSettings.findFirst({
    where: eq(platformSettings.key, DELIVERY_FEE_KEY),
  });
  if (!row) return NO_DELIVERY_FEE_SETTINGS;

  const parsed = v.safeParse(DeliveryFeeSettingsSchema, row.value);
  return parsed.success ? parsed.output : NO_DELIVERY_FEE_SETTINGS;
}

export async function setDeliveryFeeSettings(
  db: Database,
  input: DeliveryFeeSettingsInput,
  adminUserId: string,
): Promise<DeliveryFeeSettingsInput> {
  await db
    .insert(platformSettings)
    .values({ key: DELIVERY_FEE_KEY, value: input, updatedByAdminUserId: adminUserId })
    .onConflictDoUpdate({
      target: platformSettings.key,
      set: { value: input, updatedByAdminUserId: adminUserId, updatedAt: new Date() },
    });

  return input;
}
