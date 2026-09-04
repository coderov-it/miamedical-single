/**
 * Bariatric wheelchair (wpPostId 9045): 60 cm seat, 20 kg steel build.
 * Load rating is the meta's explicit "Portata massima 250 kg".
 */
import { pressureReliefCushion } from '../shared/addons.ts';
import { deliveryAccess } from '../shared/questions.ts';
import { generalRental } from '../shared/terms.ts';
import { days } from '../shared/packages.ts';
import { wheelchairs } from './category.ts';

export const bariatricWheelchair = wheelchairs.rental({
  code: 'bariatric-wheelchair',
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
    { it: 'Seduta 60 cm', en: '60 cm seat' },
    { it: 'Portata 250 kg', en: '250 kg capacity' },
    { it: 'Pieghevole', en: 'Folding' },
  ],

  translations: {
    it: {
      title: 'Affitto carrozzina bariatrica per pazienti obesi',
      slug: 'affitto-carrozzina-pieghevole-per-pazienti-obesi-bariatrica',
      shortDescription:
        'Noleggio Sedia a rotelle pieghevole bariatrica Noleggio per 1 giorno: 15€ con ritiro solamente in sede. Il ritiro in magazzino è GRATUITO! Prenota subito online! Consegna e ritiro a domicilio a Roma e Firenze da 30€.',
      description:
        '<p>La <strong>carrozzina bariatrica</strong> è rinforzata per pazienti oltre i 130 kg: seduta da <strong>60 cm</strong>, ingombro totale 80 cm, peso 20 kg.</p><p>È <strong>pieghevole</strong>, così si carica in macchina con comodità. Ogni ausilio viene <strong>sanificato in ogni sua parte</strong>.</p><p>Per chi passa molte ore seduto è disponibile un <strong>cuscino antidecubito</strong> a prezzo dedicato.</p>',
      metaTitle: 'Affitto carrozzina pieghevole per pazienti obesi',
      metaDescription:
        'Affitto carrozzina pieghevole per pazienti obesi / bariatrica. Portata massima 250 kg. Disponibilità immediata. Contattaci al +393926509237',
    },
    en: {
      title: 'Bariatric wheelchair hire for obese patients',
      shortDescription:
        'Folding bariatric wheelchair hire. One-day hire: €15 with warehouse collection only. Warehouse collection is FREE! Book online now! Home delivery and collection in Rome and Florence from €30.',
      description:
        '<p>A reinforced <strong>bariatric wheelchair</strong> for patients over 130 kg: <strong>60 cm</strong> seat, 80 cm overall, 20 kg.</p><p>It <strong>folds</strong>, so it loads into a car with ease. Every aid is <strong>sanitized throughout</strong>.</p><p>Long hours seated? An <strong>anti-decubitus cushion</strong> is available at a dedicated price.</p>',
      metaTitle: 'Folding wheelchair hire for obese patients',
      metaDescription:
        'Folding wheelchair / bariatric hire for obese patients. 250 kg maximum load. Immediate availability. Call us on +393926509237',
    },
  },

  specs: {
    'max-load': 250,
    'seat-width': 60,
    weight: { min: 20, max: 20 },
    foldable: true,
  },

  media: {
    thumbnail: 'bariatric-wheelchair-1.jpg',
    gallery: [
      { file: 'shared/pedane-elevabile.jpg', alt: { it: 'Alzata per gesso', en: 'Cast leg rest' } },
    ],
  },

  addons: [pressureReliefCushion],

  faqs: [
    {
      question: { it: 'Entra in macchina da chiusa?', en: 'Does it fit in a car when folded?' },
      answer: {
        it: 'Sì: è pieghevole ed è pensata per essere caricata in auto, nonostante la struttura rinforzata.',
        en: 'Yes: it folds and is designed to load into a car, despite its reinforced build.',
      },
    },
  ],

  questions: [...deliveryAccess],
  terms: [generalRental],
});
