/**
 * Walker + wheelchair rehab bundle (wpPostId 9450): active walking support
 * plus a safe chair for when fatigue sets in. Both aids are picked per
 * patient, so no physical spec beyond foldable applies. The WP meta title
 * is an unrendered template, replaced with a clean one.
 */
import { deliveryAccess } from '../shared/questions.ts';
import { generalRental } from '../shared/terms.ts';
import { days } from '../shared/packages.ts';
import { wheelchairs } from './category.ts';

export const walkerWheelchairBundle = wheelchairs.rental({
  code: 'walker-wheelchair-bundle',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  marketingRate: 2,
  packages: [
    days(7, 55),
    days(15, 64),
    days(30, 90),
    days(45, 120),
    days(60, 145),
    days(90, 180),
  ],

  chips: [
    { it: 'Deambulatore + carrozzina', en: 'Walker + wheelchair' },
    { it: 'Recupero progressivo', en: 'Gradual recovery' },
    { it: 'Consulenza inclusa', en: 'Advice included' },
  ],

  translations: {
    it: {
      title: 'Deambulatore + Carrozzina',
      slug: 'deambulatore-carrozzina',
      shortDescription:
        'Consegna e Ritiro in magazzino sono Gratuiti Consegna a domicilio a partire da 30€. Prenota online o contattaci tramite WhatsApp.',
      description:
        '<p>Il <strong>noleggio combinato deambulatore + carrozzina</strong> segue le fasi della riabilitazione: supporto attivo alla deambulazione quando le forze ci sono, seduta sicura quando arriva la fatica.</p><h2><strong>Cosa include</strong></h2><ul><li><strong>Deambulatore</strong> scelto in base a peso, equilibrio, autonomia e ambiente domestico — con tavoletta, sotto ascellare o rollator con seduta</li><li><strong>Carrozzina</strong> scelta tra i modelli disponibili</li><li><strong>Consulenza tecnica</strong> e assistenza per tutto il noleggio</li></ul><p>Ideale dopo interventi chirurgici, traumi o per la riabilitazione geriatrica. Ritiro in magazzino gratuito, consegna a domicilio da 30 €.</p>',
      metaTitle: 'Noleggio deambulatore + carrozzina | Mia Medical',
      metaDescription:
        'Noleggio e affitto combinato della carrozzina e del deambulatore comodamente a casa tua. Combo ideale per la fisioterapia a casa. Chiama ora! 3926509237',
    },
    en: {
      title: 'Walker + wheelchair',
      shortDescription:
        'Warehouse delivery and collection are free. Home delivery from €30. Book online or contact us on WhatsApp.',
      description:
        '<p>The <strong>walker + wheelchair combo hire</strong> follows rehab as it progresses: active walking support while strength lasts, a safe seat when fatigue sets in.</p><h2><strong>What is included</strong></h2><ul><li><strong>Walker</strong> matched to weight, balance, independence and home spaces — forearm, underarm or rollator with seat</li><li><strong>Wheelchair</strong> picked from the models available</li><li><strong>Technical advice</strong> and support for the whole hire</li></ul><p>Ideal after surgery, trauma or for geriatric rehab. Free warehouse collection, home delivery from €30.</p>',
      metaTitle: 'Walker + wheelchair hire | Mia Medical',
      metaDescription:
        'Wheelchair and walker combo hire delivered to your home. Ideal combo for home physiotherapy. Call now! 3926509237',
    },
  },

  specs: {
    foldable: true,
  },

  media: {
    thumbnail: 'walker-wheelchair-bundle-1.jpg',
  },

  faqs: [
    {
      question: { it: 'Quale deambulatore ricevo?', en: 'Which walker will I receive?' },
      answer: { it: 'Quello adatto al paziente: peso, equilibrio, autonomia residua e spazi di casa decidono il modello.', en: 'The right one for the patient: weight, balance, remaining independence and home spaces decide the model.' },
    },
  ],

  questions: [...deliveryAccess],
  terms: [generalRental],
});
