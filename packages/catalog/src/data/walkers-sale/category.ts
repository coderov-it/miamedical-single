/**
 * Vendita deambulatori e rollatori — product_cat 531,
 * `vendita-deambulatori-rollator`, 6 products.
 *
 * The same six aids the hire category lists, sold outright. Only two of the
 * pages print measurements — the aluminium rollator (8996), which prints a full
 * block, and the Mini (14638), which prints three figures inside its selling
 * points. The rest say nothing measurable, and nothing is invented for them.
 *
 * Every page offers free shipping across Italy, so no delivery add-on.
 */
import { defineCategory } from '../../lib/define.ts';
import { colour, frameMaterial, loadAndWeight, upholstery } from '../shared/specs.ts';
import {
  adjustableHeight,
  brakes,
  foldable,
  foldedSize,
  overallDimensions,
  wheelDiameter,
} from '../shared/specs-chassis.ts';
import { hasSeat, recliningBackrest, seatHeight } from '../shared/specs-seating.ts';

export const walkersSale = defineCategory({
  code: 'walkers-sale',
  position: 19,
  translations: {
    it: {
      name: 'Vendita deambulatori e rollatori',
      slug: 'vendita-deambulatori-rollator',
      description:
        'Deambulatori e rollatori in vendita: ausili leggeri, pieghevoli e certificati per camminare in sicurezza in casa e fuori. Spedizione gratuita in tutta Italia.',
      metaTitle: 'Vendita deambulatori e rollatori - Mia Medical Italia',
      metaDescription:
        'Acquista deambulatori e rollatori pieghevoli in alluminio: leggeri, resistenti, con freni e seduta. Spedizione gratuita in tutta Italia.',
    },
    en: {
      name: 'Walkers and rollators for sale',
      slug: 'vendita-deambulatori-rollator',
      description:
        'Walking frames and rollators to buy: light, folding, certified aids for getting about safely indoors and out. Free shipping across Italy.',
      metaTitle: 'Walkers and rollators for sale - Mia Medical Italia',
      metaDescription:
        'Buy a folding aluminium walker or rollator: light, sturdy, with brakes and a seat. Free shipping across Italy.',
    },
  },

  specs: {
    ...loadAndWeight,
    ...adjustableHeight,
    ...overallDimensions,
    ...foldedSize,
    ...hasSeat,
    ...seatHeight,
    ...recliningBackrest,
    ...upholstery,
    ...wheelDiameter,
    ...brakes,
    ...frameMaterial,
    ...colour,
    ...foldable,
  },
});
