/**
 * Seat, backrest and postural specs — the part of a product the customer sits
 * in. Shared by the chairs, the beds and the standing frames.
 *
 * Every dimension here is a `range` rather than a `number`, because the
 * catalogue quotes almost all of them as a span: a chair is hired in several
 * seat widths ("Seduta di 40 cm o 43 cm", "39 – 48 cm"), and even the fixed
 * ones are written as a span in the attribute table ("40 - 46 cm"). A product
 * quoted at one figure writes that figure as both ends.
 */
import { defineSpec, spec, specGroup } from '../../lib/spec.ts';

// --- dimensions -------------------------------------------------------------

export const seatWidth = defineSpec(
  'seat-width',
  spec.range({
    label: { it: 'Larghezza seduta', en: 'Seat width' },
    unit: 'cm',
    isFilterable: true,
    isComparable: true,
  }),
);

export const seatDepth = defineSpec(
  'seat-depth',
  spec.range({
    label: { it: 'Profondità seduta', en: 'Seat depth' },
    unit: 'cm',
    isComparable: true,
  }),
);

export const seatHeight = defineSpec(
  'seat-height',
  spec.range({
    label: { it: 'Altezza seduta', en: 'Seat height' },
    unit: 'cm',
    isComparable: true,
  }),
);

export const backrestHeight = defineSpec(
  'backrest-height',
  spec.range({
    label: { it: 'Altezza schienale', en: 'Backrest height' },
    unit: 'cm',
    isComparable: true,
  }),
);

/** The four the chairs quote together. */
export const seatDimensions = specGroup({
  ...seatWidth,
  ...seatDepth,
  ...seatHeight,
  ...backrestHeight,
});

// --- backrest and legs ------------------------------------------------------

/**
 * Reclines for the person sitting in it. NOT the same fact as
 * `folding-backrest`, which drops flat to make the chair smaller in the boot —
 * the Bobby has the second and not the first, and the catalogue is careful to
 * say `ribaltabile` for one and `reclinabile` for the other.
 */
export const recliningBackrest = defineSpec(
  'reclining-backrest',
  spec.boolean({
    label: { it: 'Schienale reclinabile', en: 'Reclining backrest' },
    isFilterable: true,
    isComparable: true,
  }),
);

/** `sistema basculante` — the whole seat tips, keeping the hip angle. */
export const tiltInSpace = defineSpec(
  'tilt-in-space',
  spec.boolean({
    label: { it: 'Sistema basculante', en: 'Tilt-in-space' },
    helpText: {
      it: 'Inclina tutta la seduta, non solo lo schienale: il paziente non scivola in avanti.',
      en: 'Tips the whole seat rather than the backrest alone, so the user does not slide forward.',
    },
    isFilterable: true,
    isComparable: true,
  }),
);

export const headrest = defineSpec(
  'headrest',
  spec.boolean({ label: { it: 'Poggiatesta', en: 'Headrest' }, isComparable: true }),
);

export const elevatingLegrests = defineSpec(
  'elevating-legrests',
  spec.boolean({
    label: { it: 'Pedane elevabili', en: 'Elevating legrests' },
    isFilterable: true,
    isComparable: true,
  }),
);

// --- what comes off, and what adjusts ---------------------------------------

/**
 * One spec for `braccioli estraibili`, `braccioli rimovibili`, `braccioli
 * ribaltabili` and `braccioli girevoli`. Four words for the same thing a
 * customer needs to know — that the armrest gets out of the way for a
 * side transfer — so they are merged, and the label says both.
 */
export const removableArmrests = defineSpec(
  'removable-armrests',
  spec.boolean({
    label: {
      it: 'Braccioli estraibili o ribaltabili',
      en: 'Removable or flip-back armrests',
    },
    isFilterable: true,
    isComparable: true,
  }),
);

/** `pedane estraibili`, `removibili`, `regolabili` — merged for the same reason. */
export const removableFootrests = defineSpec(
  'removable-footrests',
  spec.boolean({
    label: {
      it: 'Pedane estraibili e regolabili',
      en: 'Removable, adjustable footrests',
    },
    isFilterable: true,
    isComparable: true,
  }),
);

export const adjustableSeat = defineSpec(
  'adjustable-seat',
  spec.boolean({
    label: {
      it: 'Seduta regolabile in larghezza e profondità',
      en: 'Seat adjustable in width and depth',
    },
    isComparable: true,
  }),
);

/**
 * A rollator with a seat is a different product from one without: it is what
 * lets someone stop and rest halfway down the road, and it is the line the
 * catalogue draws between "deambulatore" and "rollator con seduta".
 */
export const hasSeat = defineSpec(
  'has-seat',
  spec.boolean({
    label: { it: 'Seduta', en: 'Seat' },
    isFilterable: true,
    isComparable: true,
  }),
);

export const pressureReliefCushions = defineSpec(
  'pressure-relief-cushions',
  spec.boolean({
    label: { it: 'Cuscini antidecubito inclusi', en: 'Pressure-relief cushions included' },
    isFilterable: true,
    isComparable: true,
  }),
);

/** Comes apart for transport — the seggioloni, which do not fold. */
export const dismountable = defineSpec(
  'dismountable',
  spec.boolean({
    label: { it: 'Smontabile per il trasporto', en: 'Comes apart for transport' },
    isComparable: true,
  }),
);

/**
 * How the recline and the tilt are driven. The two seggioloni are the same
 * chair twice over: one is worked by hand, the other by a handset, and that is
 * the whole difference between a 70 € week and a 90 € week.
 */
export const adjustmentDrive = defineSpec(
  'adjustment-drive',
  spec.select({
    label: { it: 'Regolazioni', en: 'Adjustment' },
    isFilterable: true,
    isComparable: true,
    options: {
      manual: { it: 'Manuali', en: 'Manual' },
      electric: { it: 'Elettriche con telecomando', en: 'Electric, handset-operated' },
    },
  }),
);
