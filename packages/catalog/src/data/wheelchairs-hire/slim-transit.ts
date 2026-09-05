/**
 * Affitto carrozzina di transito di piccole dimensioni – SLIM
 *
 * /prodotto/affitto-carrozzina-per-disabili-di-piccole-dimensioni-slim/
 * WooCommerce product 8948. The transit twin of `slim-self-propelled`: the same
 * chair, pushed by someone else, and the same seven prices.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery, legRaiser } from '../shared/addons.ts';
import { wheelchairsHire } from './category.ts';

export const slimTransit = wheelchairsHire.rental({
  code: 'slim-transit',
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
      title: 'Affitto carrozzina di transito di piccole dimensioni – SLIM',
      slug: 'affitto-carrozzina-per-disabili-di-piccole-dimensioni-slim',
      shortDescription: 'Noleggio Carrozzina Slim di Transito Consegna e ritiro a domicilio a Roma e Firenze da 30€. Noleggio per 1 giorno: 15€ con ritiro solamente in sede. Il ritiro in magazzino è gratuito! Disponibilità immediata.',
      metaTitle: 'Affitto carrozzina per disabili di piccole dimensioni - SLIM',
      metaDescription: 'Affitto carrozzina per disabili da transito di piccole dimensioni SLIM. Disponibilità immediata. Possibilità di consegna a domicilio! Chiamaci al 3926509237',
      description: [
        '<h2>Affitto carrozzina per disabili di piccole dimensioni</h2>',
        '<p>L’<strong>affitto carrozzina per disabili di piccole dimensioni</strong> è la soluzione ideale per chi ha problemi di spazio e necessita di una sedia a rotelle maneggevole e funzionale.<br />La carrozzina SLIM è una carrozzina da transito di piccole dimensioni progettata appositamente per passaggi stretti come:</p>',
        '<ul><li>Bagni</li><li>Ascensori</li><li>Corridoi</li></ul>',
        '<h2>A chi è rivolto l’affitto carrozzina per disabili di piccole dimensioni</h2>',
        '<p>L’<strong>affitto carrozzina per disabili di piccole dimensioni</strong> è ideale per:</p>',
        '<ul><li>Anziani</li><li>Persone con disabilità</li><li>Chi ha difficoltà motorie temporanee o permanenti</li></ul>',
        '<h2><strong>Caratteristiche principali</strong> della carrozzina SLIM</h2>',
        '<p>La carrozzina SLIM offre comfort e praticità grazie a:</p>',
        '<ul><li><strong>Struttura pieghevole</strong> per trasporto e stoccaggio facilitato</li><li><strong>Pedane per i piedi e braccioli</strong>, entrambi rimovibili facilmente</li><li><strong>Due freni</strong> per bloccare le ruote</li></ul>',
        '<p>Al momento della consegna, un nostro tecnico mostrerà:</p>',
        '<ul><li>Come chiudere e riaprire la sedia</li><li>Come montare e smontare braccioli e pedane</li></ul>',
        '<h2><strong>Accessori e comfort aggiuntivi</strong></h2>',
        '<ul><li><strong>Alzata gamba gratuita</strong>: se il paziente ha un gesso o deve tenere la gamba sollevata, basta comunicarcelo</li><li><strong><a href="/prodotto/cuscino-antidecubito-in-fibra-cava-siliconata/">Cuscino antidecubito</a></strong>: consigliato se il paziente passa molte ore seduto. Disponibile a prezzo riservato esclusivamente a chi noleggia la sedia</li></ul>',
        '<h2><strong>Versioni disponibili della carrozzina per disabili di piccole dimensioni</strong></h2>',
        '<p>La sedia a rotelle SLIM è disponibile:</p>',
        '<ul><li><strong>Ad autospinta</strong></li><li><strong>Da <a href="/prodotto/noleggio-sedia-a-rotelle-stretta-carrozzina-slim-di-transito/">transito</a></strong></li></ul>',
        '<h2><strong>Dimensioni carrozzina</strong></h2>',
        '<ul><li>Seduta di <strong>40 cm o 43 cm</strong></li><li>Sedia molto stretta, ideale per spazi ridotti</li><li>Non adatta a persone con peso superiore a <strong>80 kg</strong></li></ul>',
        '<h2><strong>Igiene e sanificazione</strong></h2>',
        '<p>Ogni carrozzina a noleggio viene accuratamente <strong>pulita e sanificata</strong> in ogni sua parte.<br />Pulizia e igiene sono per noi una priorità assoluta.</p>',
        '<h2><strong>Zone di noleggio e spedizione</strong></h2>',
        '<p>Effettuiamo il <strong>noleggio della carrozzina per disabili di piccole dimensioni da transito</strong> in:</p>',
        '<ul><li><strong>Lazio</strong></li><li><strong>Toscana</strong></li></ul>',
        '<p>È possibile richiedere anche la <strong>spedizione tramite corriere in tutta Italia</strong>.</p>',
        '<h2><strong>Come prenotare</strong></h2>',
        '<p>Prenota online subito il noleggio della <strong>sedia a rotelle pieghevole da transito SLIM</strong> oppure contattaci:</p>',
        '<ul><li>📞 <strong>Telefono / WhatsApp</strong>: +39 3926509237</li><li>✉ <strong>Email</strong>: amministrazione@miamedicalitalia.it</li></ul>',
        '<p>Scopri anche la nostra <strong>pagina <a href="http://facebook.com/MIAMedicalitalia/">Facebook</a></strong> per aggiornamenti e offerte.l noleggio della carrozzina per disabili di piccole dimensioni da transito è essenziale per chi ha problematiche di spazio.</p>',
      ].join(''),
    },
    en: {
      title: 'Small transit wheelchair for hire – SLIM',
      slug: 'affitto-carrozzina-per-disabili-di-piccole-dimensioni-slim',
      shortDescription: 'Hire of Slim Transit Wheelchair. Home delivery and pick-up in Rome and Florence from 30€. Hire for 1 day: 15€ with pick-up on site only. Collection from the warehouse is free of charge! Immediate availability.',
      metaTitle: 'Small transit wheelchair hire — SLIM',
      metaDescription: 'Hire a small transit wheelchair for disabled users in Lazio and Tuscany, with courier delivery across Italy. Seat 40 or 43 cm.',
      description: [
        '<h2>Rental of small wheelchairs for people with disabilities</h2>',
        '<p>L\'<strong>small wheelchair hire</strong> it is the ideal solution for those with space issues who need a manageable and functional wheelchair.<br />The SLIM wheelchair is a small transit wheelchair designed specifically for narrow doorways such as:</p>',
        '<ul><li>Toilets</li><li>Lifts</li><li>Corridors</li></ul>',
        '<h2>Who is the small wheelchair rental for?</h2>',
        '<p>L\'<strong>small wheelchair hire</strong> is ideal for:</p>',
        '<ul><li>Seniors</li><li>Persons with disabilities</li><li>People with temporary or permanent mobility difficulties</li></ul>',
        '<h2><strong>Main features</strong> of the SLIM wheelchair</h2>',
        '<p>The SLIM wheelchair offers comfort and practicality thanks to:</p>',
        '<ul><li><strong>Folding structure</strong> for easy transport and storage</li><li><strong>Footrests and armrests</strong>, both easily removable</li><li><strong>Two brakes</strong> to lock the wheels</li></ul>',
        '<p>Upon delivery, one of our technicians will demonstrate:</p>',
        '<ul><li>How to close and reopen the chair</li><li>How to fit and remove armrests and footrests</li></ul>',
        '<h2><strong>Additional accessories and comfort</strong></h2>',
        '<ul><li><strong>Free leg raise</strong>if the patient has a plaster cast or needs to keep their leg elevated, just let us know</li><li><strong><a href="/en/product/cuscino-antidecubito-in-fibra-cava-siliconata/">Anti-decubitus pillow</a></strong>recommended if the patient spends many hours sitting. Available at a price reserved exclusively for those renting the chair</li></ul>',
        '<h2><strong>Available versions of the small-sized wheelchair</strong></h2>',
        '<p>The SLIM wheelchair is available:</p>',
        '<ul><li><strong>Self-propelled</strong></li><li><strong>From <a href="/en/product/noleggio-sedia-a-rotelle-stretta-carrozzina-slim-di-transito/">transit</a></strong></li></ul>',
        '<h2><strong>Wheelchair dimensions</strong></h2>',
        '<ul><li>Sitting of <strong>40 cm or 43 cm</strong></li><li>Very narrow chair, ideal for tight spaces</li><li>Not suitable for people weighing more than <strong>80 kg</strong></li></ul>',
        '<h2><strong>Hygiene and sanitation</strong></h2>',
        '<p>Every hire wheelchair is thoroughly <strong>cleaned and sanitised</strong> in its entirety.<br />Cleanliness and hygiene are an absolute priority for us.</p>',
        '<h2><strong>Rental and shipping zones</strong></h2>',
        '<p>Let\'s carry out the <strong>hire of a small transit wheelchair</strong> in</p>',
        '<ul><li><strong>Lazio</strong></li><li><strong>Tuscany</strong></li></ul>',
        '<p>It is also possible to request the <strong>courier delivery throughout Italy</strong>.</p>',
        '<h2><strong>How to book</strong></h2>',
        '<p>Book your hire online now <strong>folding transit wheelchair SLIM</strong> or contact us:</p>',
        '<ul><li>📞 <strong>Telephone / WhatsApp</strong>: +39 3926509237</li><li>✉ <strong>Email</strong>: amministrazione@miamedicalitalia.it</li></ul>',
        '<p>Discover also our <strong>page <a href="http://facebook.com/MIAMedicalitalia/">Facebook</a></strong> for updates and offers. The small transit wheelchair hire is essential for those with space issues.</p>',
      ].join(''),
    },
  },

  specs: {
    propulsion: 'transit',
    'age-group': 'adult',
    'max-load': 80,
    'seat-width': { min: 40, max: 43 },
    foldable: true,
    'removable-armrests': true,
    'removable-footrests': true,
    brakes: 'parking',
  },

  media: {
    thumbnail: { file: 'slim-transit-1.jpg', alt: { it: 'Affitto carrozzina per disabili di piccole dimensioni' } },
    gallery: [
      'slim-transit-2.jpg',
    ],
  },

  addons: [homeDelivery(30), legRaiser],

  questions: [...hireIntake],
  terms: [generalTerms],
});
