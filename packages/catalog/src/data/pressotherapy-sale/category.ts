/**
 * Vendita Pressoterapia — product_cat 543, `vendita-pressoterapia`, 1 product.
 *
 * The Q2200 POWER, and the only pressotherapy page in the catalogue that prints a
 * specification block.
 */
import { defineCategory } from '../../lib/define.ts';
import { powerSupply, treatmentTimer, warranty, weight, colour } from '../shared/specs.ts';
import { overallDimensions } from '../shared/specs-chassis.ts';
import { includedAccessories, channels, programmes, treatmentPressure, treatmentTemperature } from '../shared/specs-therapy.ts';

export const pressotherapySale = defineCategory({
  code: 'pressotherapy-sale',
  position: 28,
  translations: {
    it: {
      name: 'Vendita Pressoterapia',
      slug: 'vendita-pressoterapia',
      description:
        'Con la vendita pressoterapia professionale di MIA Medical esegui trattamenti professionali di drenaggio linfatico e circolatorio direttamente a casa, in modo semplice, sicuro e personalizzato.',
      metaTitle: 'Vendita Pressoterapia Professionale | Mia Medical Italia',
      metaDescription:
        'quista la pressoterapia professionale. Trattamenti domiciliari efficaci per circolazione, drenaggio linfatico e benessere generale.',
    },
    en: {
      name: 'Pressotherapy for sale',
      slug: 'vendita-pressoterapia',
      description:
        'With professional pressotherapy from MIA Medical you can carry out lymphatic and circulatory drainage treatments at home — simply, safely and set up for you.',
      metaTitle: 'Professional pressotherapy for sale | Mia Medical Italia',
      metaDescription:
        'Buy professional pressotherapy. Effective treatments at home for circulation, lymphatic drainage and general wellbeing.',
    },
  },

  specs: { ...includedAccessories, ...channels, ...programmes, ...treatmentPressure, ...treatmentTemperature, ...treatmentTimer, ...powerSupply, ...overallDimensions, ...weight, ...warranty, ...colour },
});
