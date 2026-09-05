/**
 * Sollevatori — product_cat 81, `noleggio-sollevatori`, 3 products.
 *
 * A boom hoist, a seated hoist and a folding bath hoist. Each page states its
 * load limit; only the bath hoist states its size and its weight.
 *
 * ⚠️ The seated hoist (11090) has a 30-day variation labelled "30 giorni -
 * 240 €" that charges 260 €. The charged price is the one written, since that
 * is what the shop takes. Listed in docs/catalog/README.md.
 *
 * No deposit on any of the three.
 */
import { defineCategory } from '../../lib/define.ts';
import { frameMaterial, loadAndWeight } from '../shared/specs.ts';
import { foldable, overallDimensions } from '../shared/specs-chassis.ts';
import { motor } from '../shared/specs-drive.ts';
import { hasSeat } from '../shared/specs-seating.ts';
import { includesSling } from '../shared/specs-bed.ts';

export const patientLiftsHire = defineCategory({
  code: 'patient-lifts-hire',
  position: 12,
  translations: {
    it: {
      name: 'Sollevatori',
      slug: 'noleggio-sollevatori',
      description:
        'Il noleggio di un sollevatore elettrico MIA Medical Italia è la soluzione professionale per facilitare i trasferimenti quotidiani di anziani e persone con mobilità ridotta, riducendo lo sforzo fisico dei caregiver e aumentando sicurezza, comfort e dignità della persona assistita.',
      metaTitle: 'Sollevatori Archives - Mia Medical Italia',
      metaDescription:
        'Offriamo un servizio di noleggio di sollevatore elettrico per anziani e persone con disabilità, con consegna rapida, installazione professionale e forfait flessibil.',
    },
    en: {
      name: 'Patient hoists',
      slug: 'noleggio-sollevatori',
      description:
        'Hiring an electric patient hoist from MIA Medical Italia makes the daily business of moving an older person or someone with reduced mobility manageable: it takes the physical strain off whoever is caring for them, and it keeps the person being lifted safe, comfortable and treated with dignity.',
      metaTitle: 'Patient hoist hire | Mia Medical Italia',
      metaDescription:
        'Electric patient hoist hire for older and disabled people: quick delivery, professional installation and flexible packages.',
    },
  },

  specs: {
    ...loadAndWeight,
    ...overallDimensions,
    ...motor,
    ...frameMaterial,
    ...hasSeat,
    ...includesSling,
    ...foldable,
  },
});
