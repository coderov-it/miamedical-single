/**
 * SLIM transit (wpPostId 8948): sibling of `slim-self-propelled.ts`, same
 * frame and prices, small wheels for a companion push. `weight` and
 * `closedWidth` are omitted — WordPress has them as prose, not figures.
 */
import { pressureReliefCushion } from '../shared/addons.ts';
import { deliveryAccess } from '../shared/questions.ts';
import { generalRental } from '../shared/terms.ts';
import { days } from '../shared/packages.ts';
import { wheelchairs } from './category.ts';

export const slimTransit = wheelchairs.rental({
  code: 'slim-transit',
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

  chips: [{ it: 'Per passaggi stretti' }, { it: 'Pieghevole' }, { it: 'Portata 100 kg' }],

  translations: {
    it: {
      title: 'Affitto carrozzina di transito di piccole dimensioni – SLIM',
      slug: 'affitto-carrozzina-per-disabili-di-piccole-dimensioni-slim',
      shortDescription:
        'Noleggio Carrozzina Slim di Transito Consegna e ritiro a domicilio a Roma e Firenze da 30€. Noleggio per 1 giorno: 15€ con ritiro solamente in sede. Il ritiro in magazzino è gratuito! Disponibilità immediata.',
      description:
        '<p>Il <strong>noleggio della carrozzina per disabili di piccole dimensioni da transito</strong> è la soluzione ideale per chi ha problemi di spazio e necessita di una sedia a rotelle maneggevole e funzionale.</p><p>La <strong>carrozzina SLIM</strong> è progettata appositamente per passaggi stretti come bagni, ascensori e corridoi.</p><h2><strong>Ideale per chi ha difficoltà motorie</strong></h2><p>Questa sedia a rotelle è consigliata per anziani, persone con disabilità e chi ha difficoltà o impossibilità nel camminare a causa di infortuni, malattie o disabilità.</p><h2><strong>Caratteristiche principali</strong></h2><ul><li><strong>Struttura pieghevole</strong> per trasporto e stoccaggio facilitato</li><li><strong>Pedane per i piedi e braccioli</strong>, entrambi rimovibili facilmente</li><li><strong>Due freni</strong> per bloccare le ruote</li></ul><h2><strong>Accessori e comfort aggiuntivi</strong></h2><ul><li><strong>Alzata gamba gratuita</strong>: se il paziente ha un gesso o deve tenere la gamba sollevata, basta comunicarcelo</li><li><strong>Cuscino antidecubito</strong>: consigliato se il paziente passa molte ore seduto</li></ul><h2><strong>Dimensioni carrozzina</strong></h2><ul><li>Seduta di <strong>40 cm o 43 cm</strong></li><li>Sedia molto stretta, ideale per spazi ridotti</li><li>Non adatta a persone con peso superiore a <strong>80 kg</strong></li></ul><h2><strong>Igiene e sanificazione</strong></h2><p>Ogni carrozzina a noleggio viene accuratamente <strong>pulita e sanificata</strong> in ogni sua parte.</p>',
      metaTitle: 'Affitto carrozzina per disabili di piccole dimensioni - SLIM',
      metaDescription:
        'Affitto carrozzina per disabili di piccole dimensioni - SLIM. Disponibilità immediata. Possibilità di consegna a domicilio! Chiamaci al +393926509237',
    },
  },

  specs: {
    'max-load': 100,
    'seat-width': 40,
    'frame-material': 'aluminium',
    foldable: true,
    'reclining-backrest': false,
    propulsion: 'transit',
  },

  media: {
    thumbnail: 'slim-transit-1.jpg',
    gallery: [
      {
        file: 'shared/pedane-elevabile-1.jpg',
        alt: { it: 'Pedane elevabili estraibili' },
      },
    ],
  },

  addons: [pressureReliefCushion],

  faqs: [
    {
      question: { it: 'Il paziente ha il gesso o deve tenere la gamba sollevata?' },
      answer: { it: "L'alzata gamba è gratuita: basta comunicarlo al momento della prenotazione." },
    },
  ],

  questions: [...deliveryAccess],
  terms: [generalRental],
});
