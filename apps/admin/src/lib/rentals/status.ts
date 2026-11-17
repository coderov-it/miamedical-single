import { NEUTRAL_TONE, type StatusMeta, type StatusTone } from '~/lib/orders/status';
import { type MessageKey, t } from '~/lib/ui-text';

export type RentalStatus = 'active' | 'overdue' | 'completed';

export const RENTAL_STATUS_TONE: Record<RentalStatus, StatusTone & { labelKey: MessageKey }> = {
  active: {
    labelKey: 'status.rentalActive',
    tone: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  overdue: {
    labelKey: 'status.rentalOverdue',
    tone: 'border-rose-500/40 text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
  completed: {
    labelKey: 'status.rentalCompleted',
    tone: 'border-border text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
};

/** Call at render time — the label follows the interface language. */
export function rentalStatusMeta(status: string): StatusMeta {
  const entry = RENTAL_STATUS_TONE[status as RentalStatus];
  if (!entry) return { ...NEUTRAL_TONE, label: status };
  return { tone: entry.tone, dot: entry.dot, label: t(entry.labelKey) };
}

export const RENTAL_STATUS_ORDER: readonly RentalStatus[] = ['active', 'overdue', 'completed'];
