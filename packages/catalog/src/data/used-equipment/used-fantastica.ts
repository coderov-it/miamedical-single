/**
 * A fixed-price product — bought outright.
 *
 * `usedEquipment.fixed(…)` requires a `basePrice` and offers no `packages`,
 * `rentalUnit` or `marketingRate` at all. Its `addons` accept `FixedAddon`
 * only: a per-day add-on on something sold has no period to bill against,
 * which is `product_addons_mode_check`.
 */
import { packaging } from '../shared/addons.ts';
import { salesTerms } from '../shared/terms.ts';
import { usedEquipment } from './category.ts';

export const usedFantastica = usedEquipment.fixed({
  code: 'used-fantastica-power-smart',
  status: 'active',
  brand: 'Fantastica',
  stock: 1,

  pricingMode: 'fixed',
  basePrice: 539,

  translations: {
    it: {
      title: 'Carrozzina elettrica usata Fantastica Power Smart',
      slug: 'vendita-carrozzina-usata-modello-fantastica-power-smart',
      shortDescription:
        'Carrozzina elettrica pieghevole, 16 kg senza batteria, joystick ambidestro.',
      description: '<p>Chiusura a libretto, batteria estraibile, portata fino a 130 kg.</p>',
    },
  },

  specs: {
    condition: 'used',
    'max-load': 130,
    'seat-width': 45,
    'warranty-months': 12,
  },

  media: { thumbnail: 'used-fantastica-1.jpg', gallery: ['used-fantastica-2.jpg'] },

  addons: [packaging],
  terms: [salesTerms],
});
