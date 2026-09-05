/**
 * Occasione Usato in Vendita — product_cat 440, `usato-in-promozione`,
 * 6 products.
 *
 * Three used Fantastica electric wheelchairs and three used Tommy scooters, each
 * listed as its own product with its own price and its own condition notes — which
 * is right, because a second-hand machine is not interchangeable with another of
 * the same model. Two of the Fantasticas are 539,00 € and the third is 425,00 €,
 * and its page says why: "⚠️ Attenzione: senza cintura".
 *
 * `condition: used` is set on all six, and it is the only category where that
 * spec means anything.
 *
 * ⚠️ The site lists these same six products in BOTH `usato-in-promozione` (under
 * Vendita) and `in-promozione` (under Affitto e noleggio). They are filed here,
 * because all six are `simple` products with a sale price and no hire packages at
 * all. `used-deals-hire` is therefore empty — see its own file.
 *
 * ⚠️ Three of the six are out of stock on the live site (14363, 14380, 14386 and
 * 14395 — four, in fact). `stock: 0` records it.
 */
import { defineCategory } from '../../lib/define.ts';
import { condition, loadAndWeight } from '../shared/specs.ts';
import { foldable } from '../shared/specs-chassis.ts';
import { battery, batteryRange, controls, maxGradient, maxSpeed } from '../shared/specs-drive.ts';
import { propulsion } from '../shared/specs-mobility.ts';

export const usedDealsSale = defineCategory({
  code: 'used-deals-sale',
  position: 22,
  translations: {
    it: {
      name: 'Occasione Usato in Vendita',
      slug: 'usato-in-promozione',
      description:
        'Nella sezione Ausili Usati in Vendita di Mia Medical Italia trovi ausili usati sanificati, revisionati e garantiti: carrozzine, deambulatori, letti e sollevatori controllati dai tecnici Mia Medical.',
      metaTitle: 'Ausili Usati Garantiti | Occasioni Mia Medical',
      metaDescription:
        'Ausili per disabili usati sanificati e garantiti. Carrozzine, deambulatori, letti e sollevatori controllati dai tecnici Mia Medical.',
    },
    en: {
      name: 'Used Bargain for Sale',
      slug: 'usato-in-promozione',
      description:
        'The used-aids section of Mia Medical Italia carries second-hand equipment that has been sanitised, overhauled and guaranteed: wheelchairs, walking frames, beds and hoists, every one checked by Mia Medical’s own technicians.',
      metaTitle: 'Guaranteed used aids | Mia Medical bargains',
      metaDescription:
        'Second-hand disability aids, sanitised and guaranteed. Wheelchairs, walking frames, beds and hoists checked by Mia Medical technicians.',
    },
  },

  specs: { ...condition, ...propulsion, ...loadAndWeight, ...maxSpeed, ...batteryRange, ...maxGradient, ...battery, ...controls, ...foldable },
});
