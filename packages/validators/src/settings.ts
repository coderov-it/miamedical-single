import * as v from 'valibot';

import { EmailSchema, MoneySchema } from './common.ts';

/**
 * Operator-editable platform settings. Each key in `platform_settings` has its
 * value shape declared here, so the jsonb column is validated at exactly one
 * place rather than trusted at every read.
 */

/**
 * Who receives platform-level alerts — currently the "I did not place this order"
 * reports, and whatever notification comes next.
 *
 * Capped at ten: this is an operations mailing list, and a longer one is a sign
 * somebody wants a distribution group rather than a settings field. Deduplicated
 * on save because `EmailSchema` lowercases, so two rows that differ only in case
 * would otherwise both survive and mail the same person twice.
 */
export const NotificationRecipientsSchema = v.pipe(
  v.strictObject({
    emails: v.pipe(v.array(EmailSchema), v.maxLength(10, 'At most 10 recipients.')),
  }),
  v.transform((input) => ({ emails: [...new Set(input.emails)] })),
);

export type NotificationRecipientsInput = v.InferOutput<typeof NotificationRecipientsSchema>;

/**
 * Home-delivery fee for products that carry none of their own. `null` = no
 * fallback, so such a delivery stays unpriced. See docs/code/delivery-fee.md.
 */
export const DeliveryFeeSettingsSchema = v.object({ fallback: v.nullable(MoneySchema) });

export type DeliveryFeeSettingsInput = v.InferOutput<typeof DeliveryFeeSettingsSchema>;

/** A manual database backup: the name becomes the start of the file name, so it is a slug. */
export const ManualBackupSchema = v.object({
  name: v.pipe(
    v.string(),
    v.trim(),
    v.toLowerCase(),
    v.regex(/^[a-z0-9][a-z0-9-]{0,59}$/, 'Use 1–60 lowercase letters, digits or dashes.'),
  ),
});

export type ManualBackupInput = v.InferOutput<typeof ManualBackupSchema>;
