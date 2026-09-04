/**
 * Short folding access ramp (wpPostId 12361): same 91 × 73 cm, 7 kg,
 * 272 kg aluminium build as `wheelchair-ramp.ts`, sold as its own product.
 */
import { deliveryAccess } from '../shared/questions.ts';
import { generalRental } from '../shared/terms.ts';
import { days } from '../shared/packages.ts';
import { wheelchairs } from './category.ts';

export const wheelchairRampShort = wheelchairs.rental({
  code: 'wheelchair-ramp-short',
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
      title: 'Noleggio rampa e pedane corta per disabili',
      slug: 'noleggio-rampa-e-pedane-corta-per-disabili',
      shortDescription:
        'Noleggio rampa o pedana per disabili Consegna e ritiro a domicilio solo a Roma e Firenze a partire da 30€. Noleggio per 1 giorno: 15€ con ritiro solamente in sede. Il ritiro degli ausili in magazzino è gratuito.',
      description:
        '<p>La <strong>rampa corta a noleggio</strong> in lega d\u2019alluminio supera gradini o aiuta a salire in auto — per sedie a rotelle, passeggini o biciclette. Superficie in <strong>PVC antiscivolo</strong>, bordi alti, maniglia per il trasporto.</p><h2><strong>Caratteristiche principali</strong></h2><ul><li>Materiale: lega d\u2019alluminio resistente e leggera</li><li>Dimensioni: <strong>91 cm x 73 cm</strong></li><li>Peso: <strong>7 kg</strong></li><li>Carico massimo: <strong>272 kg</strong></li><li>Colori: argento e nero</li></ul><p>Ideale per uso temporaneo o eventi, senza acquistare una pedana permanente.</p>',
      metaTitle: 'Affitto rampe per le scale per disabili a noleggio.',
      metaDescription:
        'Noleggio rampe per le scale per disabili: pedane leggere, antiscivolo, ideali per sedie a rotelle, passeggini o biciclette. Prenota ora!',
    },
    en: {
      title: 'Short disability ramp hire',
      shortDescription:
        'Ramp hire. Home delivery and collection in Rome and Florence from €30. One-day hire: €15 with warehouse collection only. Free warehouse collection.',
      description:
        '<p>A <strong>short hire ramp</strong> in aluminium alloy clears steps or loads a car — for wheelchairs, pushchairs or bikes. <strong>Anti-slip PVC</strong> surface, high edges, carry handle.</p><h2><strong>Key features</strong></h2><ul><li>Material: strong, light aluminium alloy</li><li>Size: <strong>91 cm x 73 cm</strong></li><li>Weight: <strong>7 kg</strong></li><li>Maximum load: <strong>272 kg</strong></li><li>Colours: silver and black</li></ul><p>Ideal for temporary use or events, with no permanent ramp to buy.</p>',
      metaTitle: 'Disability access ramps for hire.',
      metaDescription:
        'Disability access ramp hire: lightweight, anti-slip platforms for wheelchairs, pushchairs or bikes. Book now!',
    },
  },

  specs: {
    'max-load': 272,
    weight: { min: 7, max: 7 },
    'frame-material': 'aluminium',
    foldable: true,
  },

  media: {
    thumbnail: 'wheelchair-ramp-short-1.jpg',
    gallery: [
      { file: 'wheelchair-ramp-short-2.jpg', alt: { it: 'Rampa corta', en: 'Short ramp' } },
      {
        file: 'shared/rampa-pendenze.jpg',
        alt: { it: 'Pendenze consigliate', en: 'Recommended gradients' },
      },
      {
        file: 'shared/rampa-pendenze-2.png',
        alt: { it: 'Pendenze consigliate', en: 'Recommended gradients' },
      },
    ],
  },

  faqs: [
    {
      question: { it: 'Quanto misura la rampa aperta?', en: 'What size is the ramp when open?' },
      answer: {
        it: '91 × 73 cm. Chiusa diventa una valigia con maniglia, facile da caricare in auto.',
        en: '91 × 73 cm. Folded it becomes a suitcase with a handle, easy to load into a car.',
      },
    },
  ],

  questions: [...deliveryAccess],
  terms: [generalRental],
});
