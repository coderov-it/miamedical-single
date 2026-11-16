import type { StatusMeta } from '~/lib/orders/status';
import { type MessageKey, t } from '~/lib/ui-text';

/**
 * A failed email on the order timeline. The server writes `field: 'email'` with
 * the message kind as `toValue` (apps/server/src/modules/notifications/mail-failure.ts)
 * and the provider's error in the note.
 */
const EMAIL_KIND_KEYS: Record<string, MessageKey> = {
  order_placed_new_account: 'status.emailOrderConfirmation',
  order_placed_activate_reminder: 'status.emailOrderConfirmation',
  order_placed_confirmation: 'status.emailOrderConfirmation',
  contract_ready: 'status.emailContractReady',
  contract_signed: 'status.emailContractSigned',
  rental_reminder: 'status.emailRentalReminder',
  dispute_alert: 'status.emailDisputeAlert',
};

/** Call at render time — the label follows the interface language. */
export function emailEventMeta(kind: string): StatusMeta {
  const key = EMAIL_KIND_KEYS[kind];
  return {
    label: t('status.emailNotSent', { email: key ? t(key) : kind }),
    tone: 'border-rose-500/40 text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
  };
}
