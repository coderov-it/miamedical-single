/**
 * Presentation and shaping for returned-unit decisions: what an outcome is
 * called and coloured, and how a rental line's quantity becomes one row per
 * physical unit.
 */
import { type MessageKey, t } from '~/lib/ui-text';

import type { StatusMeta } from './status.ts';
import type { OrderDetail } from './types.ts';

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

export type ReturnUnit = OrderDetail['returnUnits'][number];
export type Decision = ReturnUnit['decisions'][number];

/** One physical unit: its line, its position within the line, and its decision if any. */
export interface UnitRow {
  key: string;
  orderItemId: string;
  productTitle: string;
  number: number;
  decision: Decision | null;
}

/**
 * Decided units first, in the order they were decided; the ones still waiting
 * after. Numbers run per line (`#1…#n`) in that same order, so a unit keeps its
 * number once decided and the open ones count on from it.
 */
export function unitRows(lines: readonly ReturnUnit[]): UnitRow[] {
  const decided: { line: ReturnUnit; decision: Decision }[] = [];
  for (const line of lines) {
    for (const decision of line.decisions) decided.push({ line, decision });
  }
  decided.sort((a, b) => a.decision.inspectedAt.localeCompare(b.decision.inspectedAt));

  const counted = new Map<string, number>();
  const next = (orderItemId: string) => {
    const number = (counted.get(orderItemId) ?? 0) + 1;
    counted.set(orderItemId, number);
    return number;
  };

  const rows: UnitRow[] = decided.map(({ line, decision }) => ({
    key: decision.id,
    orderItemId: line.orderItemId,
    productTitle: line.productTitle,
    number: next(line.orderItemId),
    decision,
  }));
  for (const line of lines) {
    for (let i = line.decisions.length; i < line.quantity; i++) {
      const number = next(line.orderItemId);
      rows.push({
        key: `${line.orderItemId}:${number}`,
        orderItemId: line.orderItemId,
        productTitle: line.productTitle,
        number,
        decision: null,
      });
    }
  }
  return rows;
}
