/**
 * Overall size, wheels, brakes and folding — the part of a product that has to
 * fit through a door or into a boot.
 *
 * The overall dimensions are ranges for the same reason the seat ones are: a
 * chair hired in four seat widths has four overall widths, and the catalogue
 * quotes the span ("Larghezza totale: 46 – 57 cm"). Wheels are text, not
 * numbers, because the catalogue quotes them in whichever unit the
 * manufacturer printed — `Ø 60 cm in poliuretano` on one chair and `22" con
 * sgancio rapido` on the next — and converting one to the other would be
 * inventing a figure no page states.
 */
import { defineSpec, spec, specGroup } from '../../lib/spec.ts';

// --- overall dimensions -----------------------------------------------------

export const totalWidth = defineSpec(
  'total-width',
  spec.range({
    label: { it: 'Larghezza totale', en: 'Overall width' },
    unit: 'cm',
    isFilterable: true,
    isComparable: true,
  }),
);

export const totalLength = defineSpec(
  'total-length',
  spec.range({
    label: { it: 'Lunghezza totale', en: 'Overall length' },
    unit: 'cm',
    isComparable: true,
  }),
);

export const totalHeight = defineSpec(
  'total-height',
  spec.range({
    label: { it: 'Altezza totale', en: 'Overall height' },
    unit: 'cm',
    isComparable: true,
  }),
);

export const overallDimensions = specGroup({
  ...totalWidth,
  ...totalLength,
  ...totalHeight,
});

/**
 * `Ingombro da chiusa` on the Italian pages, `Transport width` in the one
 * attribute table that carries it. The number a customer measures their boot
 * or their hallway against, so it is filterable on its own.
 */
export const foldedWidth = defineSpec(
  'folded-width',
  spec.number({
    label: { it: 'Ingombro da chiusa', en: 'Folded width' },
    unit: 'cm',
    isFilterable: true,
    isComparable: true,
  }),
);

/**
 * `Lunghezza da chiuso` — the walkers fold flat rather than small, so their
 * pages give a folded width AND a folded length where the chairs give only a
 * width.
 */
export const foldedLength = defineSpec(
  'folded-length',
  spec.number({
    label: { it: 'Lunghezza da chiuso', en: 'Folded length' },
    unit: 'cm',
    isComparable: true,
  }),
);

/**
 * Text: where a page gives all three folded dimensions it gives them as one
 * string — `75 × 48,5 × 45 cm` — and three separate numbers would be a
 * different fact from the one printed.
 */
export const foldedSize = defineSpec(
  'folded-size',
  spec.text({ label: { it: 'Dimensioni da chiuso', en: 'Folded dimensions' } }),
);

// --- folding ----------------------------------------------------------------

export const foldable = defineSpec(
  'foldable',
  spec.boolean({
    label: { it: 'Pieghevole', en: 'Foldable' },
    isFilterable: true,
    isComparable: true,
  }),
);

/**
 * The backrest drops flat while the chair stays open — `schienale ribaltabile
 * salva spazio`. Kept apart from `reclining-backrest`, which is a seating
 * position and not a way of making the chair smaller.
 */
export const foldingBackrest = defineSpec(
  'folding-backrest',
  spec.boolean({
    label: { it: 'Schienale ribaltabile', en: 'Folding backrest' },
    isComparable: true,
  }),
);

/** `Regolabile da 79cm a 92 cm` — the span a walker's legs cover. */
export const adjustableHeight = defineSpec(
  'adjustable-height',
  spec.range({
    label: { it: 'Altezza regolabile', en: 'Adjustable height' },
    unit: 'cm',
    isFilterable: true,
    isComparable: true,
  }),
);

/**
 * Text, because the one page that states it states two heights in one line —
 * `Struttura 88 cm - Barra 94 cm` — and they are not the ends of a range.
 */
export const handleHeight = defineSpec(
  'handle-height',
  spec.text({ label: { it: 'Altezza impugnature', en: 'Handle height' } }),
);

// --- wheels and brakes ------------------------------------------------------

export const rearWheels = defineSpec(
  'rear-wheels',
  spec.text({ label: { it: 'Ruote posteriori', en: 'Rear wheels' } }),
);

export const frontWheels = defineSpec(
  'front-wheels',
  spec.text({ label: { it: 'Ruote anteriori', en: 'Front wheels' } }),
);

export const wheelDiameter = defineSpec(
  'wheel-diameter',
  spec.number({
    label: { it: 'Diametro ruote', en: 'Wheel diameter' },
    unit: 'cm',
    isComparable: true,
  }),
);

export const wheelType = defineSpec(
  'wheel-type',
  spec.select({
    label: { it: 'Tipo di ruote', en: 'Wheel type' },
    isFilterable: true,
    isComparable: true,
    options: {
      solid: { it: 'Piene', en: 'Solid' },
      pneumatic: { it: 'Pneumatiche', en: 'Pneumatic' },
    },
  }),
);

/**
 * `dual` is the double braking system the Bobby advertises — one set the person
 * sitting down can reach, one set on the push handles for whoever is pushing.
 * `parking` is the pair of wheel locks every other chair carries.
 */
export const brakes = defineSpec(
  'brakes',
  spec.select({
    label: { it: 'Freni', en: 'Brakes' },
    isFilterable: true,
    isComparable: true,
    options: {
      parking: { it: 'Due freni di stazionamento', en: 'Two parking brakes' },
      dual: {
        it: 'Doppio sistema frenante, utente e accompagnatore',
        en: 'Dual braking system, user and attendant',
      },
      /** A rollator's: squeezed to slow down, pushed down to park. */
      hand: { it: 'Freni a leva sulle impugnature', en: 'Hand brakes on the handles' },
    },
  }),
);

export const antiTipWheels = defineSpec(
  'anti-tip-wheels',
  spec.boolean({
    label: { it: 'Ruotini antiribaltamento', en: 'Anti-tip wheels' },
    isFilterable: true,
    isComparable: true,
  }),
);
