/**
 * The specs every category draws from, written once here.
 *
 * Every label and every option below is a fact the live catalogue states about
 * a product — `docs/catalog/README.md` records where each one was read from.
 * Nothing here is a plausible-sounding placeholder: a spec exists because at
 * least one product fills it, and a select carries an option because at least
 * one product's page uses that word.
 *
 * `defineSpec` gives a spec its own key, so `max-load` is written here and
 * nowhere else. Reuse is an authoring convenience, not a shared row:
 * `category_specs` is keyed `(category_id, key)`, so a spec spread into three
 * categories is three rows — and each category may override `position`,
 * `isFilterable` or `isComparable` after the spread.
 *
 * Sibling files split the vocabulary by the part of a product it describes:
 * `specs-seating.ts` (seat, backrest, postural features), `specs-chassis.ts`
 * (overall size, wheels, brakes, folding) and `specs-drive.ts` (battery,
 * motor, speed, range).
 */
import { defineSpec, spec, specGroup } from '../../lib/spec.ts';

// --- load and weight --------------------------------------------------------

/**
 * The one number the catalogue states most often, and under six different
 * Italian names — `Portata massima`, `Peso massimo utilizzatore`, `Peso
 * massimo supportato`, `Capacità di carico`, `Carico massimo`, `Carico max. di
 * sicuro utilizzo`. They are the same fact, so they are one spec.
 */
export const maxLoad = defineSpec(
  'max-load',
  spec.number({
    label: { it: 'Portata massima', en: 'Maximum load' },
    unit: 'kg',
    isFilterable: true,
    isComparable: true,
  }),
);

/**
 * A range, not a figure: most products are hired in several seat sizes and the
 * catalogue quotes the weight as a span across them — "la più leggera pesa 14
 * kg, mentre la più grande pesa circa 18 kg". A product quoted at one weight
 * writes the same number twice.
 */
export const weight = defineSpec(
  'weight',
  spec.range({
    label: { it: 'Peso', en: 'Weight' },
    unit: 'kg',
    isFilterable: true,
    isComparable: true,
  }),
);

// --- materials and finish ---------------------------------------------------

/**
 * `painted-steel` and `reinforced-steel` are separate options rather than a
 * note on `steel` because the catalogue sells on the difference: the bariatric
 * chairs are "acciaio verniciato con doppia crociera", the reclining chair is
 * plain "Acciaio", and the pages never use the two phrases interchangeably.
 */
export const frameMaterial = defineSpec(
  'frame-material',
  spec.select({
    label: { it: 'Materiale telaio', en: 'Frame material' },
    isFilterable: true,
    isComparable: true,
    options: {
      aluminium: { it: 'Alluminio', en: 'Aluminium' },
      steel: { it: 'Acciaio', en: 'Steel' },
      'painted-steel': { it: 'Acciaio verniciato', en: 'Painted steel' },
      'reinforced-steel': {
        it: 'Acciaio verniciato con doppia crociera',
        en: 'Painted steel with a double cross brace',
      },
      carbon: { it: 'Carbonio', en: 'Carbon fibre' },
      magnesium: { it: 'Magnesio', en: 'Magnesium' },
    },
  }),
);

/** Free text — the catalogue describes upholstery in a phrase, not a code. */
export const upholstery = defineSpec(
  'upholstery',
  spec.text({ label: { it: 'Seduta e schienale', en: 'Seat and backrest' } }),
);

/** Free text: the pages quote a finish ("argento e nero"), never a swatch. */
export const colour = defineSpec(
  'colour',
  spec.text({ label: { it: 'Colori disponibili', en: 'Available colours' } }),
);

// --- condition and cover ----------------------------------------------------

export const condition = defineSpec(
  'condition',
  spec.select({
    label: { it: 'Condizione', en: 'Condition' },
    isFilterable: true,
    isComparable: true,
    options: {
      new: { it: 'Nuovo', en: 'New' },
      refurbished: { it: 'Ricondizionato', en: 'Refurbished' },
      used: { it: 'Usato', en: 'Used' },
    },
  }),
);

/**
 * Text, not a number of months: `unit` is a single un-localised string, so the
 * only units this package may use are the ones that read the same in both
 * languages — `kg`, `cm`, `km/h`, `V`, `Ah`, `mmHg`. "24 mesi" / "24 months"
 * is customer copy, and a text spec's value is the one kind that may be a
 * `{ it, en }` pair.
 */
export const warranty = defineSpec(
  'warranty',
  spec.text({ label: { it: 'Garanzia', en: 'Warranty' }, isComparable: true }),
);

// --- mains-powered devices --------------------------------------------------

/**
 * The electromedical devices quote their supply as written on the plate —
 * "AC 220–240 V, 50–60 Hz", "100–240 V, 50/60 Hz". A range of volts plus a
 * range of hertz is not a number, so this stays text.
 */
export const powerSupply = defineSpec(
  'power-supply',
  spec.text({ label: { it: 'Alimentazione', en: 'Power supply' } }),
);

export const treatmentTimer = defineSpec(
  'treatment-timer',
  spec.text({ label: { it: 'Timer', en: 'Timer' } }),
);

/** Load and weight together — the pair almost every category carries. */
export const loadAndWeight = specGroup({ ...maxLoad, ...weight });
