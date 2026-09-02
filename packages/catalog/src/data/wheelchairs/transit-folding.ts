/**
 * The smallest a product gets: identity, price, title, and nothing else.
 *
 * Everything omitted here takes a database default — `status` is `draft`,
 * `stock` is 0, `isFeatured` is false, `chips` and `media` are empty. A product
 * with no photo still imports; it falls back to the category icon on the card.
 */
import { shortStay } from '../shared/tiers.ts';
import { wheelchairs } from './category.ts';

export const transitFolding = wheelchairs.rental({
  code: 'transit-folding',
  status: 'active',
  stock: 6,

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: shortStay(['25.00', '30.00', '35.00', '50.00', '65.00']),

  translations: {
    it: {
      title: 'Carrozzina pieghevole da transito',
      slug: 'noleggio-carrozzina-pieghevole-da-transito',
    },
  },

  specs: {
    'max-load': 100,
    'seat-width': 43,
    'frame-material': 'steel',
    foldable: true,
    propulsion: 'transit',
  },

  media: { thumbnail: 'transit-folding-1.jpg' },
});
