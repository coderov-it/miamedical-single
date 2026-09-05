/**
 * Pressoterapia — product_cat 90, `affitto-noleggio-pressoterapia`, 2 products.
 *
 * ⚠️ The two products are the SAME machine listed twice, under the same name
 * ("Noleggio Pressoterapia Professionale"), with the same accessories and almost
 * the same prices — 15 and 30 days match, and the 60-day package is 250 € on one
 * and 240 € on the other. Both are live; both are carried. The duplication is in
 * docs/catalog/README.md.
 */
import { defineCategory } from '../../lib/define.ts';
import { powerSupply, treatmentTimer, warranty, weight, colour } from '../shared/specs.ts';
import { overallDimensions } from '../shared/specs-chassis.ts';
import { includedAccessories, channels, programmes, treatmentPressure, treatmentTemperature } from '../shared/specs-therapy.ts';

export const pressotherapyHire = defineCategory({
  code: 'pressotherapy-hire',
  position: 11,
  translations: {
    it: {
      name: 'Pressoterapia',
      slug: 'affitto-noleggio-pressoterapia',
      description:
        'Il servizio di noleggio pressoterapia PowerPress 4 di MIA Medical ti permette di eseguire trattamenti professionali di drenaggio linfatico e circolatorio direttamente a casa, in modo semplice, sicuro e personalizzato.',
      metaTitle: 'Pressoterapia Archives - Mia Medical Italia',
      metaDescription:
        'Noleggio pressoterapia professionale con accessori inclusi e 4 programmi di trattamento differenti. Spedizione a domicilio in tutta Italia.',
    },
    en: {
      name: 'Pressotherapy',
      slug: 'affitto-noleggio-pressoterapia',
      description:
        'MIA Medical’s PowerPress 4 pressotherapy hire lets you carry out professional lymphatic and circulatory drainage treatments at home — simply, safely and set up for you.',
      metaTitle: 'Professional pressotherapy hire | Mia Medical Italia',
      metaDescription:
        'Professional pressotherapy hire with the accessories included and four different treatment programmes. Shipped to your door anywhere in Italy.',
    },
  },

  specs: { ...includedAccessories, ...channels, ...programmes, ...treatmentPressure, ...treatmentTemperature, ...treatmentTimer, ...powerSupply, ...overallDimensions, ...weight, ...warranty, ...colour },
});
