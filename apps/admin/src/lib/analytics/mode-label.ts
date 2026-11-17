import { t } from '~/lib/ui-text';

export function modeLabel(mode: 'fixed' | 'rental'): string {
  if (mode === 'rental') return t('orders.typeRental');
  return t('orders.typeSale');
}
