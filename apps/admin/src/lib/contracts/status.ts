import type { ContractStatus, ContractVariant } from '@mia/validators';

import { NEUTRAL_TONE, type StatusMeta, type StatusTone } from '~/lib/orders/status';
import { type MessageKey, t } from '~/lib/ui-text';

export const CONTRACT_STATUS_TONE: Record<ContractStatus, StatusTone & { labelKey: MessageKey }> = {
  draft: {
    labelKey: 'status.contractDraft',
    tone: 'border-border text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
  generated: {
    labelKey: 'status.contractGenerated',
    tone: 'border-blue-500/40 text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  sent: {
    labelKey: 'status.contractSent',
    tone: 'border-amber-500/40 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  viewed: {
    labelKey: 'status.contractViewed',
    tone: 'border-violet-500/40 text-violet-600 dark:text-violet-400',
    dot: 'bg-violet-500',
  },
  signed: {
    labelKey: 'status.contractSigned',
    tone: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  voided: {
    labelKey: 'status.contractVoided',
    tone: 'border-rose-500/40 text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
};

/** Call at render time — the label follows the interface language. */
export function contractStatusMeta(status: string): StatusMeta {
  const entry = CONTRACT_STATUS_TONE[status as ContractStatus];
  if (!entry) return { ...NEUTRAL_TONE, label: status };
  return { tone: entry.tone, dot: entry.dot, label: t(entry.labelKey) };
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
