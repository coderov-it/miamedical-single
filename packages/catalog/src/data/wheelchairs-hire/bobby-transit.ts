/**
 * Noleggio Carrozzina Da Transito BOBBY
 *
 * /prodotto/noleggio-carrozzina-transito-bobby/
 * WooCommerce product 15658, the newest chair in the category. Its page prints a
 * "Dimensioni e specifiche tecniche" list, which is where all six measurements
 * come from.
 *
 * `folding-backrest` and not `reclining-backrest`: the page says "schienale
 * ribaltabile per ridurre l'ingombro" — the backrest drops to make the chair
 * smaller, it is not a seating position. `brakes: dual` is its "doppio sistema
 * frenante", one set for the user and one for whoever is pushing.
 *
 * Delivery is quoted as two legs here — "a partire da 30€ + 30€ di ritiro" — so
 * it carries the split pair rather than the single combined charge.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeCollection, homeDeliveryOnly } from '../shared/addons.ts';
import { wheelchairsHire } from './category.ts';

export const bobbyTransit = wheelchairsHire.rental({
  code: 'bobby-transit',
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
      title: 'Noleggio Carrozzina Da Transito BOBBY',
      slug: 'noleggio-carrozzina-transito-bobby',
      shortDescription: 'Noleggio Carrozzina da Transito Bobby Leggera (solo 12kg), pieghevole in 4 e ideale per accompagnamento e trasporti rapidi. Struttura compatta con schienale pieghevole e pedane removibili per il massimo comfort e praticità. Seduta larga e freni. Il ritiro e la riconsegna delle carrozzine in magazzino è gratuito! Consegna a domicilio a Roma e Firenze a partire da 30€ + 30€ di ritiro. Prenota online o contattaci tramite WhatsApp!',
      metaTitle: 'Noleggio carrozzina da transito Bobby | Leggera e pieghevole',
      metaDescription: 'Noleggio carrozzina da transito Bobby leggera e pieghevole in alluminio. Ideale per trasporto persone, con schienale abbattibile e portata fino a 115 kg.',
      description: [
        '<h3>Noleggio carrozzina da transito Bobby</h3>',
        '<p>Il <strong>noleggio della carrozzina da transito Bobby</strong> è la soluzione ideale per chi necessita di una sedia a rotelle leggera, pieghevole e facilmente trasportabile. Pensata per l’assistenza di persone con difficoltà motorie temporanee o permanenti, la Bobby garantisce comfort, sicurezza e praticità in ogni spostamento.</p>',
        '<h3>Carrozzina da transito Bobby: compatta e facile da trasportare</h3>',
        '<p>La carrozzina Bobby è progettata per offrire la massima maneggevolezza negli spostamenti quotidiani e nei trasferimenti. Grazie al suo telaio leggero e pieghevole, è perfetta per:</p>',
        '<ul><li>trasporti in auto e ambulanze</li><li>visite mediche e strutture sanitarie</li><li>viaggi e spostamenti frequenti</li><li>utilizzo domestico e assistenza domiciliare</li></ul>',
        '<p>È una delle soluzioni più apprezzate nel servizio di <strong>noleggio carrozzine da transito</strong> grazie alla sua praticità e robustezza.</p>',
        '<h3>A chi è consigliata la carrozzina da transito Bobby</h3>',
        '<p>Questo modello è indicato per:</p>',
        '<ul><li>persone anziane con ridotta mobilità</li><li>pazienti in fase post-operatoria</li><li>persone con disabilità temporanee o permanenti</li><li>utenti che necessitano di accompagnamento durante gli spostamenti</li></ul>',
        '<h3>Caratteristiche tecniche della carrozzina Bobby</h3>',
        '<p>La carrozzina da transito Bobby è progettata per garantire sicurezza e comfort sia per l’utente che per l’accompagnatore. Le sue principali caratteristiche includono:</p>',
        '<ul><li>struttura leggera e pieghevole</li><li>schienale ribaltabile per ridurre l’ingombro</li><li>pedane poggiapiedi removibili e regolabili</li><li>braccioli girevoli con protezioni per abiti integrate</li><li>doppio sistema frenante per maggiore sicurezza</li><li>design compatto per facile trasporto e stoccaggio</li></ul>',
        '<h3>Dimensioni e specifiche tecniche</h3>',
        '<ul><li>Peso massimo utilizzatore: 115 kg</li><li>Peso totale: circa 12,4 – 13 kg</li><li>Larghezza seduta: 39 – 48 cm (a seconda della configurazione)</li><li>Larghezza totale: 46 – 57 cm</li><li>Lunghezza totale: 101 cm</li><li>Altezza totale: 90 cm</li><li>Carrozzina pieghevole per facile trasporto</li></ul>',
        '<h3>Sicurezza e comfort</h3>',
        '<p>La Bobby è progettata per garantire stabilità e sicurezza in ogni situazione. I freni manuali per l’utente e per l’accompagnatore assicurano il massimo controllo durante l’utilizzo, mentre la struttura ergonomica migliora il comfort anche nei tragitti più lunghi.</p>',
        '<h3>Prenota il noleggio della carrozzina da transito Bobby</h3>',
        '<p>Scegli il <strong>noleggio della carrozzina da transito Bobby</strong> per una soluzione pratica, sicura e affidabile. Contatta il servizio di assistenza per ricevere informazioni, disponibilità e consigli sul modello più adatto alle tue esigenze.</p>',
        '<p>La mobilità non deve essere un limite: con Bobby ogni spostamento diventa più semplice.</p>',
        '<h3>Prenota il noleggio della carrozzina Bobby</h3>',
        '<p>Prenota subito il noleggio della carrozzina da transito Bobby oppure contattaci per ricevere maggiori informazioni.</p>',
        '<p>📞 Telefono / WhatsApp: +39 392 650 9237<br />✉ Email: info@miamedicalitalia.it</p>',
        '<p>Abbiamo anche tante altre carrozzine a Noleggio, scoprile cliccando <a href="/catalogo-noleggio/">qui.</a></p>',
        '<h2>Link Utili</h2>',
        '<p>Per maggiori informazioni sui dispositivi per la mobilità assistita è possibile consultare anche il sito del <a href="https://www.salute.gov.it/portale/home.html">Ministero della Salute.</a></p>',
      ].join(''),
    },
    en: {
      title: 'BOBBY transit wheelchair for hire',
      slug: 'noleggio-carrozzina-transito-bobby',
      shortDescription: 'Hire Transit Wheelchair Bobby Lightweight (only 12kg), foldable in 4 and ideal for accompaniment and quick transport. Compact frame with a foldable backrest and removable footrests for maximum comfort and practicality. Wide seat and brakes. Collection and return of wheelchairs to the warehouse is free of charge! Home delivery in Rome and Florence starting from €30 + €30 collection. Book online or contact us via WhatsApp!',
      metaTitle: 'BOBBY transit wheelchair hire | Light and folding',
      metaDescription: 'Hire the Bobby transit wheelchair: 12.4–13 kg, folds in four, folding backrest, removable footrests and a dual braking system.',
      description: [
        '<h3>Hire transit wheelchair Bobby</h3>',
        '<p>The <strong>rental of the Bobby transit wheelchair</strong> It is the ideal solution for those who need a lightweight, foldable, and easily transportable wheelchair. Designed to assist people with temporary or permanent mobility difficulties, the Bobby guarantees comfort, safety, and practicality in every movement.</p>',
        '<h3>Bobby transit wheelchair: compact and easy to transport</h3>',
        '<p>The Bobby wheelchair is designed to offer maximum manoeuvrability for everyday journeys and transfers. Thanks to its lightweight and foldable frame, it is perfect for:</p>',
        '<ul><li>car and ambulance transports</li><li>medical examinations and health facilities</li><li>frequent travel and movement</li><li>home use and home care</li></ul>',
        '<p>It is one of the most appreciated solutions in the service of <strong>transit wheelchair hire</strong> thanks to its practicality and robustness.</p>',
        '<h3>The Bobby transit wheelchair is recommended for:</h3>',
        '<p>This model is suitable for:</p>',
        '<ul><li>Elderly people with reduced mobility</li><li>post-operative patients</li><li>people with temporary or permanent disabilities</li><li>users who require accompaniment when travelling</li></ul>',
        '<h3>Technical characteristics of the Bobby wheelchair</h3>',
        '<p>The Bobby transit wheelchair is designed to ensure safety and comfort for both the user and the attendant. Its main features include:</p>',
        '<ul><li>lightweight and foldable structure</li><li>Foldable backrest to reduce bulk</li><li>removable and adjustable footrests</li><li>swivelling armrests with integrated clothing protectors</li><li>dual braking system for greater safety</li><li>compact design for easy transport and storage</li></ul>',
        '<h3>Dimensions and technical specifications</h3>',
        '<ul><li>Maximum user weight: 115 kg</li><li>Total weight: approx. 12.4 – 13 kg</li><li>Seat width: 39 – 48 cm (depending on configuration)</li><li>Total width: 46 – 57 cm</li><li>Total length: 101 cm</li><li>Total height: 90 cm</li><li>Folding wheelchair for easy transport</li></ul>',
        '<h3>Safety and comfort</h3>',
        '<p>The Bobby is designed to ensure stability and safety in all situations. Handbrakes for the user and attendant ensure maximum control during use, while the ergonomic structure improves comfort even on longer journeys.</p>',
        '<h3>Book the Bobby transit wheelchair rental</h3>',
        '<p>Choose the <strong>rental of the Bobby transit wheelchair</strong> For a practical, safe, and reliable solution. Contact customer support for information, availability, and advice on the model best suited to your needs.</p>',
        '<p>Mobility shouldn\'t be a limitation: with Bobby, every journey becomes simpler.</p>',
        '<h3>Book Bobby\'s wheelchair hire</h3>',
        '<p>Book your Bobby transit wheelchair rental now or contact us for more information.</p>',
        '<p>📞 Phone / WhatsApp: +39 392 650 9237<br />✉ Email: info@miamedicalitalia.it</p>',
        '<p>We also have many other wheelchairs for hire, discover them by clicking here <a href="/en/rental-catalog/">here.</a></p>',
        '<h2>Useful Links</h2>',
        '<p>For more information on assisted mobility devices, you can also consult the website of <a href="https://www.salute.gov.it/portale/home.html">Ministry of Health.</a></p>',
      ].join(''),
    },
  },

  specs: {
    propulsion: 'transit',
    'age-group': 'adult',
    'max-load': 115,
    weight: { min: 12.4, max: 13 },
    'seat-width': { min: 39, max: 48 },
    'total-width': { min: 46, max: 57 },
    'total-length': { min: 101, max: 101 },
    'total-height': { min: 90, max: 90 },
    foldable: true,
    'folding-backrest': true,
    'removable-armrests': true,
    'removable-footrests': true,
    brakes: 'dual',
  },

  media: {
    thumbnail: { file: 'bobby-transit-1.jpg', alt: { it: 'Noleggio carrozzina da transito Bobby' } },
    gallery: [
      'bobby-transit-2.jpg',
      { file: 'bobby-transit-3.jpg', alt: { it: 'Carrozzina da transito Bobby EVO' } },
      'bobby-transit-4.jpg',
      'bobby-transit-5.jpg',
      { file: 'bobby-transit-6.jpg', alt: { it: 'Noleggio carrozzina da transito Bobby' } },
    ],
  },

  addons: [homeDeliveryOnly(30), homeCollection(30)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
