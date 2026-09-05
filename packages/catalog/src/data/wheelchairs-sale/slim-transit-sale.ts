/**
 * Vendita Carrozzina SLIM da transito – Piccole dimensioni
 *
 * /prodotto/vendita-carrozzina-slim-da-transito-piccole-dimensioni/
 * WooCommerce product 15839, 280,00 €.
 *
 * ⚠️ This product carries NO product_cat term on the live site — not even the
 * "Vendita" container. It is filed here from its own title and its copy, which
 * sell it as the transit SLIM; docs/catalog/source/placement.json records that.
 */

import { generalTerms } from '../shared/terms.ts';
import { wheelchairsSale } from './category.ts';

export const slimTransitSale = wheelchairsSale.fixed({
  code: 'slim-transit-sale',
  status: 'active',

  pricingMode: 'fixed',
  basePrice: 280,

  translations: {
    it: {
      title: 'Vendita Carrozzina SLIM da transito – Piccole dimensioni',
      slug: 'vendita-carrozzina-slim-da-transito-piccole-dimensioni',
      shortDescription: 'Vendita Carrozzina Slim di Transito Ideale per gli spazi ridotti! Consegna gratuita in tutta Italia. Disponibilità immediata.',
      metaTitle: 'Carrozzina da Transito piccole dimensioni SLIM | Vendita',
      metaDescription: 'La carrozzina da transito piccole dimensioni SLIM è ideale per passaggi stretti, ascensori e uso domestico. Leggera, pieghevole e sanificata.',
      description: [
        '<p>La <strong>carrozzina da transito piccole dimensioni</strong> SLIM è progettata per garantire massima maneggevolezza in spazi ridotti. Ideale per uso domestico e assistenza, rappresenta la soluzione perfetta per chi necessita di una sedia a rotelle compatta, pratica e facilmente trasportabile.</p>',
        '<p>Grazie alla sua struttura stretta, è perfetta per muoversi agilmente in ambienti con passaggi limitati come bagni, ascensori e corridoi.</p>',
        '<h2>A chi è consigliata questa carrozzina da transito</h2>',
        '<p>La carrozzina SLIM è indicata per:</p>',
        '<ul><li>Anziani</li><li>Persone con disabilità temporanee o permanenti</li><li>Pazienti in riabilitazione post-infortunio o intervento</li></ul>',
        '<h2>Caratteristiche principali: carrozzina da transito SLIM</h2>',
        '<p>La <strong>carrozzina da transito di piccole dimensioni SLIM</strong> offre:</p>',
        '<ul><li>Telaio pieghevole per facile trasporto e stoccaggio</li><li>Braccioli e pedane estraibili e removibili</li><li>Doppio freno per la massima sicurezza</li><li>Struttura stretta ideale per spazi ridotti</li><li>Seduta disponibile da 40 cm o 43 cm</li></ul>',
        '<h2>Versioni disponibili della carrozzina SLIM</h2>',
        '<p>La carrozzina SLIM è disponibile in due versioni:</p>',
        '<ul><li><strong><a href="/prodotto/noleggio-sedia-a-rotelle-stretta-carrozzina-slim-di-transito/">Da transito</a></strong> (con accompagnatore)</li><li>Ad autospinta (per uso autonomo)</li></ul>',
        '<h2>Portata e dimensioni della carrozzina da transito SLIM</h2>',
        '<ul><li>Peso massimo supportato: 80 kg</li><li>Design compatto per ambienti ristretti</li><li>Ideale per utilizzo domestico e strutture sanitarie</li></ul>',
        '<h2>Comfort e accessori opzionali </h2>',
        '<p>Su richiesta è possibile aggiungere:</p>',
        '<ul><li>Alzagambe gratuito (in caso di gesso o necessità mediche)</li><li><strong><a href="/prodotto/cuscino-antidecubito-in-fibra-cava-siliconata/">Cuscino antidecubito</a></strong> (consigliato per uso prolungato)</li></ul>',
        '<h2>Igiene e qualità</h2>',
        '<p>Ogni carrozzina viene consegnata completamente pulita e sanificata.<br />La sicurezza e l’igiene sono una priorità fondamentale.</p>',
        '<h2>Utilizzo ideale</h2>',
        '<p>La carrozzina da transito piccole dimensioni SLIM è perfetta per:</p>',
        '<ul><li>Spostamenti interni in casa</li><li>Strutture sanitarie</li><li>Uso temporaneo o prolungato</li></ul>',
        '<h2>Consegna e spedizione</h2>',
        '<p>Spediamo la carrozzina da transito piccole dimensioni SLIM in tutta Italia tramite corriere.</p>',
        '<h2>Acquisto e informazioni</h2>',
        '<p>Per acquistare la carrozzina da transito di piccole dimensioni SLIM o ricevere informazioni puoi scriverci o chiamarci:</p>',
        '<p>📞 WhatsApp / Telefono: +39 3926509237<br />✉ Email: amministrazione@miamedicalitalia.it</p>',
        '<p>Scopri anche la nostra <strong>pagina <a href="http://facebook.com/MIAMedicalitalia/">Facebook</a></strong> e la nostra pagina <strong><a href="https://www.instagram.com/miamedical_italia/">Instagram</a></strong></p>',
      ].join(''),
    },
    en: {
      title: 'Small SLIM transit wheelchair for sale',
      slug: 'vendita-carrozzina-slim-da-transito-piccole-dimensioni',
      shortDescription: 'Slim transit wheelchair for sale. Ideal where space is tight. Free delivery across Italy. Available immediately.',
      metaTitle: 'Small SLIM transit wheelchair | For sale',
      metaDescription: 'Buy the narrow SLIM transit wheelchair: 40 or 43 cm seat, folding frame, twin brakes, rated to 80 kg. Free delivery across Italy.',
      description: [
        '<p>La <strong>compact transit wheelchair</strong> SLIM is designed to guarantee maximum manoeuvrability in confined spaces. Ideal for home use and caregiving, it is the perfect solution for anyone in need of a compact, practical and easily transportable wheelchair.</p>',
        '<p>Thanks to its narrow frame, it is perfect for moving around smoothly in tight spaces such as bathrooms, lifts and corridors.</p>',
        '<h2>Who is this transit wheelchair recommended for?</h2>',
        '<p>The SLIM wheelchair is suitable for:</p>',
        '<ul><li>Seniors</li><li>People with temporary or permanent disabilities</li><li>Patients in post-injury or post-surgery rehabilitation</li></ul>',
        '<h2>Main features: SLIM transit wheelchair</h2>',
        '<p>La <strong>SLIM compact transport wheelchair</strong> offers:</p>',
        '<ul><li>Folding frame for easy transport and storage</li><li>Extractable and removable armrests and footrests</li><li>Dual brake for maximum safety</li><li>Narrow structure ideal for confined spaces</li><li>Seat available in 40 cm or 43 cm</li></ul>',
        '<h2>Available versions of the SLIM wheelchair</h2>',
        '<p>The SLIM wheelchair is available in two versions:</p>',
        '<ul><li><strong><a href="/en/product/noleggio-sedia-a-rotelle-stretta-carrozzina-slim-di-transito/">In transit</a></strong> (with a companion)</li><li>Self-propelled (for autonomous use)</li></ul>',
        '<h2>Capacity and dimensions of the SLIM transit wheelchair</h2>',
        '<ul><li>Maximum supported weight: 80 kg</li><li>Compact design for confined spaces</li><li>Ideal for home use and healthcare facilities</li></ul>',
        '<h2>Comfort and optional extras </h2>',
        '<p>On request, the following can be added:</p>',
        '<ul><li>Free leg lifter (in the case of a cast or medical needs)</li><li><strong><a href="/en/product/cuscino-antidecubito-in-fibra-cava-siliconata/">Anti-decubitus pillow</a></strong> (recommended for prolonged use)</li></ul>',
        '<h2>Hygiene and quality</h2>',
        '<p>Every wheelchair is delivered completely cleaned and sanitised.<br />Safety and hygiene are a fundamental priority.</p>',
        '<h2>Ideal use</h2>',
        '<p>The SLIM small-sized transit wheelchair is perfect for:</p>',
        '<ul><li>Indoor movements</li><li>Health facilities</li><li>Temporary or prolonged use</li></ul>',
        '<h2>Delivery and dispatch</h2>',
        '<p>We deliver the SLIM compact transit wheelchair throughout Italy by courier.</p>',
        '<h2>Purchase and information</h2>',
        '<p>To purchase the SLIM compact transport wheelchair or to receive further information, please write to us or call us:</p>',
        '<p>📞 WhatsApp / Phone: +39 3926509237<br />Email: amministrazione@miamedicalitalia.it</p>',
        '<p>Discover also our <strong>page <a href="http://facebook.com/MIAMedicalitalia/">Facebook</a></strong> and our page <strong><a href="https://www.instagram.com/miamedical_italia/">Instagram</a></strong></p>',
      ].join(''),
    },
  },

  specs: {
    propulsion: 'transit',
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
  terms: [generalTerms],
});
