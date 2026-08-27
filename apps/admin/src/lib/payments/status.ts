import type { PaymentStatus } from '~/lib/orders/status';

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
    { label: 'Today', from: today, to: today },
    { label: 'This week', from: toIso(weekStart), to: today },
    { label: 'This month', from: toIso(monthStart), to: today },
    { label: 'This year', from: toIso(yearStart), to: today },
  ];
}
