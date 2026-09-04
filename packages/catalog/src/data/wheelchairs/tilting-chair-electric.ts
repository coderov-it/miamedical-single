/**
 * Electric tilting posture chair (wpPostId 12408): the tilt runs on a
 * remote — the chair itself is still pushed, so no `propulsion` applies.
 * Explicitly NOT foldable. A 300 € deposit applies, as an FAQ.
 */
import { deliveryAccess } from '../shared/questions.ts';
import { generalRental } from '../shared/terms.ts';
import { days } from '../shared/packages.ts';
import { wheelchairs } from './category.ts';

export const tiltingChairElectric = wheelchairs.rental({
  code: 'tilting-chair-electric',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  marketingRate: 7,
  packages: [days(7, 90), days(15, 130), days(30, 240), days(45, 315)],

  chips: [
    { it: 'Basculante elettrica', en: 'Electric tilt' },
    { it: 'Telecomando', en: 'Remote control' },
    { it: 'Cuscini antidecubito', en: 'Anti-decubitus pads' },
  ],

  translations: {
    it: {
      title: 'Noleggio seggiolone elettrico polifunzionale',
      slug: 'noleggio-seggiolone-polifunzionale-basculante-elettrico',
      shortDescription:
        'Seggiolone polifunzionale Affitto e noleggio del seggiolone polifunzionale a Roma e provincia e Firenze e provincia. Consegna a partire da 35€. Il ritiro in magazzino è gratuito.',
      description:
        '<p>Il <strong>seggiolone polifunzionale elettrico</strong> posiziona la persona in autonomia: un <strong>telecomando bascula l\u2019intera seduta fino alla posizione sdraiata</strong>, con schienale reclinabile.</p><p>Completamente <strong>regolabile e smontabile</strong>, con <strong>cuscini antidecubito</strong>. Funge anche da sedia posturale ergonomica. <strong>Attenzione: non è pieghevole.</strong></p><p>Noleggio a Roma e Firenze e relative province, con consegna a domicilio o ritiro gratuito in magazzino.</p>',
      metaTitle: 'Noleggio Seggiolone Polifunzionale basculante per disabili',
      metaDescription:
        'Noleggio, affitto, seggiolone polifunzionale per disabili. Disponibilità immediata a Roma e Firenze e Provincia .Prenota online. Migliore Prezzo Garantito.',
    },
    en: {
      title: 'Electric tilting posture chair hire',
      shortDescription:
        'Posture chair. Tilting posture chair hire in Rome and province and Florence and province. Delivery from €35. Free warehouse collection.',
      description:
        '<p>An <strong>electric tilting posture chair on hire</strong> positions the person independently: a <strong>remote tilts the whole seat to a lying position</strong>, with reclining backrest.</p><p>Fully <strong>adjustable and strippable</strong>, with <strong>anti-decubitus cushions</strong>. Doubles as an ergonomic posture chair. <strong>Note: it does not fold.</strong></p><p>Hire in Rome and Florence and provinces, with home delivery or free warehouse collection.</p>',
      metaTitle: 'Tilting posture chair hire for disabled people',
      metaDescription:
        'Posture chair hire and rental for disabled people. Immediate availability in Rome and Florence and province. Book online. Best price guaranteed.',
    },
  },

  specs: {
    foldable: false,
    'reclining-backrest': true,
  },

  media: {
    thumbnail: 'tilting-chair-electric-1.png',
    gallery: [
      { file: 'tilting-chair-electric-2.jpeg', alt: { it: 'Telecomando', en: 'Remote control' } },
      {
        file: 'shared/seggiolone-inovis-2.jpg',
        alt: { it: 'Seggiolone polifunzionale', en: 'Posture chair' },
      },
      { file: 'tilting-chair-manual-1.jpg', alt: { it: 'Versione manuale', en: 'Manual version' } },
    ],
  },

  faqs: [
    {
      question: { it: 'È richiesto un deposito?', en: 'Is a deposit required?' },
      answer: {
        it: 'Sì, per questo articolo è richiesto un deposito di 300 €.',
        en: 'Yes, a €300 deposit is required for this item.',
      },
    },
  ],

  questions: [...deliveryAccess],
  terms: [generalRental],
});
