/**
 * Magnetotherapy + wheelchair bundle (wpPostId 9461): CEMP device plus a
 * chair chosen per patient. No deposit; delivery free from 45 days.
 * WordPress carries no meta title, so none is written.
 */
import { deliveryAccess } from '../shared/questions.ts';
import { generalRental } from '../shared/terms.ts';
import { days } from '../shared/packages.ts';
import { wheelchairs } from './category.ts';

export const magnetotherapyWheelchairBundle = wheelchairs.rental({
  code: 'magnetotherapy-wheelchair-bundle',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  marketingRate: 3,
  packages: [days(20, 100), days(30, 130), days(45, 170), days(60, 210)],

  chips: [
    { it: 'Magnetoterapia CEMP', en: 'CEMP magnetotherapy' },
    { it: 'Carrozzina inclusa', en: 'Wheelchair included' },
    { it: 'Senza deposito', en: 'No deposit' },
  ],

  translations: {
    it: {
      title: 'Noleggio Magnetoterapia + Carrozzina',
      slug: 'noleggio-e-affitto-della-magnetoterapia-e-della-carrozzina',
      shortDescription:
        'Carrozzina + Magnetoterapia Cemp BIO compatibile Consegna a Roma e Firenze a partire da 30€. Consegna gratuita per i noleggi da 45 giorni! Nessun deposito richiesto. La consegna e il ritiro in magazzino sono GRATUITI!',
      description:
        '<p>Il <strong>noleggio combinato carrozzina + magnetoterapia CEMP</strong> unisce supporto alla mobilità e terapia rigenerativa a domicilio — per riabilitazione post-traumatica, post-operatoria o patologie osteo-articolari.</p><h2><strong>Cosa include</strong></h2><ul><li><strong>Carrozzina</strong> scelta in base a quadro clinico, corporatura e ambiente domestico — autospinta, transito, reclinabile, bariatrica o pediatrica</li><li><strong>Magnetoterapia CEMP</strong> professionale, con assistenza tecnica e consulenza sul modello</li></ul><p>Consegna a Roma e Firenze da 30 €, <strong>gratuita dai 45 giorni</strong>; ritiro in magazzino sempre gratuito, <strong>nessun deposito</strong>.</p>',
      metaDescription:
        'Noleggio combinato della carrozzina e della magnetoterapia Cemp. Combo perfetto per la riabilitazione a casa tua, prezzi bassi. Prenota online!',
    },
    en: {
      title: 'Magnetotherapy + wheelchair hire',
      shortDescription:
        'Wheelchair + BIO-compatible Cemp magnetotherapy. Delivery in Rome and Florence from €30. Free delivery for 45-day hires! No deposit required. Warehouse delivery and collection are FREE!',
      description:
        '<p>The <strong>wheelchair + CEMP magnetotherapy combo hire</strong> pairs mobility support with regenerative therapy at home — for post-trauma and post-surgery rehab or osteo-articular conditions.</p><h2><strong>What is included</strong></h2><ul><li><strong>Wheelchair</strong> matched to clinical picture, build and home environment — self-propelled, transit, reclining, bariatric or pediatric</li><li><strong>Professional CEMP magnetotherapy</strong>, with technical support and advice on the model</li></ul><p>Delivery in Rome and Florence from €30, <strong>free from 45 days</strong>; warehouse collection always free, <strong>no deposit</strong>.</p>',
      metaDescription:
        'Wheelchair and Cemp magnetotherapy combo hire. Perfect combo for rehab at home, low prices. Book online!',
    },
  },

  specs: {
    foldable: true,
  },

  media: {
    thumbnail: 'magnetotherapy-wheelchair-bundle-1.jpg',
    gallery: [
      {
        file: 'magnetotherapy-wheelchair-bundle-2.jpg',
        alt: { it: 'Magnetoterapia CEMP Magnum 2500', en: 'CEMP Magnum 2500 magnetotherapy' },
      },
      {
        file: 'self-propelled-folding-1.jpg',
        alt: { it: 'Carrozzina inclusa', en: 'Wheelchair included' },
      },
      {
        file: 'shared/pedane-elevabile-1.jpg',
        alt: { it: 'Pedane elevabili estraibili', en: 'Removable elevating leg rests' },
      },
    ],
  },

  faqs: [
    {
      question: { it: 'Quale carrozzina è inclusa?', en: 'Which wheelchair is included?' },
      answer: {
        it: 'Quella adatta al paziente, scelta con il nostro team tra tutti i modelli a noleggio.',
        en: 'The right one for the patient, chosen with our team from every model for hire.',
      },
    },
  ],

  questions: [...deliveryAccess],
  terms: [generalRental],
});
