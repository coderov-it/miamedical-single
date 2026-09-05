/**
 * Noleggio scooter elettrico pieghevole S19
 *
 * /prodotto/scooter-elettrico-pieghevole-s19/  ·  WooCommerce product 9724.
 *
 * The page states a 300 € deposit and free delivery on hires of 30 days or more,
 * but never puts a price on delivery for a shorter hire — so no delivery add-on
 * is written. Inventing the 30 € the wheelchair pages charge would be guessing.
 *
 * `battery-range` is unset: this is the one scooter whose page omits it.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { electricWheelchairsAndScootersHire } from './category.ts';

export const foldingScooterS19 = electricWheelchairsAndScootersHire.rental({
  code: 'folding-scooter-s19',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(3, 90),
    days(7, 140),
    days(15, 225),
    days(30, 300),
    days(45, 360),
  ],

  translations: {
    it: {
      title: 'Noleggio scooter elettrico pieghevole S19',
      slug: 'scooter-elettrico-pieghevole-s19',
      shortDescription: 'Libertà e Movimento! Noleggia il tuo scooter pieghevole e riscopri la tua indipendenza! Il ritiro in magazzino è gratuito. Siamo a Roma e Firenze. Consegna gratuita a Roma e Firenze per i noleggi da 30 giorni! Deposito richiesto: 300€ Per il noleggio di questo articolo è richiesto un deposito di 300€.',
      metaTitle: 'Noleggio scooter elettrico Pieghevole S19 per disabili e anziani',
      metaDescription: 'Noleggio scooter elettrico pieghevole S19 per anziani e disabili. Leggero, compatto e facile da trasportare. A Roma e Firenze con consegna e ritiro.',
      description: [
        '<h3>Noleggio <strong>Scooter Elettrico pieghevole per anziani e disabili</strong>.</h3>',
        '<p><strong>Il noleggio scooter elettrico pieghevole S19 per anziani e disabili è la soluzione ideale per muoversi in libertà durante i tuoi viaggi in Italia.</strong> Affitta il tuo compagno di viaggio: autonomia a portata di mano, semplice, sicuro e conveniente! Per una mobilità senza limiti è la tua chiave per l’indipendenza.</p>',
        '<p>Leggero, compatto, elettrico: il tuo alleato di viaggio nelle meraviglie Italiane! </p>',
        '<p>Scopri Roma o Firenze al tuo ritmo, senza rinunce e con il massimo del comfort. Lo&nbsp;<strong>Scooter Foldable S19</strong>&nbsp;è la <strong>soluzione perfetta</strong> per chi desidera vivere la città con autonomia e stile. Che tu sia in vacanza, in viaggio culturale o in visita ai tuoi cari, il servizio di <strong>noleggio</strong> di questo <strong>scooter elettrico pieghevole</strong>, sia per anziani che disabili, è pensato per rendere ogni <strong>spostamento facile, sicuro e piacevole.</strong></p>',
        '<h4>Perché noleggiare lo Scooter Elettrico Pieghevole S19 per anziani e disabili</h4>',
        '<ul><li><strong>Pieghevole e ultraleggero</strong>: si richiude in pochi secondi e pesa solo 27 kg (25 kg senza batteria). Perfetto per entrare in taxi, hotel o musei.</li><li><strong>Autonomia fino a 15 km</strong>: esplora i Fori Imperiali, Piazza Navona o gli Uffizi senza pensieri.</li><li><strong>Ruote piene e sterzo stabile</strong>: guida fluida anche su sanpietrini e strade irregolari.</li><li><strong>Batteria al litio removibile</strong>: ricaricala facilmente, anche in camera d’albergo.</li><li><strong>Sedile comodo e smontabile</strong>: per un trasporto ancora più pratico.</li></ul>',
        '<h4>Specifiche Tecniche Scooter Elettrico per la Mobilità Pieghevole S19 </h4>',
        '<ul><li><strong>Velocità massima</strong>: 6 km/h</li><li><strong>Pendenza massima superabile</strong>: 3°</li><li><strong>Capacità di carico</strong>: fino a 115 kg</li><li><strong>Dimensioni da chiuso</strong>: 75 × 48,5 × 45&nbsp;<strong>cm&nbsp;</strong></li><li><strong>Batteria</strong>: Litio 24V 12 Ah</li><li><strong>Motore</strong>: 270W</li></ul>',
        '<p>Clicca <a href="/wp-content/uploads/2023/02/SCHEDA-TECNICA-S19.pdf?_gl=1*dp7kq0*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1MzA0MS4yLjEuMTc0NDQ1MzA2MC4wLjAuMA..">qui</a> per scaricare la scheda tecnica completa! </p>',
        '<h4>Pensato per ogni esigenza, lo Scooter S19 è ideale per:</h4>',
        '<ul><li>Visitatori senior o con mobilità ridotta</li><li>Turisti che vogliono esplorare senza fatica</li><li>Famiglie con nonni al seguito</li><li>Persone temporaneamente infortunate</li><li>Donne in dolce attesa</li><li>persone con disabilità </li></ul>',
        '<h4>Come funziona il noleggio? </h4>',
        '<p>Il nostro <strong>Scooter Elettrico Pieghevole S19 per anziani e disabili</strong> è disponibile per il noleggio con consegna e ritiro a <strong>Roma</strong> e <strong>Firenze</strong>. <strong><a href="/prodotto/scooter-elettrico-pieghevole-s19/?_gl=1*1r9me3a*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1MzA0MS4yLjEuMTc0NDQ1MzA1Mi4wLjAuMA..">Prenotalo online</a></strong> o chiamaci al numero <strong><a href="https://wa.me/393926509237">+39 392 65 09 237</a></strong>: al resto ci pensiamo noi! Prenota ora il tuo scooter e scopri l’Italia in libertà.</p>',
        '<p>Nota bene: ricorda sempre di consultare le nostre <strong><a href="/mia-medical-condizioni-di-noleggio-dei-nostri-ausili-medicali/?_gl=1*sfjc3p*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1MzA0MS4yLjEuMTc0NDQ1NDU3OC4wLjAuMA..">condizioni di noleggio. </a></strong></p>',
        '<p>Muoviti senza stress, goditi ogni scorcio e vivi la città come un local. Il tuo viaggio inizia con un passo semplice… e quattro ruote comode.</p>',
        '<h4>Contattaci per disponibilità e tariffe giornaliere.</h4>',
        '<p><strong><a href="/catalogo-noleggio/">Scopri anche gli altri modelli di scooter elettrici per la mobilità che Mia Medical Italia ha da offrire</a></strong>, e leggi il nostro <strong><a href="/scooter-elettrici-per-mobilita-a-roma-i-vantaggi-del-noleggio/?_gl=1*6byas2*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1MzA0MS4yLjEuMTc0NDQ1NDY1OC4wLjAuMA..">articolo informativo</a></strong> sul nostro blog per scoprire tutti i vantaggi di muoversi con uno scooter, e la guida per una scelta consapevole.&nbsp;</p>',
        '<p>Se hai quale dubbio il nostro team è sempre disponibile a rispondere a qualsiasi domanda, e ad aiutarti a scegliere l’opzione che più si adatta alle tue esigenze!&nbsp;</p>',
        '<p><strong>Riscopri la libertà di muoverti in autonomia con Mia Medical Italia! Chiamaci ora al&nbsp;<a href="https://wa.me/393926509237">+39 392 65 09 237. </a></strong></p>',
      ].join(''),
    },
    en: {
      title: 'Folding electric scooter S19 for hire',
      slug: 'scooter-elettrico-pieghevole-s19',
      shortDescription: 'Freedom and Movement! Rent your folding scooter and rediscover your independence! Pick-up at the warehouse is free. We are in Rome and Florence. Free delivery in Rome and Florence for 30-day rentals! Deposit required: 300€ For the rental of this article, a deposit of 300€.',
      metaTitle: 'Folding electric scooter S19 hire | For older and disabled users',
      metaDescription: 'Hire the S19 folding mobility scooter: light, compact and easy to transport. Rome and Florence, with delivery and collection.',
      description: [
        '<h3>Hire <strong>Folding electric scooter for the elderly and disabled</strong>.</h3>',
        '<p><strong>The S19 folding electric mobility scooter for the elderly and disabled is the ideal solution for getting around freely during your trips in Italy.</strong> Hire your travel companion: freedom at your fingertips, simple, safe and affordable! For limitless mobility, it is your key to independence.</p>',
        '<p>Light, compact, electric: your travel ally in the wonders of Italy! </p>',
        '<p>Discover Rome or Florence at your own pace, without renouncing comfort. Lo&nbsp;<strong>Scooter Foldable S19</strong>&nbsp;is the <strong>perfect solution</strong> for those who want to experience the city with independence and style. Whether you are on holiday, a cultural trip or visiting loved ones, the service of <strong>rental</strong> of this <strong>folding electric scooter</strong>, both for the elderly and people with disabilities, is designed to make every <strong>easy, safe and pleasant movement.</strong></p>',
        '<h4>Why hire the S19 folding mobility scooter for the elderly and disabled</h4>',
        '<ul><li><strong>Foldable and ultralight</strong>It folds up in seconds and weighs only 27 kg (25 kg without battery). Perfect for entering taxis, hotels or museums.</li><li><strong>Autonomy up to 15 km</strong>explore the Imperial Forum, Piazza Navona or the Uffizi without any worries.</li><li><strong>Full wheels and stable steering</strong>smooth driving even on cobblestones and uneven roads.</li><li><strong>Removable lithium battery</strong>recharge it easily, even in your hotel room.</li><li><strong>Comfortable, removable seat</strong>for even more practical transport.</li></ul>',
        '<h4>Technical Specifications of the S19 Folding Mobility Scooter </h4>',
        '<ul><li><strong>Maximum speed</strong>6 km/h</li><li><strong>Maximum surmountable slope</strong>: 3°</li><li><strong>Load capacity</strong>up to 115 kg</li><li><strong>Dimensions when closed</strong>: 75 × 48,5 × 45&nbsp;<strong>cm&nbsp;</strong></li><li><strong>Battery</strong>Lithium 24V 12 Ah</li><li><strong>Motor</strong>: 270W</li></ul>',
        '<p>Click <a href="/wp-content/uploads/2023/02/SCHEDA-TECNICA-S19.pdf?_gl=1*dp7kq0*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1MzA0MS4yLjEuMTc0NDQ1MzA2MC4wLjAuMA..">here</a> to download the complete data sheet! </p>',
        '<h4>Designed for every need, the Scooter S19 is ideal for:</h4>',
        '<ul><li>Senior visitors or visitors with reduced mobility</li><li>Tourists who want to explore effortlessly</li><li>Families with accompanying grandparents</li><li>Temporarily injured persons</li><li>Expectant women</li><li>people with disabilities </li></ul>',
        '<h4>How does rental work? </h4>',
        '<p>Our <strong>S19 Foldable Electric Scooter for the Elderly and Disabled</strong> is available for hire with delivery and collection at <strong>Rome</strong> e <strong>Florence</strong>. <strong><a href="/en/product/scooter-elettrico-pieghevole-s19/">Book it online</a></strong> or call us on <strong><a href="https://wa.me/393926509237">+39 392 65 09 237</a></strong>we\'ll take care of the rest! Book your scooter now and discover Italy in freedom.</p>',
        '<p>Please note: always remember to consult our <strong><a href="/en/mia-medical-condizioni-di-noleggio-dei-nostri-ausili-medicali/?_gl=1*sfjc3p*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1MzA0MS4yLjEuMTc0NDQ1NDU3OC4wLjAuMA..">rental conditions. </a></strong></p>',
        '<p>Move without stress, enjoy every glimpse and experience the city like a local. Your journey begins with a simple step... and four comfortable wheels.</p>',
        '<h4>Contact us for availability and daily rates.</h4>',
        '<p><strong><a href="/en/rental-catalog/">Discover also the other electric mobility scooter models Mia Medical Italia has to offer</a></strong>and read our <strong><a href="/en/scooter-elettrici-per-mobilita-a-roma-i-vantaggi-del-noleggio/?_gl=1*6byas2*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1MzA0MS4yLjEuMTc0NDQ1NDY1OC4wLjAuMA..">informative article</a></strong> on our blog to discover all the advantages of getting around on a scooter, and the guide to making an informed choice.&nbsp;</p>',
        '<p>If you have any doubts, our team is always available to answer any questions and help you choose the option that best suits your needs!&nbsp;</p>',
        '<p><strong>Rediscover the freedom to move independently with Mia Medical Italia! Call us now at&nbsp;<a href="https://wa.me/393926509237">+39 392 65 09 237. </a></strong></p>',
      ].join(''),
    },
  },

  specs: {
    propulsion: 'electric',
    'max-load': 115,
    'max-speed': 6,
    'max-gradient': 3,
    motor: { it: '270 W', en: '270 W' },
    battery: { it: 'Litio 24 V 12 Ah', en: 'Lithium, 24 V 12 Ah' },
    'folded-size': { it: '75 × 48,5 × 45 cm', en: '75 × 48.5 × 45 cm' },
    foldable: true,
  },

  media: {
    thumbnail: { file: 'folding-scooter-s19-1.png', alt: { it: 'Noleggio Scooter elettrico pieghevole, scooter elettrico per anziani e per disabili' } },
    gallery: [
      'folding-scooter-s19-2.jpg',
      'folding-scooter-s19-3.png',
      'folding-scooter-s19-4.png',
    ],
  },

  questions: [...hireIntake],
  terms: [generalTerms],
});
