import type { ContractStatus, ContractVariant } from '@mia/validators';

import type { StatusMeta } from '~/lib/orders/status';

const NEUTRAL: StatusMeta = {
  label: '—',
  tone: 'text-muted-foreground',
  dot: 'bg-muted-foreground',
};

export const CONTRACT_STATUS_META: Record<ContractStatus, StatusMeta> = {
  draft: {
    label: 'Draft',
    tone: 'border-border text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
  generated: {
    label: 'Generated',
    tone: 'border-blue-500/40 text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  sent: {
    label: 'Sent',
    tone: 'border-amber-500/40 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  viewed: {
    label: 'Viewed',
    tone: 'border-violet-500/40 text-violet-600 dark:text-violet-400',
    dot: 'bg-violet-500',
  },
  signed: {
    label: 'Signed',
    tone: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  voided: {
    label: 'Voided',
    tone: 'border-rose-500/40 text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
};

export function contractStatusMeta(status: string): StatusMeta {
  return CONTRACT_STATUS_META[status as ContractStatus] ?? { ...NEUTRAL, label: status };
}

export const CONTRACT_STATUS_ORDER: readonly ContractStatus[] = [
  'draft',
  'generated',
  'sent',
  'viewed',
  'signed',
  'voided',
];

export const VARIANT_LABELS: Record<ContractVariant, string> = {
  carrozzina_italian: 'Carrozzina (IT)',
  carrozzina_tourist: 'Carrozzina (EN)',
  scooter_italian: 'Scooter (IT)',
  scooter_tourist: 'Scooter (EN)',
};

export function variantLabel(variant: string): string {
  return VARIANT_LABELS[variant as ContractVariant] ?? variant;
}
