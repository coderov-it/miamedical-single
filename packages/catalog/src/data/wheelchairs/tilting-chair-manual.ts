/**
 * Manual tilting posture chair (wpPostId 9040): reclining backrest, seat
 * tilts to lying, built-in anti-decubitus cushions. Explicitly NOT foldable.
 * A 300 € deposit applies — stated here as an FAQ, the category stays
 * deposit-free for everyone else.
 */
import { deliveryAccess } from '../shared/questions.ts';
import { generalRental } from '../shared/terms.ts';
import { days } from '../shared/packages.ts';
import { wheelchairs } from './category.ts';

export const tiltingChairManual = wheelchairs.rental({
  code: 'tilting-chair-manual',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  marketingRate: 5,
  packages: [days(7, 70), days(15, 110), days(30, 180), days(45, 250)],

  chips: [
    { it: 'Seduta basculante', en: 'Tilting seat' },
    { it: 'Schienale reclinabile', en: 'Reclining backrest' },
    { it: 'Cuscini antidecubito', en: 'Anti-decubitus cushions' },
  ],

  translations: {
    it: {
      title: 'Noleggio seggiolone polifunzionale basculante',
      slug: 'noleggio-seggiolone-polifunzionale-basculante',
      shortDescription:
        'Seggiolone polifunzionale Affitto e noleggio del seggiolone polifunzionale a Roma e provincia e Firenze e provincia. Consegna a partire da 40€. Il ritiro in magazzino è gratuito.',
      description:
        '<p>Il <strong>seggiolone polifunzionale basculante</strong> garantisce comfort, sicurezza e corretto posizionamento posturale per chi ha difficoltà motorie o posturali — a domicilio come in struttura.</p><h2><strong>Sistema basculante e schienale reclinabile</strong></h2><p>La seduta si inclina <strong>fino alla posizione sdraiata</strong>, riducendo i punti di pressione. Completamente <strong>regolabile e smontabile</strong>, con <strong>cuscini antidecubito</strong> inclusi.</p><p>Non è solo una seduta: funge anche da sedia posturale ergonomica. <strong>Attenzione: non è pieghevole.</strong></p><p>Noleggio a Roma e Firenze e relative province, con consegna a domicilio o ritiro gratuito in magazzino.</p>',
      metaTitle: 'Noleggio seggiolone polifunzionale per disabili | Roma e Firenze',
      metaDescription:
        'Noleggio seggiolone polifunzionale basculante per disabili a Roma e Firenze. Noleggio rapido. Prenota online con disponibilità immediata.',
    },
    en: {
      title: 'Tilting posture chair hire',
      shortDescription:
        'Posture chair. Tilting posture chair hire in Rome and province and Florence and province. Delivery from €40. Free warehouse collection.',
      description:
        '<p>A <strong>tilting posture chair on hire</strong> gives comfort, safety and correct postural positioning all day — for motor or postural difficulties, at home or in care.</p><h2><strong>Tilt system and reclining backrest</strong></h2><p>The whole seat tilts <strong>to a lying position</strong>, easing pressure points. Fully <strong>adjustable and strippable</strong>, with <strong>anti-decubitus cushions</strong> included.</p><p>More than seating: it doubles as an ergonomic posture chair. <strong>Note: it does not fold.</strong></p><p>Hire in Rome and Florence and provinces, with home delivery or free warehouse collection.</p>',
      metaTitle: 'Posture chair hire for disabled people | Rome and Florence',
      metaDescription:
        'Tilting posture chair hire for disabled people in Rome and Florence. Fast hire. Book online with immediate availability.',
    },
  },

  specs: {
    foldable: false,
    'reclining-backrest': true,
  },

  media: {
    thumbnail: 'tilting-chair-manual-1.jpg',
    gallery: [{ file: 'shared/seggiolone-inovis-2.jpg', alt: { it: 'Seggiolone polifunzionale', en: 'Posture chair' } }],
  },

  faqs: [
    {
      question: { it: 'È richiesto un deposito?', en: 'Is a deposit required?' },
      answer: { it: 'Sì, per questo articolo è richiesto un deposito di 300 €.', en: 'Yes, a €300 deposit is required for this item.' },
    },
  ],

  questions: [...deliveryAccess],
  terms: [generalRental],
});
