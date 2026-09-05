/**
 * How a product moves, and who it is sized for.
 *
 * `propulsion` is the one spec the whole wheelchair catalogue turns on: the
 * category page's own comparison table is built from it, row by row —
 * autospinta for people who move themselves, transito for a carer pushing,
 * elettrica for a joystick. `convertible` is not a hedge: two products are sold
 * as "da transito o da autospinta", usable either way.
 */
import { defineSpec, spec } from '../../lib/spec.ts';

export const propulsion = defineSpec(
  'propulsion',
  spec.select({
    label: { it: 'Tipo di spinta', en: 'Propulsion' },
    isFilterable: true,
    isComparable: true,
    options: {
      'self-propelled': { it: 'Autospinta', en: 'Self-propelled' },
      transit: { it: 'Da transito', en: 'Transit' },
      electric: { it: 'Elettrica', en: 'Electric' },
      convertible: {
        it: 'Da transito o ad autospinta',
        en: 'Transit or self-propelled',
      },
    },
  }),
);

/**
 * Only one product in the catalogue is a child's — the Vermeiren Jazz S50 Kids
 * — but it is the one fact a parent filters on, and the spec is what keeps the
 * 60 kg load limit from reading like a fault.
 */
export const ageGroup = defineSpec(
  'age-group',
  spec.select({
    label: { it: 'Destinato a', en: 'Intended for' },
    isFilterable: true,
    options: {
      adult: { it: 'Adulti', en: 'Adults' },
      child: { it: 'Bambini', en: 'Children' },
    },
  }),
);

export const indoorOutdoor = defineSpec(
  'indoor-outdoor',
  spec.select({
    label: { it: 'Utilizzo', en: 'Use' },
    isFilterable: true,
    options: {
      indoor: { it: 'Interno', en: 'Indoor' },
      outdoor: { it: 'Esterno', en: 'Outdoor' },
      both: { it: 'Interno ed esterno', en: 'Indoor and outdoor' },
    },
  }),
);
