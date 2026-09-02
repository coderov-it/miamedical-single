/**
 * Specs defined once and spread into whichever categories need them.
 *
 * `defineSpec` gives a spec its own key, so `max-load` is written here and
 * nowhere else. Reuse is an authoring convenience, not a shared row:
 * `category_specs` is keyed `(category_id, key)`, so a spec spread into three
 * categories is three rows — and each category may override `position`,
 * `isFilterable` or `isComparable` after the spread.
 */
import { defineSpec, spec, specGroup } from '../../lib/spec.ts';

export const maxLoad = defineSpec(
  'max-load',
  spec.number({
    label: { it: 'Portata massima', en: 'Maximum load' },
    unit: 'kg',
    isFilterable: true,
    isComparable: true,
  }),
);

export const seatWidth = defineSpec(
  'seat-width',
  spec.number({
    label: { it: 'Larghezza seduta', en: 'Seat width' },
    unit: 'cm',
    isFilterable: true,
    isComparable: true,
  }),
);

export const weight = defineSpec(
  'weight',
  spec.range({ label: { it: 'Peso', en: 'Weight' }, unit: 'kg', isFilterable: true }),
);

export const frameMaterial = defineSpec(
  'frame-material',
  spec.select({
    label: { it: 'Materiale telaio', en: 'Frame material' },
    helpText: { it: "L'alluminio pesa meno, l'acciaio costa meno." },
    isFilterable: true,
    isComparable: true,
    options: {
      aluminium: { it: 'Alluminio', en: 'Aluminium' },
      steel: { it: 'Acciaio', en: 'Steel' },
    },
  }),
);

export const foldable = defineSpec(
  'foldable',
  spec.boolean({ label: { it: 'Pieghevole', en: 'Foldable' }, isFilterable: true }),
);

export const condition = defineSpec(
  'condition',
  spec.select({
    label: { it: 'Condizione', en: 'Condition' },
    isFilterable: true,
    options: {
      new: { it: 'Nuovo', en: 'New' },
      refurbished: { it: 'Ricondizionato', en: 'Refurbished' },
      used: { it: 'Usato', en: 'Used' },
    },
  }),
);

/** The four every wheeled aid carries. Spread as one: `...mobilityBasics`. */
export const mobilityBasics = specGroup({
  ...maxLoad,
  ...seatWidth,
  ...weight,
  ...frameMaterial,
});
