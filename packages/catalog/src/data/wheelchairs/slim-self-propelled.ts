/**
 * One product, one file. The file name is the product, so a diff on it is a
 * diff on that product and nothing else.
 *
 * `wheelchairs.rental(…)` is the rental constructor: it requires `rentalUnit`
 * and at least one package, and it has no `basePrice` field at all — which is
 * `products_rental_unit_check`, `products_rental_packages_check` and
 * `products_base_price_check` made unrepresentable rather than merely rejected.
 */
import { pressureReliefCushion } from '../shared/addons.ts';
import { deliveryAccess } from '../shared/questions.ts';
import { generalRental } from '../shared/terms.ts';
import { days } from '../shared/packages.ts';
import { wheelchairs } from './category.ts';

export const slimSelfPropelled = wheelchairs.rental({
  /**
   * Identity and the uuid seed. Renaming it mints a DIFFERENT product and
   * leaves the old row behind — the slug is what gets rewritten for SEO, never
   * this.
   */
  code: 'slim-self-propelled',
  status: 'active',
  stock: 12,
  isFeatured: true,

  pricingMode: 'rental',
  rentalUnit: 'day',
  /** Display copy — "da 1,10 € al giorno". No total ever reads it. */
  marketingRate: 1.1,
  /**
   * THE price of the product. Not a rate times a duration — the shop means
   * every one of these amounts separately, which is why each is typed.
   */
  packages: [
    /**
     * Named for what it is rather than for how long it runs, so it carries its
     * own code and its own copy instead of going through `days()`.
     */
    {
      duration: 2,
      unit: 'day',
      price: 20,
      code: 'weekend',
      name: { it: 'Weekend', en: 'Weekend' },
    },
    days(7, 30),
    days(15, 35),
    days(30, 50),
    days(45, 65),
    days(60, 80),
    days(90, 110),
  ],

  chips: [{ it: 'Portata 100 kg' }, { it: 'Pieghevole' }, { it: 'Solo 13 kg' }],

  translations: {
    it: {
      title: 'Affitto carrozzina di piccole dimensioni ad autospinta - SLIM',
      /** The URL the old site has ranked for years. Pinned, never derived. */
      slug: 'affitto-carrozzina-per-disabili-di-piccole-dimensioni-autospinta-slim',
      shortDescription:
        'Sedia a rotelle piccola, adatta a chi ha poco spazio. Ritiro e riconsegna in magazzino gratuiti.',
      description:
        '<p>Carrozzina ad autospinta con telaio in alluminio verniciato.</p><ul><li>Braccioli estraibili</li><li>Pedane elevabili</li></ul>',
      metaTitle: 'Noleggio carrozzina piccola SLIM | Mia Medical',
      metaDescription:
        'Carrozzina ad autospinta di piccole dimensioni, ideale per passaggi stretti.',
    },
  },

  /** Only keys `category.ts` declared, with the value type it declared. */
  specs: {
    'max-load': 100,
    'seat-width': 39,
    weight: { min: 13, max: 14 },
    'frame-material': 'aluminium',
    foldable: true,
    propulsion: 'self-propelled',
    closedWidth: 26,
  },

  media: {
    thumbnail: 'slim-self-propelled-1.jpg',
    gallery: [
      'slim-self-propelled-2.jpg',
      { file: 'slim-self-propelled-folded.jpg', alt: { it: 'Carrozzina ripiegata' } },
    ],
    documents: ['slim-self-propelled-datasheet.pdf'],
  },

  /** A rental product may carry both add-on modes. A fixed one may not. */
  addons: [pressureReliefCushion],

  faqs: [
    {
      question: { it: "La carrozzina entra nel bagagliaio di un'utilitaria?" },
      answer: { it: 'Sì. Ripiegata misura 78 x 26 x 90 cm.' },
    },
  ],

  questions: [...deliveryAccess],
  terms: [generalRental],
});
