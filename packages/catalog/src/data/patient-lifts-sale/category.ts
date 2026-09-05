/**
 * Vendita Sollevatori — product_cat 534, `vendita-sollevatori`, 2 products.
 *
 * The GO UP and the folding SOFT bath hoist, sold outright. The SOFT's page
 * repeats the hire listing's measurements word for word, so it carries them;
 * the GO UP states only its load limit.
 */
import { defineCategory } from '../../lib/define.ts';
import { loadAndWeight } from '../shared/specs.ts';
import { foldable, overallDimensions } from '../shared/specs-chassis.ts';
import { hasSeat } from '../shared/specs-seating.ts';
import { includesSling } from '../shared/specs-bed.ts';

export const patientLiftsSale = defineCategory({
  code: 'patient-lifts-sale',
  position: 30,
  translations: {
    it: {
      name: 'Vendita Sollevatori',
      slug: 'vendita-sollevatori',
      description:
        'L’acquisto di un sollevatore elettrico MIA Medical Italia rappresenta la soluzione ideale per garantire trasferimenti sicuri e comodi di anziani e persone con mobilità ridotta, riducendo lo sforzo fisico dei caregiver e migliorando comfort, sicurezza e dignità della persona assistita.',
      metaTitle: 'Vendita Sollevatori Elettrici | MIA Medical Italia',
      metaDescription:
        'Acquista sollevatori elettrici per anziani e disabili. Sicurezza, comfort e consegna rapida a Roma e Firenze. Visita il sito per maggiori informazioni',
    },
    en: {
      name: 'Patient hoists for sale',
      slug: 'vendita-sollevatori',
      description:
        'Buying an electric patient hoist from MIA Medical Italia is the way to make transfers safe and comfortable for an older person or someone with reduced mobility, while taking the physical strain off whoever cares for them.',
      metaTitle: 'Electric patient hoists for sale | MIA Medical Italia',
      metaDescription:
        'Buy an electric patient hoist for older or disabled users. Safety, comfort and quick delivery in Rome and Florence.',
    },
  },

  specs: {
    ...loadAndWeight,
    ...overallDimensions,
    ...hasSeat,
    ...includesSling,
    ...foldable,
  },
});
