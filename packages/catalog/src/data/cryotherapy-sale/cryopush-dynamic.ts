/**
 * Vendita Crioterapia Dinamica Cryopush
 *
 * /prodotto/vendita-crioterapia-dinamica-cryopush/
 * WooCommerce product 14182, 990,00 € — the dynamic Cryopush, and the one
 * cryotherapy page with a real specification block:
 *
 *   Alimentazione CA  100–240 V, 50/60 H     Uscita CC  12 V / 2 A
 *   Livelli di pressione  60–120 mmHg        Temperatura  0 °C – 25 °C
 *   Peso a vuoto  1,78 kg
 *
 * "50/60 H" is the shop's typo for 50/60 Hz; the supply is recorded as written.
 * The page's selling point is treating two areas at once.
 */

import { generalTerms } from '../shared/terms.ts';
import { cryotherapySale } from './category.ts';

export const cryopushDynamic = cryotherapySale.fixed({
  code: 'cryopush-dynamic',
  status: 'active',

  pricingMode: 'fixed',
  basePrice: 990,

  translations: {
    it: {
      title: 'Vendita Crioterapia Dinamica Cryopush',
      slug: 'vendita-crioterapia-dinamica-cryopush',
      shortDescription: 'Cryopush Facilissimo da usare, con altissimi risultati in pochissimi giorni. Con Cryopush, puoi trattare due zone contemporaneamente. Ecco perché l’acquisto della crioterapia compressiva è ideale per il trattamento simultaneo. Cryopush è l’evoluzione nella terapia post traumatica.',
      metaTitle: 'Vendita Crioterapia Dinamica Cryopush',
      metaDescription: 'Vendita Crioterapia Dinamica Cryopush a un prezzo imbattibile. Disponibilità immediata. Ordina online in pochi click! Chiamaci ora!',
      description: [
        '<h3>Vendita Crioterapia Dinamica Cryopush: sistema professionale di crioterapia con compressione per recupero, riabilitazione e controllo del dolore</h3>',
        '<p>La&nbsp;<strong>Crioterapia Compressiva Cryopush</strong>&nbsp;è un sistema avanzato che combina&nbsp;<strong>terapia del freddo controllata e compressione pneumatica</strong>, progettato per&nbsp;<strong>ridurre dolore, infiammazione ed edema</strong>, accelerando i naturali processi di guarigione del corpo.</p>',
        '<p>È una soluzione ideale per:</p>',
        '<ul><li>pazienti in riabilitazione post-operatoria</li><li>persone con patologie muscolo-scheletriche</li><li>atleti professionisti e amatoriali</li><li>studi fisioterapici e strutture sanitarie</li><li>utilizzo domiciliare supervisionato</li></ul>',
        '<p><strong>Hai bisogno di capire se Cryopush è adatto al tuo percorso terapeutico? <a href="https://wa.me/393926509237">Contattaci per una consulenza gratuita.</a></strong></p>',
        '<h3><strong>Cos’è la crioterapia dinamica compressiva Cryopush</strong> in vendita </h3>',
        '<p>La&nbsp;<strong>crioterapia compressiva</strong>&nbsp;unisce:</p>',
        '<ul><li><strong>freddo terapeutico controllato</strong></li><li><strong>compressione regolabile</strong></li></ul>',
        '<p>Il sistema&nbsp;<strong>Cryopush</strong>&nbsp;integra entrambe le tecnologie in un dispositivo compatto, facile da utilizzare e altamente versatile. Il trattamento contribuisce a:</p>',
        '<ul><li>ridurre il dolore senza farmaci</li><li>controllare gonfiore ed edema</li><li>stimolare il flusso sanguigno arterioso</li><li>migliorare la mobilità articolare</li><li>favorire il drenaggio dei liquidi</li><li>ridurre l’acido lattico</li><li>accelerare i meccanismi di guarigione naturali</li></ul>',
        '<p><strong><a href="https://wa.me/393926509237">Parla con un nostro esperto per ricevere informazioni dettagliate sull’utilizzo del dispositivo.</a></strong></p>',
        '<h3><strong>A cosa serve Cryopush</strong></h3>',
        '<p>La crioterapia compressiva Cryopush è indicata per:</p>',
        '<ul><li>traumi muscolari e articolari</li><li>distorsioni e contusioni</li><li>recupero post-chirurgico</li><li>riabilitazione ortopedica</li><li>infiammazioni croniche</li><li>recupero muscolare sportivo</li><li>controllo del dolore acuto e cronico</li></ul>',
        '<p><strong>Se stai affrontando un percorso di riabilitazione, Cryopush può diventare un valido alleato: <a href="https://wa.me/393926509237">contattaci per saperne di più.</a></strong></p>',
        '<h3><strong>Perché scegliere Cryopush rispetto ai protocolli tradizionali</strong></h3>',
        '<p>Cryopush offre benefici superiori rispetto ai protocolli tradizionali&nbsp;<strong>R.I.C.E. / R.I.S.O. (Riposo, Ghiaccio, Compressione, Elevazione)</strong>.</p>',
        '<p><strong>Vantaggi principali:</strong></p>',
        '<ul><li>azione combinata di freddo e compressione</li><li>trattamento uniforme e controllato</li><li>maggiore efficacia nel controllo dell’edema</li><li>stimolazione attiva della circolazione</li><li>miglior comfort per il paziente</li><li>ottimizzazione dei risultati fisioterapici</li></ul>',
        '<p><strong>Vuoi confrontare Cryopush con altri trattamenti? <a href="https://wa.me/393926509237">Il nostro team è a tua disposizione per una consulenza personalizzata.</a></strong></p>',
        '<h3><strong>Come funziona la terapia del freddo con Cryopush</strong></h3>',
        '<p>Il sistema utilizza:</p>',
        '<ul><li>acqua fredda e ghiaccio</li><li>circuito chiuso di circolazione</li><li>indumenti specifici per le diverse aree corporee</li></ul>',
        '<p><strong>Funzionalità chiave:</strong></p>',
        '<ul><li>trattamento simultaneo di&nbsp;<strong>due zone corporee</strong></li><li>regolazione del&nbsp;<strong>tempo di utilizzo</strong></li><li>regolazione del&nbsp;<strong>livello di compressione</strong></li><li>controllo della&nbsp;<strong>temperatura in tempo reale</strong></li></ul>',
        '<p><strong><a href="https://wa.me/393926509237">Contattaci</a> per ricevere indicazioni sull’accessorio più adatto alla zona da trattare.</strong></p>',
        '<h4><strong>Facilità d’uso e portabilità</strong></h4>',
        '<p>Cryopush è progettato per essere:</p>',
        '<ul><li>semplice da utilizzare</li><li>leggero e compatto</li><li>trasportabile</li><li>autonomo</li></ul>',
        '<p>Il sistema è fornito con:</p>',
        '<ul><li>batteria ricaricabile</li><li>impacchi freddi rimovibili e riutilizzabili</li></ul>',
        '<p>È utilizzabile:</p>',
        '<ul><li>in ambito clinico</li><li>a domicilio</li><li>durante programmi di recupero sportivo</li></ul>',
        '<p><strong>Scrivici su <a href="https://wa.me/393926509237">WhatsApp</a> per scoprire se Cryopush è adatto all’uso domiciliare.</strong></p>',
        '<h4><strong>Specifiche tecniche della Crioterapia Dinamica Cryopush</strong> in Vendita</h4>',
        '<ul><li>Alimentazione CA: 100–240 V, 50/60 H</li><li>Uscita CC: 12 V / 2 A</li><li>Livelli di pressione:&nbsp;<strong>60–120 mmHg</strong></li><li>Temperatura:&nbsp;<strong>0 °C – 25 °C</strong></li><li>Rumorosità:&nbsp;<strong>&lt; 50 dB</strong></li><li>Peso a vuoto:&nbsp;<strong>1,78 kg</strong></li><li>Capacità serbatoio:&nbsp;<strong>fino a 3,6 L</strong></li></ul>',
        '<h4><strong>Accessori disponibili</strong></h4>',
        '<p>Il sistema Cryopush è compatibile con accessori specifici per il trattamento mirato delle principali articolazioni:</p>',
        '<ul><li>Accessorio&nbsp;<strong>Spalla</strong></li><li>Accessorio&nbsp;<strong>Ginocchio</strong></li><li>Accessorio&nbsp;<strong>Caviglia</strong></li></ul>',
        '<h4><strong>Vendita Cryopush con MIA Medical Italia</strong></h4>',
        '<p>Acquistando&nbsp;<strong>Cryopush</strong>&nbsp;da&nbsp;<strong>MIA Medical Italia</strong>, hai la certezza di:</p>',
        '<ul><li>dispositivo professionale certificato</li><li>prodotto nuovo e conforme alle normative vigenti</li><li>assistenza pre e post vendita</li><li>spedizione rapida in tutta Italia</li><li>condizioni di vendita chiare e trasparenti</li><li>garanzia legale di conformità</li></ul>',
        '<p><strong><a href="https://wa.me/393926509237">Contattaci ora per informazioni su disponibilità, prezzi e accessori.</a></strong></p>',
        '<h4><strong>Consegna e spedizione</strong></h4>',
        '<ul><li>Spedizione rapida in&nbsp;<strong>tutta Italia</strong></li><li>Imballaggio sicuro</li><li>Costi di spedizione indicati in fase di acquisto</li></ul>',
        '<p><strong><a href="/">Visita il nostro sito o contattaci per ricevere un preventivo personalizzato.</a></strong></p>',
      ].join(''),
    },
    en: {
      title: 'Cryopush dynamic cryotherapy, for sale',
      slug: 'vendita-crioterapia-dinamica-cryopush',
      shortDescription: 'Cryopush Very easy to use, with very high results in just a few days. With Cryopush, you can treat two areas simultaneously. That is why purchasing compressive cryotherapy is ideal for simultaneous treatment. Cryopush is the evolution in post-trauma therapy.',
      metaTitle: 'Cryopush dynamic cryotherapy for sale',
      metaDescription: 'Buy Cryopush dynamic cryotherapy at an unbeatable price. Available immediately — order online in a few clicks.',
      description: [
        '<h3>Cryopush Dynamic Cryotherapy for sale: professional cryotherapy system with compression for recovery, rehabilitation and pain control</h3>',
        '<p>La&nbsp;<strong>Cryopush compression cryotherapy</strong>&nbsp;it is an advanced system that combines&nbsp;<strong>controlled cold therapy and pneumatic compression</strong>designed for&nbsp;<strong>reduce pain, inflammation and oedema</strong>, accelerating the body\'s natural healing processes.</p>',
        '<p>It is an ideal solution for:</p>',
        '<ul><li>post-operative rehabilitation patients</li><li>people with musculoskeletal disorders</li><li>professional and amateur athletes</li><li>physiotherapy practices and healthcare facilities</li><li>supervised home use</li></ul>',
        '<p><strong>Do you need to find out if Cryopush is suitable for your treatment plan? <a href="https://wa.me/393926509237">Contact us for a free consultation.</a></strong></p>',
        '<h3><strong>What is Cryopush dynamic compression cryotherapy</strong> for sale </h3>',
        '<p>La&nbsp;<strong>compression cryotherapy</strong>&nbsp;unites:</p>',
        '<ul><li><strong>controlled therapeutic cold</strong></li><li><strong>adjustable compression</strong></li></ul>',
        '<p>The system&nbsp;<strong>Cryopush</strong>&nbsp;integrates both technologies in a compact, easy-to-use and highly versatile device. The treatment contributes to:</p>',
        '<ul><li>reducing pain without medication</li><li>control swelling and oedema</li><li>stimulate arterial blood flow</li><li>improve joint mobility</li><li>promote fluid drainage</li><li>reduce lactic acid</li><li>accelerate natural healing mechanisms</li></ul>',
        '<p><strong><a href="https://wa.me/393926509237">Speak with one of our experts to receive detailed information on how to use the device.</a></strong></p>',
        '<h3><strong>What Cryopush is for</strong></h3>',
        '<p>The Cryopush compressive cryotherapy system is indicated for:</p>',
        '<ul><li>muscle and joint traumas</li><li>sprains and bruises</li><li>post-surgical recovery</li><li>orthopaedic rehabilitation</li><li>chronic inflammations</li><li>sports muscle recovery</li><li>acute and chronic pain control</li></ul>',
        '<p><strong>If you are undergoing a rehabilitation programme, Cryopush can become a valuable ally: <a href="https://wa.me/393926509237">contact us to find out more.</a></strong></p>',
        '<h3><strong>Why choose Cryopush over traditional protocols</strong></h3>',
        '<p>Cryopush offers superior benefits compared to traditional protocols&nbsp;<strong>R.I.C.E. / R.I.S.O. (Rest, Ice, Compression, Elevation)</strong>.</p>',
        '<p><strong>Main advantages:</strong></p>',
        '<ul><li>combined action of cold and compression</li><li>uniform and controlled treatment</li><li>greater efficacy in oedema control</li><li>active stimulation of circulation</li><li>improved patient comfort</li><li>optimisation of physiotherapy results</li></ul>',
        '<p><strong>Want to compare Cryopush with other treatments? <a href="https://wa.me/393926509237">Our team is at your disposal for a personalised consultation.</a></strong></p>',
        '<h3><strong>How cold therapy works with Cryopush</strong></h3>',
        '<p>The system uses:</p>',
        '<ul><li>cold water and ice</li><li>closed circulation circuit</li><li>specific clothing for different body areas</li></ul>',
        '<p><strong>Key features:</strong></p>',
        '<ul><li>simultaneous treatment of&nbsp;<strong>two body zones</strong></li><li>adjusting the&nbsp;<strong>time of use</strong></li><li>adjusting the&nbsp;<strong>level of compression</strong></li><li>control of the&nbsp;<strong>real time temperature</strong></li></ul>',
        '<p><strong><a href="https://wa.me/393926509237">Contact us</a> to receive advice on the most suitable attachment for the area to be treated.</strong></p>',
        '<h4><strong>Ease of use and portability</strong></h4>',
        '<p>Cryopush is designed to be:</p>',
        '<ul><li>simple to use</li><li>light and compact</li><li>transportable</li><li>autonomous</li></ul>',
        '<p>The system is supplied with:</p>',
        '<ul><li>rechargeable battery</li><li>removable and reusable cold packs</li></ul>',
        '<p>It is usable:</p>',
        '<ul><li>in the clinical field</li><li>at home</li><li>during sports recovery programmes</li></ul>',
        '<p><strong>Write us on <a href="https://wa.me/393926509237">WhatsApp</a> to find out if Cryopush is suitable for home use.</strong></p>',
        '<h4><strong>Technical specifications of Cryopush Dynamic Cryotherapy</strong> for Sale</h4>',
        '<ul><li>AC power: 100–240 V, 50/60 Hz</li><li>DC output: 12 V / 2 A</li><li>Pressure levels:&nbsp;<strong>60–120 mmHg</strong></li><li>Temperature:&nbsp;<strong>0 °C – 25 °C</strong></li><li>Noise level:&nbsp;<strong>&lt; 50 dB</strong></li><li>Empty weight:&nbsp;<strong>1.78 kg</strong></li><li>Tank capacity:&nbsp;<strong>up to 3.6 L</strong></li></ul>',
        '<h4><strong>Available accessories</strong></h4>',
        '<p>The Cryopush system is compatible with specific accessories for the targeted treatment of major joints:</p>',
        '<ul><li>Accessory&nbsp;<strong>Shoulder</strong></li><li>Accessory&nbsp;<strong>Knee</strong></li><li>Accessory&nbsp;<strong>Ankle</strong></li></ul>',
        '<h4><strong>Cryopush sale with Mia Medical Italia</strong></h4>',
        '<p>By purchasing&nbsp;<strong>Cryopush</strong>&nbsp;by&nbsp;<strong>Mia Medical Italia</strong>, you are assured of:</p>',
        '<ul><li>certified professional device</li><li>new and compliant product</li><li>pre- and after-sales service</li><li>fast shipping throughout Italy</li><li>clear and transparent sales conditions</li><li>statutory warranty</li></ul>',
        '<p><strong><a href="https://wa.me/393926509237">Contact us now for information on availability, prices and accessories.</a></strong></p>',
        '<h4><strong>Delivery and dispatch</strong></h4>',
        '<ul><li>Fast shipping in&nbsp;<strong>the whole of Italy</strong></li><li>Safe packaging</li><li>Shipping costs indicated at time of purchase</li></ul>',
        '<p><strong><a href="/en/">Visit our website or contact us for a customised quote.</a></strong></p>',
      ].join(''),
    },
  },

  specs: {
    'power-supply': { it: 'CA 100–240 V, 50/60 H; uscita CC 12 V / 2 A', en: 'AC 100–240 V, 50/60 H; DC output 12 V / 2 A' },
    'treatment-pressure': { it: '60–120 mmHg', en: '60–120 mmHg' },
    'treatment-temperature': { it: '0 °C – 25 °C', en: '0 °C – 25 °C' },
    weight: { min: 1.78, max: 1.78 },
    channels: { it: 'Due zone trattabili contemporaneamente', en: 'Two areas treated at once' },
  },

  media: {
    thumbnail: { file: 'cryopush-dynamic-1.png', alt: { it: 'terapia del freddo con compressione' } },
    gallery: [
      'cryopush-dynamic-2.jpeg',
      'cryopush-dynamic-3.jpeg',
    ],
  },
  terms: [generalTerms],
});
