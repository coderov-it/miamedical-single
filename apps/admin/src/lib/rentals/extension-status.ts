import type { ExtensionPaymentMethod } from '@mia/validators';

import { NEUTRAL_TONE, type StatusMeta, type StatusTone } from '~/lib/orders/status';
import { type MessageKey, t } from '~/lib/ui-text';

export type ExtensionStatus = 'renew_pending' | 'awaiting_signature' | 'active' | 'cancelled';

export const EXTENSION_STATUS_TONE: Record<ExtensionStatus, StatusTone & { labelKey: MessageKey }> =
  {
    renew_pending: {
      labelKey: 'status.extensionRenewPending',
      tone: 'border-amber-500/40 text-amber-600 dark:text-amber-400',
      dot: 'bg-amber-500',
    },
    awaiting_signature: {
      labelKey: 'status.extensionAwaitingSignature',
      tone: 'border-sky-500/40 text-sky-600 dark:text-sky-400',
      dot: 'bg-sky-500',
    },
    active: {
      labelKey: 'status.extensionActive',
      tone: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
      dot: 'bg-emerald-500',
    },
    cancelled: {
      labelKey: 'status.extensionCancelled',
      tone: 'border-border text-muted-foreground',
      dot: 'bg-muted-foreground',
    },
  };

/** Call at render time — the label follows the interface language. */
export function extensionStatusMeta(status: string): StatusMeta {
  const entry = EXTENSION_STATUS_TONE[status as ExtensionStatus];
  if (!entry) return { ...NEUTRAL_TONE, label: status };
  return { tone: entry.tone, dot: entry.dot, label: t(entry.labelKey) };
}

/** The methods an operator records by hand, in picker order. Labels via `paymentMethodLabel()`. */
export const PAYMENT_METHOD_KEYS: Record<ExtensionPaymentMethod, MessageKey> = {
  bank_transfer: 'status.methodBankTransfer',
  cash: 'status.methodCash',
  card_pos: 'status.methodCardPos',
  other: 'status.methodOther',
};

/** Written by the payment gateway, never picked in the dialog — so not above. */
const GATEWAY_METHOD_KEYS: Record<string, MessageKey> = {
  card_online: 'status.methodCardOnline',
};

/** Call at render time — the label follows the interface language. */
export function paymentMethodLabel(method: string | null): string {
  if (!method) return '—';
  const key = PAYMENT_METHOD_KEYS[method as ExtensionPaymentMethod] ?? GATEWAY_METHOD_KEYS[method];
  return key ? t(key) : method;
}
