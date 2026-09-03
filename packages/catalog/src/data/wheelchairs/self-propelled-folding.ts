/**
 * Standard self-propelled folding wheelchair (wpPostId 9079): seats 40–50,
 * big wheels for independent movement. The free leg lift from the text is
 * an FAQ, the cushion offer an add-on.
 */
import { pressureReliefCushion } from '../shared/addons.ts';
import { deliveryAccess } from '../shared/questions.ts';
import { generalRental } from '../shared/terms.ts';
import { days } from '../shared/packages.ts';
import { wheelchairs } from './category.ts';

export const selfPropelledFolding = wheelchairs.rental({
  code: 'self-propelled-folding',
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
    { it: 'Autospinta', en: 'Self-propelled' },
    { it: 'Pieghevole', en: 'Folding' },
    { it: 'Portata 130 kg', en: '130 kg capacity' },
  ],

  translations: {
    it: {
      title: 'Affitto carrozzina pieghevole ad autospinta',
      slug: 'affitto-carrozzina-pieghevole-ad-autospinta-spedizioni-in-tutta-italia',
      shortDescription:
        'Sedia a rotelle ad autospinta Comoda e leggera, facile da caricare in macchina. Carrozzina con seduta e telaio pieghevole per massima praticità. Noleggio per 1 giorno: 15€ con ritiro solamente in sede. Consegna e ritiro a domicilio a Roma e Firenze da 30€.',
      description:
        '<p>La <strong>carrozzina pieghevole ad autospinta</strong> è leggera e robusta: pedane e braccioli <strong>removibili con facilità</strong>, due freni di stazionamento, telaio pieghevole facile da caricare in macchina.</p><p>Le <strong>ruote grandi</strong> permettono di spostarsi in autonomia — si distinguono da quelle da transito per diametro e posizione sul telaio.</p><h2><strong>Misure</strong></h2><ul><li>Sedute da <strong>40 a 50 cm</strong></li><li>Peso da <strong>14 a 18 kg</strong> secondo la seduta</li><li>Portata fino a <strong>130 kg</strong></li></ul><p>Ogni ausilio è <strong>sanificato in ogni sua parte</strong>. Noleggi in Toscana e Lazio, spedizioni in tutta Italia.</p>',
      metaTitle: 'Affitto carrozzina pieghevole ad autospinta. Spedizioni in tutta Italia',
      metaDescription:
        'Affitto carrozzina pieghevole ad autospinta. Molto leggera è facile da caricare in macchina. Spedizioni in tutta Italia, ritiro GRATUITO in magazzino.',
    },
    en: {
      title: 'Folding self-propelled wheelchair hire',
      shortDescription:
        'Self-propelled wheelchair. Comfortable and light, easy to load into a car. Wheelchair with folding seat and frame for maximum convenience. One-day hire: €15 with warehouse collection only. Home delivery and collection in Rome and Florence from €30.',
      description:
        '<p>A <strong>folding self-propelled wheelchair</strong>, light yet very sturdy: leg rests and armrests <strong>remove in seconds</strong>, two parking brakes, a frame that folds for easy car loading.</p><p>The <strong>big wheels</strong> mean independent movement — wider in diameter and set differently on the frame than transit wheels.</p><h2><strong>Sizes</strong></h2><ul><li>Seats from <strong>40 to 50 cm</strong></li><li>Weight from <strong>14 to 18 kg</strong> by seat size</li><li>Load up to <strong>130 kg</strong></li></ul><p>Every aid is <strong>sanitized throughout</strong>. Hire in Tuscany and Lazio, courier delivery across Italy.</p>',
      metaTitle: 'Folding self-propelled wheelchair hire. Deliveries across Italy',
      metaDescription:
        'Folding self-propelled wheelchair hire. Very light and easy to load into a car. Deliveries across Italy, FREE warehouse collection.',
    },
  },

  specs: {
    'max-load': 130,
    'seat-width': 40,
    weight: { min: 14, max: 18 },
    foldable: true,
    propulsion: 'self-propelled',
  },

  media: {
    thumbnail: 'self-propelled-folding-1.jpg',
    gallery: [
      { file: 'self-propelled-folding-2.jpg', alt: { it: 'Carrozzina ripiegata', en: 'Folded wheelchair' } },
      { file: 'shared/pedane-elevabile-1.jpg', alt: { it: 'Pedane elevabili estraibili', en: 'Removable elevating leg rests' } },
    ],
  },

  addons: [pressureReliefCushion],

  faqs: [
    {
      question: { it: 'Il paziente ha il gesso o deve tenere la gamba sollevata?', en: 'Does the patient have a cast or need to keep a leg raised?' },
      answer: { it: "L'alzata è gratuita: basta comunicarlo al momento della prenotazione.", en: 'The leg rest is free: just tell us when booking.' },
    },
  ],

  questions: [...deliveryAccess],
  terms: [generalRental],
});
