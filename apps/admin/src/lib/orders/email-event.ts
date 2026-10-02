import type { StatusMeta } from '~/lib/orders/status';

/**
 * A failed email on the order timeline. The server writes `field: 'email'` with
 * the message kind as `toValue` (apps/server/src/modules/notifications/mail-failure.ts)
 * and the provider's error in the note.
 */
const EMAIL_KIND_LABELS: Record<string, string> = {
  order_placed_new_account: 'Order confirmation',
  order_placed_activate_reminder: 'Order confirmation',
  order_placed_confirmation: 'Order confirmation',
  contract_ready: 'Contract signing email',
  contract_signed: 'Signed contract receipt',
  rental_reminder: 'Rental reminder',
  dispute_alert: 'Dispute alert',
};

export function emailEventMeta(kind: string): StatusMeta {
  return {
    label: `${EMAIL_KIND_LABELS[kind] ?? kind} not sent`,
    tone: 'border-rose-500/40 text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
  };
}
