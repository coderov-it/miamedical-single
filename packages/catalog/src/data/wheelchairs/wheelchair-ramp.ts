/**
 * Folding aluminium access ramp (wpPostId 8988): 91 × 73 cm, 7 kg, holds
 * 272 kg. The WP package list carries a 32-day €25 line — an obvious typo
 * for the 3-day tier every other product prices at €25, corrected here.
 */
import { deliveryAccess } from '../shared/questions.ts';
import { generalRental } from '../shared/terms.ts';
import { days } from '../shared/packages.ts';
import { wheelchairs } from './category.ts';

export const wheelchairRamp = wheelchairs.rental({
  code: 'wheelchair-ramp',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  marketingRate: 1.11,
  packages: [
    days(3, 25),
    days(7, 30),
    days(15, 35),
    days(30, 50),
    days(45, 65),
    days(60, 80),
    days(90, 100),
  ],

  chips: [
    { it: 'Portata 272 kg', en: '272 kg capacity' },
    { it: 'Pieghevole', en: 'Folding' },
    { it: 'Solo 7 kg', en: 'Only 7 kg' },
  ],

  translations: {
    it: {
      title: 'Noleggio rampa e pedane per disabili',
      slug: 'noleggio-rampa-pedana-per-disabili',
      shortDescription:
        'Noleggio e affitto rampa o pedana per disabili Noleggio per 1 giorno: 15€ con ritiro solamente in sede. Consegna e ritiro a domicilio solo a Roma e Firenze a partire da 30€. Il ritiro degli ausili in magazzino è gratuito.',
      description:
        '<p>La <strong>rampa a noleggio</strong> permette di superare gradini e ostacoli quotidiani in completa sicurezza — per sedie a rotelle, passeggini o per caricare la bicicletta in auto.</p><p>Realizzata in <strong>lega d\u2019alluminio</strong>, è leggera, resistente e duratura. La superficie antiscivolo in PVC e i bordi alti garantiscono la massima sicurezza. Si piega <strong>come una valigia</strong>, con maniglia per il trasporto a mano o in auto.</p><h2><strong>Caratteristiche principali</strong></h2><ul><li>Materiale: lega d\u2019alluminio resistente e leggera</li><li>Dimensioni: <strong>91 cm x 73 cm</strong></li><li>Peso: <strong>7 kg</strong></li><li>Carico massimo: <strong>272 kg</strong></li><li>Colori: argento e nero</li></ul><p>Ideale come soluzione temporanea o per eventi, senza acquistare una pedana permanente.</p>',
      metaTitle: 'Affitto rampe per le scale per disabili a noleggio',
      metaDescription:
        'Affitto rampe per le scale per disabili a noleggio: pedane leggere e pieghevoli per sedia a rotelle, passeggini e bici. Prenota ora!',
    },
    en: {
      title: 'Wheelchair access ramp hire',
      shortDescription:
        'Ramp hire. One-day hire: €15 with warehouse collection only. Home delivery and collection in Rome and Florence from €30. Free warehouse collection.',
      description:
        '<p>A <strong>hire ramp</strong> clears everyday steps and obstacles in full safety — for wheelchairs, pushchairs, or loading a bike into the car.</p><p>High-grade <strong>aluminium alloy</strong>: light, strong, durable. Anti-slip PVC surface and high edges for maximum safety. Folds <strong>like a suitcase</strong>, with a carry handle for hand or car transport.</p><h2><strong>Key features</strong></h2><ul><li>Material: strong, light aluminium alloy</li><li>Size: <strong>91 cm x 73 cm</strong></li><li>Weight: <strong>7 kg</strong></li><li>Maximum load: <strong>272 kg</strong></li><li>Colours: silver and black</li></ul><p>Ideal as a temporary fix or for events, with no permanent ramp to buy.</p>',
      metaTitle: 'Disability access ramps for hire',
      metaDescription:
        'Access ramps for hire: lightweight folding platforms for wheelchairs, pushchairs and bikes. Book now!',
    },
  },

  specs: {
    'max-load': 272,
    weight: { min: 7, max: 7 },
    'frame-material': 'aluminium',
    foldable: true,
  },

  media: {
    thumbnail: 'wheelchair-ramp-1.jpg',
    gallery: [
      { file: 'wheelchair-ramp-2.jpg', alt: { it: 'Rampa ripiegata', en: 'Folded ramp' } },
      { file: 'wheelchair-ramp-3.jpg', alt: { it: 'Come usare la rampa', en: 'How to use the ramp' } },
      { file: 'shared/rampa-pendenze.jpg', alt: { it: 'Pendenze consigliate', en: 'Recommended gradients' } },
      { file: 'shared/rampa-pendenze-2.png', alt: { it: 'Pendenze consigliate', en: 'Recommended gradients' } },
    ],
  },

  faqs: [
    {
      question: { it: 'Quanto misura la rampa aperta?', en: 'What size is the ramp when open?' },
      answer: { it: '91 × 73 cm. Chiusa diventa una valigia con maniglia, facile da caricare in auto.', en: '91 × 73 cm. Folded it becomes a suitcase with a handle, easy to load into a car.' },
    },
  ],

  questions: [...deliveryAccess],
  terms: [generalRental],
});
