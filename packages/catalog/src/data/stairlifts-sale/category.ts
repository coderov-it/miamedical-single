/**
 * Vendita Montascale — product_cat 533, `vendita-montascale`, 2 products.
 *
 * The Easystep tracked chair and the Easystep wheelchair climber, sold outright.
 *
 * ⚠️ The tracked chair's page states "Portata massima: fino a 169 kg" where its
 * hire twin says nothing, and the wheelchair climber's page states no load at all
 * where its hire twin says 160 kg. Each product carries what its OWN page says.
 */
import { defineCategory } from '../../lib/define.ts';
import { colour, frameMaterial, loadAndWeight } from '../shared/specs.ts';
import { foldable, foldedSize, overallDimensions } from '../shared/specs-chassis.ts';
import { battery, batteryRange, maxSpeed, motor } from '../shared/specs-drive.ts';
import { seatWidth } from '../shared/specs-seating.ts';

export const stairliftsSale = defineCategory({
  code: 'stairlifts-sale',
  position: 26,
  translations: {
    it: {
      name: 'Vendita Montascale',
      slug: 'vendita-montascale',
      description:
        'La vendita di montascale offre una soluzione definitiva per superare le barriere architettoniche in sicurezza e in autonomia, senza dover ricorrere a interventi strutturali complessi.',
      metaTitle: 'Vendita Montascale | MIA Medical',
      metaDescription:
        'Acquista il montascale di MIA Medical: montascale sicuro, ergonomico e facile da usare. Consegna e installazione a domicilio.',
    },
    en: {
      name: 'Stairlifts for sale',
      slug: 'vendita-montascale',
      description:
        'Buying a stair climber settles the problem of a flight of stairs for good — safely, under your own control, and without complicated building work.',
      metaTitle: 'Stair climbers for sale | MIA Medical',
      metaDescription:
        'Buy a MIA Medical stair climber: safe, ergonomic and easy to use, delivered and installed at home.',
    },
  },

  specs: { ...loadAndWeight, ...maxSpeed, ...batteryRange, ...motor, ...battery, ...overallDimensions, ...foldedSize, ...seatWidth, ...frameMaterial, ...colour, ...foldable },
});
