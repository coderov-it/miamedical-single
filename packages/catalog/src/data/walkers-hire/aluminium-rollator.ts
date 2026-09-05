/**
 * Noleggio deambulatore rollator in alluminio
 *
 * /prodotto/noleggio-deambulatore-rollatore-in-alluminio/
 * WooCommerce product 9085 — the other walker with an attribute table, and the
 * only product in the catalogue whose table names a manufacturer:
 *
 *   Maximum capacity  150 Kg    Heights  Regolabile da 79cm a 92 cm
 *   Weight  7kg                 Altezza sedile da terra  54 cm
 *   Dimensions  Ingombro totale 62 cm      Color  Arancione | Verde
 *   Marca  Moretti Mopedia
 *
 * The `Seating height` attribute carries four values at once — `45 - 50cm`,
 * `49-50 cm`, `53 cm`, `54 cm` — which is the shop's global attribute term list
 * showing through rather than four heights for this rollator. `seat-height` takes
 * the figure its own row states, 54 cm, and the ambiguity is noted in
 * docs/catalog/README.md.
 *
 * ⚠️ Two load limits. The attribute table says `Maximum capacity 150 Kg`; the
 * page's own selling points say "Portata Massima fino a 136 kg", and so does the
 * sale twin (8996). 136 kg is recorded — the lower figure, because a load limit
 * is a safety figure, and the corroborated one.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { walkersHire } from './category.ts';

export const aluminiumRollator = walkersHire.rental({
  code: 'aluminium-rollator',
  status: 'active',
  brand: 'Moretti Mopedia',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(7, 30),
    days(15, 35),
    days(30, 50),
    days(45, 65),
    days(60, 80),
    days(90, 100),
  ],

  translations: {
    it: {
      title: 'Noleggio deambulatore rollator in alluminio',
      slug: 'noleggio-deambulatore-rollatore-in-alluminio',
      shortDescription: 'Consegna a Roma e Firenze a partire da 30€. Nessun deposito richiesto. La consegna e il ritiro in magazzino sono GRATUITI!',
      metaTitle: 'Noleggio Deambulatore Rollator Pieghevole a Roma e Firenze',
      metaDescription: 'Noleggio e vendita Deambulatore pieghevole leggero, freni e seduta. Migliore Prezzo Garantito. Fidati di noi. Siamo esperti nel noleggio e la vendita.',
      description: [
        '<p>Scopri il nostro rollator <strong>Oceano 2.0</strong> della linea <strong><a href="https://www.morettispa.com/mopedia/">MOPEDIA</a></strong>, l’ausilio perfetto per chi desidera muoversi con <strong>sicurezza</strong> e <strong>comodità</strong>. Grazie al suo <strong>design intelligente</strong> e alle sue <strong>numerose funzionalità</strong>, questo <strong>rollator pieghevole</strong> garantisce una <strong>mobilità completa</strong>, sia per <strong>l’uso quotidiano in casa</strong> che per brevi <strong>spostamenti all’esterno</strong>. Il <strong>noleggio del nostro rollator pieghevole a 4 ruote</strong> è la scelta ottimale per chi cerca <strong>qualità e praticità</strong> a <strong>Roma</strong> e <strong>Firenze</strong>.</p>',
        '<h4>Caratteristiche Tecniche e Funzionalità :</h4>',
        '<ul><li><strong>Struttura Robusta e Leggera:</strong> Realizzato in tubo di alluminio verniciato, il rollator Oceano 2.0 combina resistenza e leggerezza per garantire una lunga durata senza appesantire l’utente.</li><li><strong>Design Pieghevole e Smontabile:</strong> Facilita il trasporto e lo stoccaggio, rendendolo perfetto anche per spazi ridotti.</li><li><strong>4 Ruote da Ø 20 cm:</strong></li><li><strong>Frontali Piroettanti:</strong> Dotate di forca completa e catarifrangente per una maggiore visibilità e manovrabilità.</li><li><strong>Posteriori Fisse con Freni a Doppia Funzione:</strong> Assicurano stabilità e sicurezza in ogni situazione.</li><li><strong>Impugnature Anatomiche Regolabili in Altezza:</strong> Offrono il massimo comfort, adattandosi alle esigenze individuali e garantendo una presa sicura, complete di catarifrangente per un’aggiunta di sicurezza.</li><li><strong>Design Ultraleggero,</strong> solo <strong>7kg</strong>.</li><li><strong>Portata Massima</strong> fino a <strong>136 kg.</strong></li></ul>',
        '<p><strong>Accessori Integrati:</strong></p>',
        '<ul><li><strong>Seduta Inclusa:</strong> Con dimensioni ottimali per un breve riposo durante la deambulazione.</li><li><strong>Schienale, Borsa e Porta Bastone/Stampella:</strong> Tutto ciò che serve per avere un supporto completo e funzionale.</li></ul>',
        '<h4>Curiosità e Innovazione: perché scegliere il modello “Oceano 2.0”</h4>',
        '<ul><li><strong>Design Rivoluzionario:</strong> Il <strong>sistema pieghevole</strong> e gli <strong>accessori integrati</strong> rendono questo rollator un compagno ideale per chi vuole vivere ogni giornata come un’avventura.</li><li><strong>Un Mondo di Comfort:</strong> Le <strong>impugnature anatomiche regolabili</strong> e il <strong>sedile incorporato </strong>offrono un <strong>supporto su misura</strong>, <strong>riducendo l’affaticamento</strong> e <strong>favorendo una postura corretta.</strong></li><li><strong>Sicurezza Prima di Tutto:</strong> I dettagli come i <strong>catarifrangenti</strong> e i <strong>freni a doppia funzione </strong>sottolineano il nostro impegno per garantire la <strong>massima sicurezza in ogni movimento.</strong></li></ul>',
        '<h4>Perché Scegliere il Noleggio Rollator di Mia Medical a Roma e Firenze?</h4>',
        '<p><strong>Vantaggi Economici e di Flessibilità </strong></p>',
        '<ul><li><strong>Risparmio Garantito:</strong> Noleggia il rollator per il tempo di cui hai veramente bisogno, evitando l’investimento dell’acquisto.</li><li>• <strong>Flessibilità Totale:</strong> Soluzione ideale per periodi di riabilitazione, recupero post-operatorio o per esigenze temporanee.</li><li>• <strong>Assistenza e Manutenzione Incluse:</strong> Riceverai un dispositivo igienizzato e sempre pronto all’uso, con supporto tecnico dedicato.</li></ul>',
        '<p><strong>Un Servizio su Misura per Te</strong></p>',
        '<p>Sia che tu sia di <strong>Roma</strong> o <strong>Firenze</strong>, il nostro <strong>servizio di noleggio rollator</strong> è studiato per offrire una <strong>consulenza personalizzata</strong>, <strong>consegna rapida</strong>, <strong>assistenza qualificata</strong> e la certezza di un <strong>prodotto di alta qualità</strong>. Che aspetti, <a href="https://wa.me/393926509237">contattaci ora</a> !</p>',
        '<p><strong><a href="https://wa.me/393926509237">Contattaci ora</a></strong>! Scopri sul <strong><a href="/catalogo-noleggio/">nostro sito la vasta gamma di deambulatori disponibili</a></strong>. Inoltre, per te anche un <a href="/come-si-scegli-il-deambulatore-giusto/">articolo-guida</a> per una scelta consapevole dell’ausilio medicale che meglio si adatta alle tue esigenze. Prenota il tuo rollator oggi stesso!</p>',
        '<p>Inoltre, se sei il <strong>caregiver</strong> di una persona anziana o di una persona non autosufficiente e hai bisogno di un <strong>aiuto</strong>, il nostro <strong>infermiere</strong> di fiducia <strong><a href="http://www.arnaldiandrea.com">Andrea Arnaldi</a></strong>è specializzato nel campo <strong>dell’assistenza domiciliare</strong>, ed è pronto ad affiancarti per portare avanti le cure dal comfort della tua abitazione. </p>',
        '<p>Se stai cercando un servizio di <strong>noleggio di un rollator</strong> che unisca <strong>funzionalità</strong>, <strong>sicurezza</strong> e <strong>design innovativo</strong>, allora sei nel posto giusto! Abbiamo la soluzione per te. <strong><a href="https://wa.me/393926509237">Contattaci oggi stesso</a></strong><strong>per una consulenza gratuita e scopri come possiamo migliorare la tua mobilità con un servizio personalizzato e di alta qualità.</strong></p>',
      ].join(''),
    },
    en: {
      title: 'Aluminium rollator for hire',
      slug: 'noleggio-deambulatore-rollatore-in-alluminio',
      shortDescription: 'Delivery in Rome and Florence from 30€. No deposit required. Delivery and collection from the warehouse are FREE!',
      metaTitle: 'Folding rollator hire | Rome and Florence',
      metaDescription: 'Hire or buy a light folding rollator with brakes and a seat. Best price guaranteed — we know hire and sale inside out.',
      description: [
        '<p>Discover our rollator <strong>Ocean 2.0</strong> of the line <strong><a href="https://www.morettispa.com/mopedia/">MOPEDIA</a></strong>the perfect aid for those who want to move with <strong>security</strong> e <strong>comfort</strong>. Thanks to its <strong>intelligent design</strong> and its <strong>numerous functionalities</strong>, this <strong>foldable rollator</strong> guarantees a <strong>full mobility</strong>both for <strong>daily use in the home</strong> that for short <strong>moving outside</strong>. The <strong>rental of our folding 4-wheel rollator</strong> is the optimal choice for those seeking <strong>quality and practicality</strong> a <strong>Rome</strong> e <strong>Florence</strong>.</p>',
        '<h4>Technical Features and Functionality :</h4>',
        '<ul><li><strong>Robust and Lightweight Structure:</strong> Made of painted aluminium tubing, the Oceano 2.0 rollator combines strength and lightness to ensure durability without weighing the user down.</li><li><strong>Foldable and Demountable Design:</strong> It facilitates transport and storage, making it perfect even for small spaces.</li><li><strong>4 Ø 20 cm wheels:</strong></li><li><strong>Pivoting fronts:</strong> Equipped with full fork and reflectors for increased visibility and manoeuvrability.</li><li><strong>Rear Fixed with Dual Function Brakes:</strong> They ensure stability and safety in every situation.</li><li><strong>Height-adjustable anatomic handles:</strong> They offer maximum comfort, adapting to individual needs and ensuring a secure grip, complete with reflector for added safety.</li><li><strong>Ultralight design,</strong> only <strong>7kg</strong>.</li><li><strong>Maximum capacity</strong> until <strong>136 kg.</strong></li></ul>',
        '<p><strong>Integrated Accessories:</strong></p>',
        '<ul><li><strong>Seat included:</strong> With optimal dimensions for a short rest while walking.</li><li><strong>Backrest, Bag and Baton/Bracket:</strong> All that is needed for complete and functional support.</li></ul>',
        '<h4>Curiosity and Innovation: why choose the \'Oceano 2.0\' model</h4>',
        '<ul><li><strong>Revolutionary Design:</strong> The <strong>folding system</strong> and the <strong>integrated accessories</strong> make this rollator an ideal companion for those who want to experience every day as an adventure.</li><li><strong>A World of Comfort:</strong> Le <strong>adjustable anatomical handles</strong> and the <strong>built-in seat </strong>offer a <strong>tailor-made support</strong>, <strong>reducing fatigue</strong> e <strong>promoting correct posture.</strong></li><li><strong>Safety First:</strong> Details such as the <strong>reflectors</strong> and the <strong>dual-function brakes </strong>emphasise our commitment to ensuring the <strong>maximum safety in every movement.</strong></li></ul>',
        '<h4>Why choose Mia Medical Rollator Rental in Rome and Florence?</h4>',
        '<p><strong>Economic and Flexibility Benefits </strong></p>',
        '<ul><li><strong>Guaranteed savings:</strong> Rent the rollator for as long as you really need it, avoiding the investment of the purchase.</li><li>- <strong>Total flexibility:</strong> Ideal solution for periods of rehabilitation, post-operative recovery or for temporary needs.</li><li>- <strong>Service and maintenance included:</strong> You will receive a sanitised and always ready-to-use device with dedicated technical support.</li></ul>',
        '<p><strong>A Tailor-made Service for You</strong></p>',
        '<p>Whether you are from <strong>Rome</strong> o <strong>Florence</strong>our <strong>rollator rental service</strong> is designed to offer a <strong>personalised consultancy</strong>, <strong>rapid delivery</strong>, <strong>qualified assistance</strong> and the certainty of a <strong>high-quality product</strong>. What are you waiting for, <a href="https://wa.me/393926509237">contact us now</a> !</p>',
        '<p><strong><a href="https://wa.me/393926509237">Contact us now</a></strong>! Find out on the <strong><a href="/en/rental-catalog/">our site the wide range of walkers available</a></strong>. Also for you a <a href="/en/come-si-scegli-il-deambulatore-giusto/">article-guide</a> for an informed choice of the medical aid that best suits your needs. Book your rollator today!</p>',
        '<p>Furthermore, if you are the <strong>caregiver</strong> of an elderly or dependent person and you need a <strong>help</strong>our <strong>nurse</strong> trustworthy <strong><a href="http://www.arnaldiandrea.com">Andrea Arnaldi</a></strong>specialises in the field <strong>home care</strong>and is ready to support you in taking care of the comfort of your home. </p>',
        '<p>If you are looking for a <strong>renting a rollator</strong> uniting <strong>functionality</strong>, <strong>security</strong> e <strong>innovative design</strong>then you are in the right place! We have the solution for you. <strong><a href="https://wa.me/393926509237">Contact us today</a></strong><strong>for a free consultation and find out how we can improve your mobility with a high-quality, personalised service.</strong></p>',
      ].join(''),
    },
  },

  specs: {
    'max-load': 136,
    weight: { min: 7, max: 7 },
    'adjustable-height': { min: 79, max: 92 },
    'total-width': { min: 62, max: 62 },
    'seat-height': { min: 54, max: 54 },
    'has-seat': true,
    brakes: 'hand',
    'frame-material': 'aluminium',
    colour: { it: 'Arancione o verde', en: 'Orange or green' },
    foldable: true,
  },

  media: {
    thumbnail: { file: 'aluminium-rollator-1.jpg', alt: { it: 'deambulatore rollatore de interno/esterno' } },
    gallery: [
      'aluminium-rollator-2.jpg',
      'aluminium-rollator-3.jpg',
      'aluminium-rollator-4.jpg',
      'aluminium-rollator-5.jpg',
    ],
  },

  addons: [homeDelivery(30)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
