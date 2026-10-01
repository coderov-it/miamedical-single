import type { ExtensionPaymentMethod } from '@mia/validators';

import type { StatusMeta } from '~/lib/orders/status';

export type ExtensionStatus = 'renew_pending' | 'awaiting_signature' | 'active' | 'cancelled';

export const EXTENSION_STATUS_META: Record<ExtensionStatus, StatusMeta> = {
  renew_pending: {
    label: 'Awaiting payment',
    tone: 'border-amber-500/40 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  awaiting_signature: {
    label: 'Awaiting signature',
    tone: 'border-sky-500/40 text-sky-600 dark:text-sky-400',
    dot: 'bg-sky-500',
  },
  active: {
    label: 'Extended',
    tone: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Cancelled',
    tone: 'border-border text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
};

export function extensionStatusMeta(status: string): StatusMeta {
  return (
    EXTENSION_STATUS_META[status as ExtensionStatus] ?? {
      label: status,
      tone: 'text-muted-foreground',
      dot: 'bg-muted-foreground',
    }
  );
}

export const PAYMENT_METHOD_LABELS: Record<ExtensionPaymentMethod, string> = {
  bank_transfer: 'Bank transfer',
  cash: 'Cash',
  card_pos: 'Card (POS)',
  other: 'Other',
};

export function paymentMethodLabel(method: string | null): string {
  if (!method) return '—';
  return PAYMENT_METHOD_LABELS[method as ExtensionPaymentMethod] ?? method;
}
