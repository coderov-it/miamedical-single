import { resolvePeriod } from '@mia/pricing';

/**
 * A hand-typed contract line. Deliberately NOT catalogue pricing: this is a
 * walk-in whose price was agreed on the phone, so the operator types every
 * figure and nothing here consults a package. It shares the storefront's
 * vocabulary — a duration in a unit, and an end date derived from the start —
 * so both kinds of contract read alike once printed.
 */
export interface ItemDraft {
  productTitle: string;
  quantity: number;
  duration: number;
  durationUnit: 'hour' | 'day';
  unitPrice: string;
  total: string;
  startDate: string;
  startTime: string;
}

export function blankItem(): ItemDraft {
  return {
    productTitle: '',
    quantity: 1,
    duration: 1,
    durationUnit: 'day',
    unitPrice: '0.00',
    total: '0.00',
    startDate: '',
    startTime: '',
  };
}

/** The end this line's start and duration place, or `null` while incomplete. */
export const endOf = (item: ItemDraft) =>
  item.startDate
    ? resolvePeriod(item.startDate, item.startTime || null, {
        unit: item.durationUnit,
        duration: item.duration,
      })
    : null;
