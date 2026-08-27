import type { StatusMeta } from '~/lib/orders/status';

export type RentalStatus = 'active' | 'overdue' | 'completed';

export const RENTAL_STATUS_META: Record<RentalStatus, StatusMeta> = {
  active: {
    label: 'Active',
    tone: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  overdue: {
    label: 'Overdue',
    tone: 'border-rose-500/40 text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
  completed: {
    label: 'Completed',
    tone: 'border-border text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
};

export function rentalStatusMeta(status: string): StatusMeta {
  return (
    RENTAL_STATUS_META[status as RentalStatus] ?? {
      label: status,
      tone: 'text-muted-foreground',
      dot: 'bg-muted-foreground',
    }
  );
}

export const RENTAL_STATUS_ORDER: readonly RentalStatus[] = ['active', 'overdue', 'completed'];
