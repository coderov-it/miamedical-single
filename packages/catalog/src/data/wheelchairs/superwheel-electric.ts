/**
 * Superwheel electric wheelchair (wpPostId 14542): joystick drive, 13–25 km
 * autonomy, folding and strippable for car transport. Load is the technical
 * 135 kg figure. A 400 € deposit applies, as an FAQ.
 */
import { deliveryAccess } from '../shared/questions.ts';
import { generalRental } from '../shared/terms.ts';
import { days } from '../shared/packages.ts';
import { wheelchairs } from './category.ts';

export const superwheelElectric = wheelchairs.rental({
  code: 'superwheel-electric',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  marketingRate: 12,
  packages: [days(3, 110), days(7, 160), days(15, 250), days(30, 390), days(45, 540)],

  chips: [
    { it: '25 km di autonomia', en: '25 km range' },
    { it: 'Joystick', en: 'Joystick' },
    { it: 'Portata 135 kg', en: '135 kg capacity' },
  ],

  translations: {
    it: {
      title: 'Noleggio carrozzina Elettrica Superwheel',
      slug: 'carrozzina-elettrica-superwheel-a-noleggio',
      shortDescription:
        'Libertà di movimento Noleggia la tua carrozzina elettrica Superwheel e riscopri la comodità di muoverti senza fatica! Completamente elettrica. Il ritiro in magazzino è gratuito. Siamo a Roma e Firenze.',
      description:
        '<p>La <strong>carrozzina elettrica Superwheel</strong> si guida con un solo <strong>joystick</strong>: direzione, velocità, schienale e pedane. Completamente <strong>smontabile e pieghevole</strong>, con cestello posteriore rimovibile.</p><h2><strong>Caratteristiche tecniche</strong></h2><ul><li>Seduta ergonomica da <strong>43 cm</strong>, schienale reclinabile con prolungamento per la testa</li><li>Autonomia <strong>13 km</strong>, fino a <strong>25 km</strong> con batterie al litio potenziate</li><li>Velocità massima <strong>8 km/h</strong>, motori 2 x 250W</li><li>Capacità di carico: <strong>135 kg</strong></li><li>Ruote pneumatiche 4x4 per tutti i terreni</li></ul><p>Consegna e ritiro a Roma e Firenze — consegna gratuita dai 30 giorni, ritiro in magazzino sempre gratuito.</p>',
      metaTitle: 'Carrozzina Elettrica Superwheel a noleggio',
      metaDescription:
        'Noleggio Carrozzina Elettrica Superwheel: l’alleato perfetto per muoverti senza limiti. Batteria fino a 25 km. Disponibilità immediata.',
    },
    en: {
      title: 'Superwheel electric wheelchair hire',
      shortDescription:
        'Freedom of movement. Hire your Superwheel electric wheelchair and rediscover effortless mobility! Fully electric. Free warehouse collection. We are in Rome and Florence.',
      description:
        '<p>The <strong>Superwheel electric wheelchair</strong> drives from a single <strong>joystick</strong>: direction, speed, backrest and leg rests. Fully <strong>strippable and folding</strong>, with removable rear basket.</p><h2><strong>Technical specs</strong></h2><ul><li>Ergonomic <strong>43 cm</strong> seat, reclining backrest with head extension</li><li>Range <strong>13 km</strong>, up to <strong>25 km</strong> with boosted lithium batteries</li><li>Top speed <strong>8 km/h</strong>, 2 x 250W motors</li><li>Load capacity: <strong>135 kg</strong></li><li>4x4 pneumatic wheels for all terrains</li></ul><p>Delivery and collection in Rome and Florence — free delivery from 30 days, warehouse collection always free.</p>',
      metaTitle: 'Superwheel electric wheelchair for hire',
      metaDescription:
        'Superwheel electric wheelchair hire: the perfect companion for limitless mobility. Battery up to 25 km. Immediate availability.',
    },
  },

  specs: {
    'max-load': 135,
    'seat-width': 43,
    foldable: true,
    'reclining-backrest': true,
    propulsion: 'electric',
  },

  media: {
    thumbnail: 'superwheel-electric-1.png',
    gallery: [
      {
        file: 'superwheel-electric-2.png',
        alt: { it: 'Ruota Superwheel', en: 'Superwheel wheel' },
      },
      { file: 'superwheel-electric-3.png', alt: { it: 'Joystick', en: 'Joystick' } },
      {
        file: 'superwheel-electric-4.png',
        alt: { it: 'Superwheel di lato', en: 'Superwheel from the side' },
      },
      { file: 'superwheel-electric-5.png', alt: { it: 'Superwheel', en: 'Superwheel' } },
      { file: 'superwheel-electric-6.png', alt: { it: 'Cestino posteriore', en: 'Rear basket' } },
    ],
  },

  faqs: [
    {
      question: { it: 'È richiesto un deposito?', en: 'Is a deposit required?' },
      answer: {
        it: 'Sì, per questo articolo è richiesto un deposito di 400 €.',
        en: 'Yes, a €400 deposit is required for this item.',
      },
    },
  ],

  questions: [...deliveryAccess],
  terms: [generalRental],
});
