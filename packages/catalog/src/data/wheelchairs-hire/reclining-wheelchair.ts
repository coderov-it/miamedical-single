/**
 * Noleggio Carrozzina Reclinabile
 *
 * /prodotto/noleggio-carrozzina-reclinabile-pieghevole-roma-e-firenze/
 * WooCommerce product 9034 — the ONE product in the category with a real
 * attribute table, so every measurement below is the shop's own structured data
 * rather than a figure read out of prose:
 *
 *   Maximum capacity  120 Kg          Seating height   45 - 50cm
 *   Seat width        40 - 46 cm      Weight           17,5 Kg
 *   Depth sitting     40 cm           Wheel            (Ø600mm)
 *   Transport width   28 cm           Frame            Acciaio
 *   Backrest height   65 cm con Poggiatesta            Color  Blu (ruote Piene)
 *   Max height        85 - 90 cm      Maximum depth    105 cm
 *
 * `propulsion` is left unset: the page never says whether it is pushed or
 * self-propelled, and Ø600 mm rear wheels would only be an inference.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { wheelchairsHire } from './category.ts';

export const recliningWheelchair = wheelchairsHire.rental({
  code: 'reclining-wheelchair',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(3, 25),
    days(7, 30),
    days(15, 35),
    days(30, 50),
    days(45, 65),
    days(60, 80),
    days(90, 100),
  ],

  translations: {
    it: {
      title: 'Noleggio Carrozzina Reclinabile',
      slug: 'noleggio-carrozzina-reclinabile-pieghevole-roma-e-firenze',
      shortDescription: 'Noleggio carrozzina Consegna e ritiro a domicilio a Roma e Firenze da 30€. Noleggio per 1 giorno: 15€ con ritiro solamente in sede. Il ritiro in magazzino è gratuito. Prenota online subito!',
      metaTitle: 'Noleggio affitto carrozzina reclinabile Roma Firenze e Provincia',
      metaDescription: 'Noleggio affitto carrozzina reclinabile. Risparmia con le nostre offerte imbattibile. Prenota online. Migliore Prezzo Garantito.',
      description: [
        '<p>Il <strong>Noleggio affitto carrozzina reclinabile</strong> è la soluzione ideale per anziani e persone con mobilità ridotta, garantendo <strong>massimo comfort, sicurezza e praticità</strong> in ogni situazione.<br />La nostra carrozzina è progettata per essere <strong>comoda, resistente e facile da utilizzare</strong>, anche in ambienti domestici con spazi stretti o per chi necessita di assistenza continua.</p>',
        '<h3>Caratteristiche principali del noleggio carrozzina reclinabile</h3>',
        '<ul><li><strong>Schienale reclinabile</strong> per garantire relax e supporto costante</li><li><strong>Pedane regolabili e smontabili</strong> per il massimo comfort dei piedi</li><li><strong>Braccioli rimovibili</strong>, facili da adattare alle esigenze dell’utente</li><li><strong>Poggiatesta e solleva gambe</strong> per un sostegno completo</li><li><strong>Telaio pieghevole</strong>, semplice da trasportare e riporre</li></ul>',
        '<p>Queste caratteristiche rendono la nostra carrozzina perfetta per chi ha bisogno di assistenza o per strutture sanitarie e case di cura.</p>',
        '<h3>Ideale per:</h3>',
        '<ul><li>Anziani</li><li>Persone con mobilità ridotta</li><li>Utenti recentemente sottoposti a interventi chirurgici</li><li>Persone in case di cura</li></ul>',
        '<p>La carrozzina spesso può sostituire un <strong>seggiolone polifunzionale</strong>, offrendo maggiore flessibilità e sicurezza durante l’uso quotidiano.</p>',
        '<h3>Igiene e sanificazione</h3>',
        '<p>Tutte le carrozzine a noleggio vengono <strong>pulite e sanificate in ogni loro parte</strong> prima della consegna, garantendo <strong>massima igiene e sicurezza</strong>.<br />Il nostro team verifica che ogni sedia sia pronta all’uso, funzionante e completamente sicura.</p>',
        '<h3>Consegna e assistenza</h3>',
        '<p>Offriamo <strong>consegna e ritiro</strong> tramite corriere in tutta Italia oppure ritiro in sede.<br />Se necessario, un nostro tecnico mostrerà come:</p>',
        '<ul><li>Aprire e chiudere la carrozzina</li><li>Regolare pedane e braccioli</li><li>Utilizzare correttamente lo schienale reclinabile e il solleva gambe</li></ul>',
        '<p>Per ulteriori informazioni puoi consultare anche le nostre altre <strong><a href="/catalogo-noleggio/">carrozzine a noleggio</a></strong> disponibili a Roma e Firenze.</p>',
        '<h3>Prenota subito il tuo noleggio carrozzina reclinabile</h3>',
        '<p>Approfitta del nostro servizio di <strong>Noleggio affitto carrozzina reclinabile</strong> e assicurati comfort, sicurezza e praticità.</p>',
        '<ul><li>Telefono / WhatsApp: +39 3926509237</li><li>Email: amministrazione@miamedicalitalia.it</li></ul>',
        '<p>Per ulteriori approfondimenti o offerte speciali puoi visitare la nostra pagina dedicata ai <a href="/catalogo-noleggio/"><strong>servizi di noleggio ausili per disabili</strong>.</a></p>',
        '<p>Scopri qui la nostra pagine <a href="https://facebook.com/MIAMedicalitalia/">Facebook </a></p>',
      ].join(''),
    },
    en: {
      title: 'Reclining Wheelchair Hire',
      slug: 'noleggio-carrozzina-reclinabile-pieghevole-roma-e-firenze',
      shortDescription: 'Wheelchair hire Home delivery and pick-up in Rome and Florence from 30€. Hire for 1 day: 15€ with pick-up on site only. Collection from the warehouse is free of charge. Book online now!',
      metaTitle: 'Reclining wheelchair hire | Rome, Florence and province',
      metaDescription: 'Hire a folding reclining wheelchair with headrest and elevating legrests. Sanitised and ready to use, delivered in Rome and Florence.',
      description: [
        '<p>The <strong>Reclining wheelchair rental</strong> it is the ideal solution for the elderly and people with reduced mobility, guaranteeing <strong>maximum comfort, safety and practicality</strong> in every situation.<br />Our wheelchair is designed to be <strong>comfortable, durable and easy to use</strong>, even in domestic environments with tight spaces or for those who need continuous assistance.</p>',
        '<h3>Main features of the reclining wheelchair rental</h3>',
        '<ul><li><strong>Reclining backrest</strong> to ensure relaxation and constant support</li><li><strong>Adjustable and removable footrests</strong> for maximum foot comfort</li><li><strong>Removable armrests</strong>, easy to adapt to the user\'s needs</li><li><strong>Headrest and leg lift</strong> for comprehensive support</li><li><strong>Folding frame</strong>, easy to transport and store</li></ul>',
        '<p>These features make our wheelchair perfect for people in need of assistance or for health care facilities and nursing homes.</p>',
        '<h3>Ideal for:</h3>',
        '<ul><li>Seniors</li><li>Persons with reduced mobility</li><li>Users who have recently undergone surgery</li><li>People in nursing homes</li></ul>',
        '<p>The wheelchair can often replace a <strong>multifunctional care chair</strong>, offering greater flexibility and security during daily use.</p>',
        '<h3>Hygiene and sanitation</h3>',
        '<p>All rented wheelchairs are <strong>clean and sanitised in every part</strong> before delivery, guaranteeing <strong>maximum hygiene and safety</strong>.<br />Our team checks that every chair is ready to use, in working order and completely safe.</p>',
        '<h3>Delivery and Service</h3>',
        '<p>We offer <strong>delivery and collection</strong> by courier throughout Italy or pick-up on site.<br />If necessary, one of our technicians will demonstrate how to:</p>',
        '<ul><li>Opening and closing the wheelchair</li><li>Adjusting footrests and armrests</li><li>Using the reclining backrest and leg lift correctly</li></ul>',
        '<p>For further information you can also consult our other <strong><a href="/en/rental-catalog/">wheelchairs for hire</a></strong> available in Rome and Florence.</p>',
        '<h3>Book your reclining wheelchair hire now</h3>',
        '<p>Take advantage of our <strong>Reclining wheelchair rental</strong> and ensure comfort, safety and practicality.</p>',
        '<ul><li>Phone / WhatsApp: +39 3926509237</li><li>Email: amministrazione@miamedicalitalia.it</li></ul>',
        '<p>For further information or special offers, please visit our page dedicated to <a href="/en/rental-catalog/"><strong>rental services of aids for the disabled</strong>.</a></p>',
        '<p>Discover our pages here <a href="https://facebook.com/MIAMedicalitalia/">Facebook </a></p>',
      ].join(''),
    },
  },

  specs: {
    'age-group': 'adult',
    'max-load': 120,
    weight: { min: 17.5, max: 17.5 },
    'seat-width': { min: 40, max: 46 },
    'seat-depth': { min: 40, max: 40 },
    'seat-height': { min: 45, max: 50 },
    'backrest-height': { min: 65, max: 65 },
    'total-length': { min: 105, max: 105 },
    'total-height': { min: 85, max: 90 },
    'folded-width': 28,
    'frame-material': 'steel',
    colour: { it: 'Blu, ruote piene', en: 'Blue, solid wheels' },
    'wheel-type': 'solid',
    'rear-wheels': { it: 'Ø 600 mm', en: 'Ø 600 mm' },
    foldable: true,
    'reclining-backrest': true,
    headrest: true,
    'elevating-legrests': true,
    'removable-armrests': true,
    'removable-footrests': true,
  },

  media: {
    thumbnail: { file: 'reclining-wheelchair-1.jpg', alt: { it: 'carrozzina con schienale reclinabile' } },
    gallery: [
      'reclining-wheelchair-2.jpg',
      'reclining-wheelchair-3.jpg',
    ],
  },

  addons: [homeDelivery(30)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
