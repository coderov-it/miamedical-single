/**
 * Vendita Crioterapia — product_cat 540, `vendita-crioterapia`, 2 products.
 *
 * The compression Cryopush and the dynamic one. The dynamic model (14182) is the
 * only cryotherapy product in the catalogue that prints a specification block,
 * which is where the supply, the pressure range, the temperature range and the
 * empty weight come from.
 */
import { defineCategory } from '../../lib/define.ts';
import { powerSupply, treatmentTimer, warranty, weight, colour } from '../shared/specs.ts';
import { overallDimensions } from '../shared/specs-chassis.ts';
import { includedAccessories, channels, programmes, treatmentPressure, treatmentTemperature } from '../shared/specs-therapy.ts';

export const cryotherapySale = defineCategory({
  code: 'cryotherapy-sale',
  position: 20,
  translations: {
    it: {
      name: 'Vendita Crioterapia',
      slug: 'vendita-crioterapia',
      description:
        'Vendita crioterapia professionale con compressione, con acquisto diretto e consegna rapida in tutta Italia.',
      metaTitle: 'Vendita Crioterapia Professionale',
      metaDescription:
        'Acquista il sistema CRYOPUSH di crioterapia compressiva professionale per uso domiciliare e clinico. Trattamento rapido di dolore, gonfiore e infiammazione.',
    },
    en: {
      name: 'Cryotherapy for sale',
      slug: 'vendita-crioterapia',
      description:
        'Professional compression cryotherapy for sale, bought outright and delivered quickly anywhere in Italy.',
      metaTitle: 'Professional cryotherapy for sale',
      metaDescription:
        'Buy the CRYOPUSH professional compression cryotherapy system for use at home or in a clinic. Fast treatment of pain, swelling and inflammation.',
    },
  },

  specs: { ...includedAccessories, ...channels, ...programmes, ...treatmentPressure, ...treatmentTemperature, ...treatmentTimer, ...powerSupply, ...overallDimensions, ...weight, ...warranty, ...colour },
});
