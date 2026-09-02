/**
 * Second-hand stock, sold rather than rented.
 *
 * Nothing about the category itself says "sold" — pricing mode lives on the
 * product, never in a category's name, code or slug. A category names the
 * product family; `noleggio` / `vendita` is `pricing_mode`.
 */
import { defineCategory } from '../../lib/define.ts';
import { spec } from '../../lib/spec.ts';
import { condition, maxLoad, seatWidth } from '../shared/specs.ts';

export const usedEquipment = defineCategory({
  code: 'used-equipment',
  position: 1,
  translations: {
    it: {
      name: 'Occasioni usato',
      slug: 'occasione-usato',
      description: 'Ausili ricondizionati e usati, garantiti e pronti alla consegna.',
    },
    en: { name: 'Used equipment', slug: 'used-equipment' },
  },

  specs: {
    ...condition,
    ...maxLoad,
    ...seatWidth,
    warrantyMonths: spec.number({
      label: { it: 'Garanzia', en: 'Warranty' },
      unit: 'mesi',
      isComparable: true,
    }),
  },
});
