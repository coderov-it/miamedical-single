/**
 * Reclining wheelchair (wpPostId 9034): steel frame, 600 mm rear wheels,
 * headrest and leg lift. Spec figures come from the English mia_compare
 * rows, the only product that carries them.
 */
import { pressureReliefCushion } from '../shared/addons.ts';
import { deliveryAccess } from '../shared/questions.ts';
import { generalRental } from '../shared/terms.ts';
import { days } from '../shared/packages.ts';
import { wheelchairs } from './category.ts';

export const recliningWheelchair = wheelchairs.rental({
  code: 'reclining-wheelchair',
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
    { it: 'Reclinabile', en: 'Reclining' },
    { it: 'Portata 120 kg', en: '120 kg capacity' },
    { it: 'Pieghevole', en: 'Folding' },
  ],

  translations: {
    it: {
      title: 'Noleggio Carrozzina Reclinabile',
      slug: 'noleggio-carrozzina-reclinabile-pieghevole-roma-e-firenze',
      shortDescription:
        'Noleggio carrozzina Consegna e ritiro a domicilio a Roma e Firenze da 30€. Noleggio per 1 giorno: 15€ con ritiro solamente in sede. Il ritiro in magazzino è gratuito. Prenota online subito!',
      description:
        '<p>La <strong>carrozzina reclinabile a noleggio</strong> è la soluzione per anziani e persone con mobilità ridotta che trascorrono molte ore seduti: massimo comfort, sicurezza e praticità.</p><h2><strong>Caratteristiche principali</strong></h2><ul><li><strong>Schienale reclinabile</strong> con poggiatesta, per relax e supporto costante</li><li><strong>Pedane regolabili e smontabili</strong>, con solleva gambe</li><li><strong>Braccioli rimovibili</strong></li><li><strong>Telaio pieghevole</strong> in acciaio, semplice da trasportare</li></ul><p>Ideale per anziani, persone con mobilità ridotta, post-operatori e case di cura. Spesso <strong>sostituisce un seggiolone polifunzionale</strong>, con maggiore flessibilità.</p><h2><strong>Igiene e sanificazione</strong></h2><p>Ogni carrozzina viene <strong>pulita e sanificata in ogni sua parte</strong> prima della consegna. Al bisogno, un tecnico mostra apertura, chiusura e regolazioni.</p>',
      metaTitle: 'Affitto, noleggio carrozzina reclinabile Roma Firenze e Provincia',
      metaDescription:
        'Noleggio Carrozzina pieghevole reclinabile. Risparmia con le nostre offerte imbattibile. Prenota online. Migliore Prezzo Garantito.',
    },
    en: {
      title: 'Reclining wheelchair hire',
      shortDescription:
        'Wheelchair hire. Home delivery and collection in Rome and Florence from €30. One-day hire: €15 with warehouse collection only. Free warehouse collection. Book online now!',
      description:
        '<p>A <strong>reclining wheelchair on hire</strong> suits older people and anyone with reduced mobility spending long hours seated: comfort, safety and convenience in every situation.</p><h2><strong>Key features</strong></h2><ul><li><strong>Reclining backrest</strong> with headrest, for rest and constant support</li><li><strong>Adjustable, removable leg rests</strong> with leg lift</li><li><strong>Removable armrests</strong></li><li><strong>Folding steel frame</strong>, easy to transport</li></ul><p>Ideal for older people, reduced mobility, post-surgery recovery and care homes. It often <strong>replaces a posture chair</strong>, with more flexibility.</p><h2><strong>Hygiene</strong></h2><p>Every chair is <strong>cleaned and sanitized throughout</strong> before delivery. A technician can demonstrate folding and adjustments on request.</p>',
      metaTitle: 'Reclining wheelchair hire Rome Florence and province',
      metaDescription:
        'Folding reclining wheelchair hire. Unbeatable offers. Book online. Best price guaranteed.',
    },
  },

  specs: {
    'max-load': 120,
    'seat-width': 40,
    weight: { min: 17.5, max: 17.5 },
    'frame-material': 'steel',
    foldable: true,
    'closed-width': 28,
    'reclining-backrest': true,
    propulsion: 'self-propelled',
  },

  media: {
    thumbnail: 'reclining-wheelchair-1.jpg',
    gallery: [
      {
        file: 'reclining-wheelchair-2.jpg',
        alt: { it: 'Schienale reclinabile', en: 'Reclining backrest' },
      },
      {
        file: 'shared/pedane-elevabile-1.jpg',
        alt: { it: 'Pedane elevabili estraibili', en: 'Removable elevating leg rests' },
      },
    ],
  },

  addons: [pressureReliefCushion],

  faqs: [
    {
      question: {
        it: 'Può sostituire un seggiolone polifunzionale?',
        en: 'Can it replace a posture chair?',
      },
      answer: {
        it: 'Sì: per lunghe permanenze sedute offre comfort e postura paragonabili, con in più la possibilità di spostarsi.',
        en: 'Yes: for long hours seated it offers comparable comfort and posture, with the bonus of mobility.',
      },
    },
  ],

  questions: [...deliveryAccess],
  terms: [generalRental],
});
