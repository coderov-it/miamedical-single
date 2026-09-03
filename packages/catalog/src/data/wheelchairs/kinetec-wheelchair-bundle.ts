/**
 * Kinetec + wheelchair recovery bundle (wpPostId 9444): continuous passive
 * motion device plus a folding chair, for post-surgery rehab at home. No
 * deposit; delivery free from 30 days. The WP meta title is an unrendered
 * template, replaced with a clean one.
 */
import { deliveryAccess } from '../shared/questions.ts';
import { generalRental } from '../shared/terms.ts';
import { days } from '../shared/packages.ts';
import { wheelchairs } from './category.ts';

export const kinetecWheelchairBundle = wheelchairs.rental({
  code: 'kinetec-wheelchair-bundle',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  marketingRate: 9,
  packages: [days(15, 180), days(20, 230), days(30, 296)],

  chips: [
    { it: 'Kinetec + carrozzina', en: 'Kinetec + wheelchair' },
    { it: 'Riabilitazione a domicilio', en: 'Home rehabilitation' },
    { it: 'Senza deposito', en: 'No deposit' },
  ],

  translations: {
    it: {
      title: 'Noleggio Kinetec CEMP + Carrozzina',
      slug: 'noleggio-kinetec-carrozzina',
      shortDescription:
        'Consegna a Roma e Firenze Consegna a partire da 30€. Consegna gratuita per i noleggi da 30 giorni! Nessun deposito richiesto. La consegna e il ritiro in magazzino sono GRATUITI!',
      description:
        '<p>Il <strong>noleggio combinato Kinetec + carrozzina</strong> accompagna il recupero post-operatorio — ginocchio, anca, protesi — direttamente a casa, senza continui spostamenti in struttura.</p><h2><strong>Cosa include</strong></h2><ul><li><strong>Kinetec</strong>: mobilizzatore passivo continuo per flessione ed estensione controllata dell\u2019articolazione, anche nelle fasi post-operatorie precoci</li><li><strong>Carrozzina pieghevole</strong>: spostamenti brevi e quotidiani in sicurezza, modello scelto in base alle esigenze</li></ul><p>Consegna e montaggio a Roma e Firenze, ritiro gratuito in magazzino, <strong>nessun deposito</strong> richiesto.</p>',
      metaTitle: 'Noleggio Kinetec + carrozzina | Mia Medical',
      metaDescription:
        'Noleggio combo della carrozzina e il kinetec per ginocchio, perfetto per una riabilitazione veloce a casa tua, con consegna. Prenota online ora!',
    },
    en: {
      title: 'Kinetec CEMP + wheelchair hire',
      shortDescription:
        'Delivery in Rome and Florence. Delivery from €30. Free delivery for 30-day hires! No deposit required. Warehouse delivery and collection are FREE!',
      description:
        '<p>The <strong>Kinetec + wheelchair combo hire</strong> carries post-surgery recovery — knee, hip, prosthesis — straight home, with no repeated trips to a clinic.</p><h2><strong>What is included</strong></h2><ul><li><strong>Kinetec</strong>: continuous passive motion for controlled joint flexion and extension, even in the earliest post-surgery days</li><li><strong>Folding wheelchair</strong>: safe everyday trips, model matched to needs</li></ul><p>Delivery and setup in Rome and Florence, free warehouse collection, <strong>no deposit</strong> required.</p>',
      metaTitle: 'Kinetec + wheelchair hire | Mia Medical',
      metaDescription:
        'Wheelchair and knee Kinetec combo hire, perfect for fast rehab at home, with delivery. Book online now!',
    },
  },

  specs: {
    foldable: true,
  },

  media: {
    thumbnail: 'kinetec-wheelchair-bundle-1.jpg',
    gallery: [
      { file: 'kinetec-wheelchair-bundle-2.jpg', alt: { it: 'Kinetec per ginocchio e anca', en: 'Kinetec for knee and hip' } },
      { file: 'self-propelled-folding-1.jpg', alt: { it: 'Carrozzina inclusa', en: 'Wheelchair included' } },
      { file: 'shared/pedane-elevabile-1.jpg', alt: { it: 'Pedane elevabili estraibili', en: 'Removable elevating leg rests' } },
    ],
  },

  faqs: [
    {
      question: { it: 'La consegna è gratuita?', en: 'Is delivery free?' },
      answer: { it: 'Sì per i noleggi da 30 giorni; il ritiro in magazzino è sempre gratuito.', en: 'Yes for 30-day hires; warehouse collection is always free.' },
    },
  ],

  questions: [...deliveryAccess],
  terms: [generalRental],
});
