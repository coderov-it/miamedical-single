/**
 * Occasione usato — product_cat 93, `in-promozione`, and EMPTY on purpose.
 *
 * The site's own count for this term is 6, and they are the same six products
 * as `usato-in-promozione` (440): three used Fantastica wheelchairs and three
 * used Tommy scooters, each filed under both terms. Every one of the six is a
 * `simple` product with a sale price and no hire packages at all — so they are
 * all in `used-deals-sale`, and this category keeps its name, its slug and its
 * copy while holding nothing.
 *
 * It is not deleted, because the term exists on the live site and its URL is
 * indexed. Nor is a product duplicated into it: one product, one category.
 */
import { defineCategory } from '../../lib/define.ts';
import { condition } from '../shared/specs.ts';

export const usedDealsHire = defineCategory({
  code: 'used-deals-hire',
  position: 10,
  translations: {
    it: {
      name: 'Occasione usato',
      slug: 'in-promozione',
      description:
        'Ausili usati sanificati, revisionati e garantiti: carrozzine, deambulatori, letti e sollevatori controllati dai tecnici Mia Medical.',
      metaTitle: 'Occasione usato Archives - Mia Medical Italia',
    },
    en: {
      name: 'Second-hand bargains',
      slug: 'in-promozione',
      description:
        'Second-hand aids, sanitised, overhauled and guaranteed: wheelchairs, walking frames, beds and hoists, every one checked by Mia Medical’s own technicians.',
      metaTitle: 'Second-hand bargains | Mia Medical Italia',
    },
  },

  specs: { ...condition },
});
