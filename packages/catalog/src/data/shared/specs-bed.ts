/**
 * The hospital beds, and the hoists that lift someone into them.
 *
 * `max-load` and `safe-working-load` are TWO specs and not one, because the
 * bed pages state them as two and they differ: the 90 cm bed carries a
 * "Peso max. paziente: 130 Kg" and a "Carico max. di sicuro utilizzo: 180Kg".
 * The first is the person, the second is the person plus the mattress, the
 * rails and whoever leans on the edge — merging them would lose the 50 kg the
 * shop deliberately keeps in hand.
 */
import { defineSpec, spec } from '../../lib/spec.ts';

/**
 * The mattress platform, as one string: the pages print `195×95 cm` and
 * `200 cm x 140 cm`, and the pair is the fact — a customer matches it against
 * a mattress, not against two separate numbers.
 */
export const mattressSurface = defineSpec(
  'mattress-surface',
  spec.text({
    label: { it: 'Superficie per degenza', en: 'Mattress platform' },
    isComparable: true,
  }),
);

export const safeWorkingLoad = defineSpec(
  'safe-working-load',
  spec.number({
    label: { it: 'Carico massimo di sicuro utilizzo', en: 'Safe working load' },
    helpText: {
      it: 'Il letto completo: paziente, materasso, sponde e chi si appoggia al bordo.',
      en: 'The bed as a whole: patient, mattress, side rails and anyone leaning on the edge.',
    },
    unit: 'kg',
    isComparable: true,
  }),
);

/** `Regolazione in altezza con telecomando — minima: 30 cm, massima: 80 cm`. */
export const heightAdjustment = defineSpec(
  'height-adjustment',
  spec.range({
    label: { it: 'Regolazione in altezza', en: 'Height adjustment' },
    unit: 'cm',
    isComparable: true,
  }),
);

/**
 * Text: the shop counts a bed's articulation in joints and movements — "3
 * motori, 6 movimenti", "tre snodi", "poggiatesta inclinabile fino a 75°" —
 * and no single number carries that.
 */
export const articulation = defineSpec(
  'articulation',
  spec.text({
    label: { it: 'Snodi e movimenti', en: 'Joints and movements' },
    isComparable: true,
  }),
);

export const sideRails = defineSpec(
  'side-rails',
  spec.boolean({
    label: { it: 'Sponde laterali', en: 'Side rails' },
    isFilterable: true,
    isComparable: true,
  }),
);

/**
 * Every bed the shop hires goes out with a pressure-relief mattress, and each
 * page says so in its title. It is a spec rather than an add-on because it
 * cannot be declined — it is part of what is hired.
 */
export const includesMattress = defineSpec(
  'includes-mattress',
  spec.boolean({
    label: {
      it: 'Materasso antidecubito incluso',
      en: 'Pressure-relief mattress included',
    },
    isFilterable: true,
    isComparable: true,
  }),
);

/** A hoist's sling, and whether one comes with it. */
export const includesSling = defineSpec(
  'includes-sling',
  spec.boolean({
    label: { it: 'Imbracatura inclusa', en: 'Sling included' },
    isFilterable: true,
    isComparable: true,
  }),
);

/**
 * How far gone a pressure sore may be and still be treated on this mattress.
 * The catalogue states it as a stage — "fino al 4° stadio", "fino al IV
 * stadio" — which is the clinical scale, so it is a select and not free text.
 */
export const pressureUlcerStage = defineSpec(
  'pressure-ulcer-stage',
  spec.select({
    label: { it: 'Indicato per decubito', en: 'Rated for pressure ulcers' },
    isFilterable: true,
    isComparable: true,
    options: {
      prevention: { it: 'Prevenzione', en: 'Prevention' },
      'stage-2': { it: 'Fino al 2° stadio', en: 'Up to stage 2' },
      'stage-4': { it: 'Fino al 4° stadio', en: 'Up to stage 4' },
    },
  }),
);

export const hasCompressor = defineSpec(
  'has-compressor',
  spec.boolean({
    label: { it: 'Compressore incluso', en: 'Compressor included' },
    isFilterable: true,
    isComparable: true,
  }),
);

/** A hoist's or a standing frame's boom. */
export const armLength = defineSpec(
  'arm-length',
  spec.number({
    label: { it: 'Lunghezza del braccio', en: 'Arm length' },
    unit: 'cm',
    isComparable: true,
  }),
);

/**
 * "Batteria fino a 40 sollevamenti con una sola carica" — the figure that
 * matters on a battery hoist is not the amp-hours, it is how many transfers
 * you get before it has to go back on charge.
 */
export const liftsPerCharge = defineSpec(
  'lifts-per-charge',
  spec.number({
    label: { it: 'Sollevamenti per carica', en: 'Lifts per charge' },
    isComparable: true,
  }),
);
