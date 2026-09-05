/**
 * Criomagnetoterapia — product_cat 529, `noleggio-criomagnetoterapia`, 1 product.
 *
 * A category of one: the CRYOCEMP, which the shop also lists under Crioterapia
 * and Magnetoterapia. It is filed here because this is the category its own name
 * matches — see docs/catalog/source/placement.json.
 */
import { defineCategory } from '../../lib/define.ts';
import { powerSupply, treatmentTimer, warranty, weight, colour } from '../shared/specs.ts';
import { overallDimensions } from '../shared/specs-chassis.ts';
import { includedAccessories, channels, programmes, treatmentPressure, treatmentTemperature } from '../shared/specs-therapy.ts';

export const cryomagnetotherapyHire = defineCategory({
  code: 'cryomagnetotherapy-hire',
  position: 2,
  translations: {
    it: {
      name: 'Criomagnetoterapia',
      slug: 'noleggio-criomagnetoterapia',
      description:
        'Noleggio criomagnetoterapia CRYOCEMP: magnetoterapia CEMP e crioterapia compressiva in un unico trattamento, per ridurre dolore, infiammazione ed edema.',
      metaTitle: 'Criomagnetoterapia Archives - Mia Medical Italia',
      metaDescription:
        'Noleggio criomagnetoterapia CRYOCEMP per magnetoterapia CEMP e crioterapia compressiva. Tratta dolori muscolari, infiammazioni ed edemi. Consegna in tutta Italia e assistenza continua.',
    },
    en: {
      name: 'Cryomagnetotherapy',
      slug: 'noleggio-criomagnetoterapia',
      description:
        'CRYOCEMP cryomagnetotherapy for hire: PEMF magnetotherapy and compression cryotherapy in one treatment, to bring down pain, inflammation and oedema.',
      metaTitle: 'CRYOCEMP cryomagnetotherapy hire | Mia Medical Italia',
      metaDescription:
        'CRYOCEMP cryomagnetotherapy hire, combining PEMF magnetotherapy and compression cryotherapy. Treats muscle pain, inflammation and oedema. Delivery across Italy with support throughout.',
    },
  },

  specs: { ...includedAccessories, ...channels, ...programmes, ...treatmentPressure, ...treatmentTemperature, ...treatmentTimer, ...powerSupply, ...overallDimensions, ...weight, ...warranty, ...colour },
});
