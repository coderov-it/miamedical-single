/**
 * Pediatric folding wheelchair, Jazz S50 Kids (wpPostId 12321): aluminium,
 * 60 kg load, adjustable seat. No fixed seat figure exists, so `seat-width`
 * stays out.
 */
import { deliveryAccess } from '../shared/questions.ts';
import { generalRental } from '../shared/terms.ts';
import { days } from '../shared/packages.ts';
import { wheelchairs } from './category.ts';

export const pediatricWheelchair = wheelchairs.rental({
  code: 'pediatric-wheelchair',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  marketingRate: 1.11,
  packages: [days(7, 30), days(15, 35), days(30, 50), days(45, 65), days(60, 80), days(90, 100)],

  chips: [
    { it: 'Jazz S50 Kids', en: 'Jazz S50 Kids' },
    { it: 'Portata 60 kg', en: '60 kg capacity' },
    { it: 'Pieghevole', en: 'Folding' },
  ],

  translations: {
    it: {
      title: 'Noleggio Carrozzina Pediatrica Pieghevole',
      slug: 'noleggio-carrozzina-pediatrica-pieghevole-per-bambini-con-alzata-per-il-gesso',
      shortDescription:
        'Noleggio Carrozzina Il ritiro e la riconsegna delle carrozzine in magazzino è gratuito! Noleggio per 1 giorno: 15€ con ritiro solamente in sede. Disponibilità immediata. Prenota online o contattaci tramite WhatsApp! Consegna e ritiro a domicilio a Roma e Firenze da 30€.',
      description:
        '<p>La <strong>carrozzina pediatrica pieghevole Jazz S50 Kids</strong> è progettata per bambini dai 2 anni in su con disabilità motorie temporanee o permanenti: maggiore supporto posturale, misure ridotte, materiali leggeri.</p><h2><strong>Specifiche tecniche</strong></h2><ul><li>Telaio pieghevole in <strong>alluminio leggero</strong></li><li>Portata massima: <strong>60 kg</strong></li><li>Peso: <strong>16,9 kg</strong></li><li>Seduta <strong>regolabile in larghezza e profondità</strong></li><li>Ruote posteriori da 22\u201d con sgancio rapido, anteriori da 6\u201d</li><li>Pedane regolabili ed estraibili, braccioli ribaltabili</li></ul><p>Ideale per il trasporto in auto e gli ambienti pubblici. Dispositivi igienizzati e revisionati, assistenza tecnica inclusa.</p>',
      metaTitle: 'Noleggio Carrozzina Pediatrica Pieghevole',
      metaDescription:
        'Noleggio carrozzina pediatrica pieghevole Jazz S50 Kids, dai 2 anni in su, con alzata per il gesso. Disponibilità immediata. Contattaci al +393926509237',
    },
    en: {
      title: 'Pediatric folding wheelchair hire',
      shortDescription:
        'Wheelchair hire. Warehouse collection and return are free! One-day hire: €15 with warehouse collection only. Immediate availability. Book online or contact us on WhatsApp! Home delivery and collection in Rome and Florence from €30.',
      description:
        '<p>The <strong>Jazz S50 Kids folding pediatric wheelchair</strong> is built for children aged 2 and up with temporary or permanent motor disabilities: more postural support, smaller sizes, light materials.</p><h2><strong>Technical specs</strong></h2><ul><li>Folding frame in <strong>light aluminium</strong></li><li>Maximum load: <strong>60 kg</strong></li><li>Weight: <strong>16.9 kg</strong></li><li>Seat <strong>adjustable in width and depth</strong></li><li>22” quick-release rear wheels, 6” front wheels</li><li>Adjustable, removable leg rests, flip-up armrests</li></ul><p>Ideal for car transport and public spaces. Sanitized, serviced devices with technical support included.</p>',
      metaTitle: 'Pediatric folding wheelchair hire',
      metaDescription:
        'Jazz S50 Kids folding pediatric wheelchair hire, for ages 2 and up, with cast leg rest. Immediate availability. Contact us on +393926509237',
    },
  },

  specs: {
    'max-load': 60,
    weight: { min: 16.9, max: 16.9 },
    'frame-material': 'aluminium',
    foldable: true,
  },

  media: {
    thumbnail: 'pediatric-wheelchair-1.jpg',
    gallery: [
      {
        file: 'pediatric-wheelchair-2.jpg',
        alt: { it: 'Carrozzina pediatrica', en: 'Pediatric wheelchair' },
      },
      {
        file: 'pediatric-wheelchair-3.jpg',
        alt: { it: 'Carrozzina pediatrica di lato', en: 'Pediatric wheelchair from the side' },
      },
      {
        file: 'shared/pedane-elevabile-1.jpg',
        alt: { it: 'Pedane elevabili estraibili', en: 'Removable elevating leg rests' },
      },
    ],
  },

  faqs: [
    {
      question: { it: 'Il bambino ha il gesso?', en: 'Does the child have a cast?' },
      answer: {
        it: 'È disponibile l’alzata per il gesso: basta comunicarlo al momento della prenotazione.',
        en: 'A cast leg rest is available: just tell us when booking.',
      },
    },
  ],

  questions: [...deliveryAccess],
  terms: [generalRental],
});
