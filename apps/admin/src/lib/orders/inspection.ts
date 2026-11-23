/**
 * Presentation for returned-unit decisions: what an outcome is called and
 * coloured.
 */
import { type MessageKey, t } from '~/lib/ui-text';

import type { StatusMeta } from './status.ts';

const EMERALD = {
  tone: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
  dot: 'bg-emerald-500',
};
const AMBER = {
  tone: 'border-amber-500/40 text-amber-600 dark:text-amber-400',
  dot: 'bg-amber-500',
};

const OUTCOMES: Record<string, { key: MessageKey; look: { tone: string; dot: string } }> = {
  restocked: { key: 'orders.inspectionStockBack', look: EMERALD },
  attention: { key: 'orders.inspectionAttention', look: AMBER },
  repaired: { key: 'orders.inspectionRepaired', look: EMERALD },
  written_off: {
    key: 'orders.inspectionWrittenOff',
    look: { tone: 'border-border text-muted-foreground', dot: 'bg-muted-foreground' },
  },
};

/** Label and colours for an inspection outcome or its resolution. Call at render time. */
export function inspectionMeta(value: string): StatusMeta {
  const entry = OUTCOMES[value];
  if (!entry) return { tone: 'text-muted-foreground', dot: 'bg-muted-foreground', label: value };
  return { ...entry.look, label: t(entry.key) };
}
