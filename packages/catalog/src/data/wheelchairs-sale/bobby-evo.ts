/**
 * Vendita Carrozzina Da Transito BOBBY
 *
 * /prodotto/carrozzina-transito-bobby-evo/  ·  WooCommerce product 15673, 310,00 €.
 *
 * The sale listing calls the chair the Bobby EVO throughout its copy and its
 * Yoast title while the product name says only "BOBBY", which is why the code
 * here is `bobby-evo` and the hire twin is `bobby-transit`. The six measurements
 * match that twin exactly — it is the same chair.
 */

import { generalTerms } from '../shared/terms.ts';
import { wheelchairsSale } from './category.ts';

export const bobbyEvo = wheelchairsSale.fixed({
  code: 'bobby-evo',
  status: 'active',

  pricingMode: 'fixed',
  basePrice: 310,

  translations: {
    it: {
      title: 'Vendita Carrozzina Da Transito BOBBY',
      slug: 'carrozzina-transito-bobby-evo',
      shortDescription: 'Carrozzina da Transito Bobby EVO in Vendita Leggera,solo 12kg !!! pieghevole in 4 e ideale per accompagnamento e trasporti rapidi. Struttura compatta con schienale pieghevole e pedane removibili per il massimo comfort e praticità. Seduta larga e freni. Spedizione gratuita in tutta Italia! Consegna rapida direttamente a casa tua, senza costi aggiuntivi. Acquista online o contattaci su WhatsApp per maggiori informazioni!',
      metaTitle: 'Carrozzina da transito Bobby EVO | Leggera e pieghevole',
      metaDescription: 'carrozzina da transito Bobby EVO pieghevole e ultraleggera. Ideale per anziani e persone con mobilità ridotta. Facile da trasportare e sicura.',
      description: [
        '<h2>Carrozzina da Transito Bobby EVO Pieghevole e Ultraleggera</h2>',
        '<p>La carrozzina da transito Bobby EVO è una sedia a rotelle pieghevole e ultraleggera progettata per garantire comfort, sicurezza e praticità durante gli spostamenti quotidiani. Ideale per anziani, persone con mobilità ridotta e pazienti post-operatori, rappresenta una soluzione affidabile per il trasporto assistito sia in ambienti domestici che sanitari.</p>',
        '<h2>Carrozzina da transito compatta e facile da trasportare</h2>',
        '<p>Grazie alla sua struttura leggera e pieghevole, la carrozzina Bobby EVO è facile da chiudere, trasportare e riporre anche in spazi ridotti. È particolarmente indicata per:</p>',
        '<ul><li>trasporto in auto e ambulanza</li><li>visite mediche e ospedaliere</li><li>assistenza domiciliare</li><li>viaggi e spostamenti frequenti</li><li>utilizzo quotidiano in ambienti interni</li></ul>',
        '<p>Il design compatto permette all’accompagnatore di manovrare la carrozzina con facilità e sicurezza.</p>',
        '<h2>A chi è consigliata la carrozzina Bobby EVO</h2>',
        '<p>La sedia a rotelle da transito Bobby EVO è adatta a:</p>',
        '<ul><li>persone anziane con ridotta mobilità</li><li>pazienti in fase di riabilitazione o post-operatoria</li><li>utenti con difficoltà motorie temporanee o permanenti</li><li>caregiver e accompagnatori che necessitano di una carrozzina pratica e leggera</li></ul>',
        '<h2>Caratteristiche principali della carrozzina da transito Bobby</h2>',
        '<p>La carrozzina Bobby EVO offre numerose funzionalità pensate per migliorare comfort e sicurezza:</p>',
        '<ul><li>telaio pieghevole ultraleggero</li><li>schienale ribaltabile salva spazio</li><li>pedane poggiapiedi removibili e regolabili</li><li>braccioli girevoli con protezione abiti</li><li>doppio sistema frenante per utente e accompagnatore</li><li>struttura stabile e resistente</li><li>facile trasporto e stoccaggio</li></ul>',
        '<h2>Dimensioni e specifiche tecniche</h2>',
        '<ul><li>Peso massimo supportato: 115 kg</li><li>Peso totale: circa 12,4 – 13 kg</li><li>Larghezza seduta: da 39 a 48 cm</li><li>Larghezza totale: da 46 a 57 cm</li><li>Lunghezza totale: 101 cm</li><li>Altezza totale: 90 cm</li></ul>',
        '<h2>Sicurezza e comfort negli spostamenti</h2>',
        '<p>La carrozzina pieghevole Bobby EVO è progettata per offrire stabilità e comfort anche durante utilizzi prolungati. Il sistema frenante integrato garantisce maggiore controllo negli spostamenti, mentre la struttura ergonomica migliora la comodità dell’utilizzatore.</p>',
        '<h2>Acquista la carrozzina da transito Bobby EVO</h2>',
        '<p>Acquista online la carrozzina da transito Bobby EVO e scegli una soluzione pratica, resistente e facile da trasportare. Contattaci per ricevere informazioni, disponibilità e supporto nella scelta del modello più adatto alle tue esigenze.</p>',
        '<p>Con Bobby EVO, ogni spostamento diventa più semplice e sicuro.</p>',
        '<p>Guarda anche la versione elettrica Starlight : <a href="/prodotto/vendita-carrozzina-elettrica-ultraleggera-pieghevole/">/prodotto/vendita-carrozzina-elettrica-ultraleggera-pieghevole/</a></p>',
        '<p>Prendi il noleggio in considerazione : <a href="/prodotto/noleggio-carrozzina-pieghevole-da-transito/">/prodotto/noleggio-carrozzina-pieghevole-da-transito/</a></p>',
        '<p>Acquista subito la carrozzina da transito Bobby oppure contattaci per ricevere maggiori informazioni.</p>',
        '<p>📞 Telefono / WhatsApp: +39 392 650 9237<br />✉ Email: info@miamedicalitalia.it</p>',
        '<h2>Link Utili</h2>',
        '<p>Per approfondire il tema della mobilità assistita e degli ausili per persone con disabilità puoi consultare il sito del <a href="https://www.salute.gov.it/new/">Ministero della Salute.</a></p>',
      ].join(''),
    },
    en: {
      title: 'BOBBY transit wheelchair for sale',
      slug: 'carrozzina-transito-bobby-evo',
      shortDescription: 'Bobby EVO Transit Wheelchair for Sale Lightweight – just 12kg!!! Folds into four sections and is ideal for taking with you and for quick transport. Compact frame with a foldable backrest and removable footrests for maximum comfort and practicality. Wide seat and brakes. Free shipping across the whole of Italy! Fast delivery straight to your door, at no extra cost. Shop online or contact us on WhatsApp for more information!',
      metaTitle: 'Bobby EVO transit wheelchair | Light and folding',
      metaDescription: 'Buy the Bobby EVO transit wheelchair: 12.4–13 kg, folds in four, folding backrest, swing-away armrests, dual brakes. Free delivery in Italy.',
      description: [
        '<h2>Bobby EVO Foldable and Ultralight Transit Wheelchair</h2>',
        '<p>The Bobby EVO transit wheelchair is a foldable and ultralightweight wheelchair designed to guarantee comfort, safety and practicality during daily journeys. Ideal for the elderly, people with reduced mobility and post-operative patients, it represents a reliable solution for assisted transport in both domestic and healthcare environments.</p>',
        '<h2>A compact, easy-to-carry everyday wheelchair</h2>',
        '<p>Thanks to its lightweight and foldable structure, the Bobby EVO wheelchair is easy to fold, transport and store even in confined spaces. It is particularly suitable for:</p>',
        '<ul><li>transport by car and ambulance</li><li>medical and hospital appointments</li><li>home care</li><li>frequent travel and movement</li><li>daily indoor use</li></ul>',
        '<p>The compact design allows the attendant to manoeuvre the wheelchair with ease and safety.</p>',
        '<h2>Who is the Bobby EVO wheelchair recommended for</h2>',
        '<p>The Bobby EVO transit wheelchair is suitable for:</p>',
        '<ul><li>Elderly people with reduced mobility</li><li>patients undergoing rehabilitation or in the post-operative phase</li><li>users with temporary or permanent mobility impairments</li><li>carers and companions who need a practical, lightweight wheelchair</li></ul>',
        '<h2>Key features of the Bobby transit wheelchair</h2>',
        '<p>The Bobby EVO wheelchair offers numerous features designed to improve comfort and safety:</p>',
        '<ul><li>ultra-lightweight folding frame</li><li>space-saving fold-down backrest</li><li>removable and adjustable footrests</li><li>swivel armrests with garment protection</li><li>dual braking system for the user and the carer</li><li>sturdy and durable construction</li><li>easy to transport and store</li></ul>',
        '<h2>Dimensions and technical specifications</h2>',
        '<ul><li>Maximum weight supported: 115 kg</li><li>Total weight: approx. 12.4 – 13 kg</li><li>Seat width: 39 to 48 cm</li><li>Total width: 46 to 57 cm</li><li>Total length: 101 cm</li><li>Total height: 90 cm</li></ul>',
        '<h2>Safety and comfort when travelling</h2>',
        '<p>The Bobby EVO folding wheelchair is designed to offer stability and comfort even during prolonged use. The integrated braking system guarantees greater control when on the move, while the ergonomic structure enhances the user\'s comfort.</p>',
        '<h2>Buy the Bobby EVO mobility scooter</h2>',
        '<p>Buy the Bobby EVO transit wheelchair online and choose a practical, durable and easy-to-transport solution. Contact us for information, availability and support in choosing the model best suited to your needs.</p>',
        '<p>With Bobby EVO, every journey becomes simpler and safer.</p>',
        '<p>See also the Starlight electric version: <a href="/en/product/vendita-carrozzina-elettrica-ultraleggera-pieghevole/">/prodotto/vendita-carrozzina-elettrica-ultraleggera-pieghevole/</a></p>',
        '<p>Do consider hiring one: <a href="/en/product/noleggio-carrozzina-pieghevole-da-transito/">/prodotto/noleggio-carrozzina-pieghevole-da-transito/</a></p>',
        '<p>Buy the Bobby transit wheelchair now, or contact us for more information.</p>',
        '<p>📞 Phone / WhatsApp: +39 392 650 9237<br />Email: info@miamedicalitalia.it</p>',
        '<h2>Useful Links</h2>',
        '<p>To find out more about assisted mobility and aids for disabled people, you can visit the website of <a href="https://www.salute.gov.it/new/">Ministry of Health.</a></p>',
      ].join(''),
    },
  },

  specs: {
    propulsion: 'transit',
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
    thumbnail: { file: 'bobby-evo-1.jpg', alt: { it: 'Carrozzina da transito Bobby EVO' } },
    gallery: [
      'bobby-evo-2.jpg',
      'bobby-evo-3.jpg',
      { file: 'bobby-evo-4.jpg', alt: { it: 'Carrozzina da transito Bobby EVO' } },
      'bobby-evo-5.jpg',
    ],
  },
  terms: [generalTerms],
});
