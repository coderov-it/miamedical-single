/**
 * Cryoterapia — product_cat 274, `noleggio-crioterapia`, 3 products.
 *
 * The site's own spelling of the name is "Cryoterapia", with a y. It is kept: the
 * name is the shop's, and correcting it here would leave the catalogue disagreeing
 * with the site it was read from.
 *
 * Two Cryopush machines and a Cryo Cuff. None of the three pages prints a
 * specification block — the only cryotherapy figures in the catalogue are on the
 * SALE page for the dynamic Cryopush (14182), and they stay there.
 */
import { defineCategory } from '../../lib/define.ts';
import { powerSupply, treatmentTimer, warranty, weight, colour } from '../shared/specs.ts';
import { overallDimensions } from '../shared/specs-chassis.ts';
import { includedAccessories, channels, programmes, treatmentPressure, treatmentTemperature } from '../shared/specs-therapy.ts';

export const cryotherapyHire = defineCategory({
  code: 'cryotherapy-hire',
  position: 3,
  translations: {
    it: {
      name: 'Cryoterapia',
      slug: 'noleggio-crioterapia',
      description:
        'Noleggio crioterapia professionale con compressione, a partire da 6,60 € al giorno. La terapia del freddo con compressione riduce dolore, gonfiore ed edema dopo un intervento o un trauma.',
      metaTitle: 'Cryoterapia Archives - Mia Medical Italia',
      metaDescription:
        'Noleggio crioterapia compressiva professionale per la terapia del freddo. Spedizione a domicilio in tutta Italia e assistenza continua.',
    },
    en: {
      name: 'Cryotherapy',
      slug: 'noleggio-crioterapia',
      description:
        'Professional compression cryotherapy for hire, from €6.60 a day. Cold therapy with compression brings down pain, swelling and oedema after an operation or an injury.',
      metaTitle: 'Compression cryotherapy hire | Mia Medical Italia',
      metaDescription:
        'Professional compression cryotherapy hire for cold therapy. Shipped to your door anywhere in Italy, with support throughout.',
    },
  },

  specs: { ...includedAccessories, ...channels, ...programmes, ...treatmentPressure, ...treatmentTemperature, ...treatmentTimer, ...powerSupply, ...overallDimensions, ...weight, ...warranty, ...colour },
});
