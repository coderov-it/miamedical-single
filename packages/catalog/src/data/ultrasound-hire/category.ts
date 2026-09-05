/**
 * Ultrasuono — product_cat 431, `noleggio-ultrasuonoterapia`, 1 product.
 *
 * One machine, the Globus Medisound 3000, which the shop also sells.
 */
import { defineCategory } from '../../lib/define.ts';
import { powerSupply, treatmentTimer, warranty, weight, colour } from '../shared/specs.ts';
import { overallDimensions } from '../shared/specs-chassis.ts';
import { includedAccessories, channels, programmes, treatmentPressure, treatmentTemperature } from '../shared/specs-therapy.ts';

export const ultrasoundHire = defineCategory({
  code: 'ultrasound-hire',
  position: 14,
  translations: {
    it: {
      name: 'Ultrasuono',
      slug: 'noleggio-ultrasuonoterapia',
      description:
        'Noleggio ultrasuono professionale, a partire da 4,60 € al giorno, per trattare dolori muscolo-scheletrici e infiammazioni.',
      metaTitle: 'Ultrasuono Archives - Mia Medical Italia',
      metaDescription:
        'Noleggio ultrasuono professionale per trattare dolori muscolo-scheletrici e infiammazioni. Consegna in tutta Italia e assistenza continua.',
    },
    en: {
      name: 'Ultrasound',
      slug: 'noleggio-ultrasuonoterapia',
      description:
        'Professional ultrasound therapy for hire, from €4.60 a day, for musculoskeletal pain and inflammation.',
      metaTitle: 'Ultrasound therapy hire | Mia Medical Italia',
      metaDescription:
        'Professional ultrasound therapy hire for musculoskeletal pain and inflammation. Delivery across Italy with support throughout.',
    },
  },

  specs: { ...includedAccessories, ...channels, ...programmes, ...treatmentPressure, ...treatmentTemperature, ...treatmentTimer, ...powerSupply, ...overallDimensions, ...weight, ...warranty, ...colour },
});
