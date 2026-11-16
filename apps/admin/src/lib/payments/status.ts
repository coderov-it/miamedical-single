import type { PaymentStatus } from '~/lib/orders/status';
import { t } from '~/lib/ui-text';

export const PAYMENT_STATUS_ORDER: readonly PaymentStatus[] = [
  'unpaid',
  'authorized',
  'paid',
  'partially_refunded',
  'refunded',
  'failed',
];

export interface DatePreset {
  label: string;
  from: string;
  to: string;
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Call at render time — the labels follow the interface language. */
export function datePresets(): DatePreset[] {
  const now = new Date();
  const today = toIso(now);

  const weekStart = new Date(now);
  // Monday-start week; getDay() is 0 on Sunday, which naive `- getDay() + 1`
  // would push into tomorrow and invert the range.
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  return [
    { label: t('status.presetToday'), from: today, to: today },
    { label: t('status.presetThisWeek'), from: toIso(weekStart), to: today },
    { label: t('status.presetThisMonth'), from: toIso(monthStart), to: today },
    { label: t('status.presetThisYear'), from: toIso(yearStart), to: today },
  ];
}
