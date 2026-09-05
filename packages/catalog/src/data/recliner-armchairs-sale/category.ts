/**
 * Vendita Poltrone Reclinabili — product_cat 536, `vendita-poltrone-reclinabili`,
 * 1 product.
 *
 * A category of one: the Lady Slim Plus. Its page states a load limit and the
 * three overall dimensions, which is all the specs carry.
 */
import { defineCategory } from '../../lib/define.ts';
import { colour, loadAndWeight, upholstery } from '../shared/specs.ts';
import { overallDimensions } from '../shared/specs-chassis.ts';
import { recliningBackrest, removableArmrests, seatWidth } from '../shared/specs-seating.ts';

export const reclinerArmchairsSale = defineCategory({
  code: 'recliner-armchairs-sale',
  position: 27,
  translations: {
    it: {
      name: 'Vendita Poltrone Reclinabili',
      slug: 'vendita-poltrone-reclinabili',
      description:
        'La vendita della poltrona reclinabile Lady Slim Plus di MIA Medical Italia offre la soluzione perfetta per chi cerca comfort, praticità e design elegante, ideale anche in spazi ridotti.',
      metaTitle: 'Poltrona Reclinabile Lady Slim Plus | Comfort e Relax a Casa',
      metaDescription:
        'Acquista la poltrona reclinabile Lady Slim Plus: design compatto, comfort superiore, facile da usare e consegna rapida.',
    },
    en: {
      name: 'Recliner armchairs for sale',
      slug: 'vendita-poltrone-reclinabili',
      description:
        'The Lady Slim Plus recliner from MIA Medical Italia is for anyone who wants comfort and a chair that looks good without giving up floor space.',
      metaTitle: 'Lady Slim Plus recliner | Comfort and relaxation at home',
      metaDescription:
        'Buy the Lady Slim Plus recliner: compact, very comfortable, easy to use and delivered quickly.',
    },
  },

  specs: { ...loadAndWeight, ...overallDimensions, ...seatWidth, ...recliningBackrest, ...removableArmrests, ...upholstery, ...colour },
});
