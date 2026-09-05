/**
 * Scooter pieghevole Deluxe con braccioli
 *
 * /prodotto/scooter-elettrico-pieghevole-con-braccioli-deluxe/
 * WooCommerce product 12120. The same running gear as the S19 — 270 W, the same
 * lithium pack, the same folded size — with armrests and an aluminium-alloy body,
 * which is the aluminium recorded below ("La sua scocca in lega di alluminio").
 *
 * ⚠️ 300 € deposit, and again no delivery price for a hire under 30 days.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { electricWheelchairsAndScootersHire } from './category.ts';

export const deluxeFoldingScooter = electricWheelchairsAndScootersHire.rental({
  code: 'deluxe-folding-scooter',
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
      title: 'Scooter pieghevole Deluxe con braccioli',
      slug: 'scooter-elettrico-pieghevole-con-braccioli-deluxe',
      shortDescription: 'Libertà e movimento Noleggia il tuo scooter pieghevole, riscopri la tua indipendenza! Leggero ed elegante. La sua scocca in lega di alluminio permette di ripiegarlo con facilità per trasportarlo all’interno dell’automobile. Il ritiro in magazzino è gratuito. Siamo a Roma e Firenze. Consegna gratuita a Roma e Firenze per i noleggi da 30 giorni! Deposito richiesto: 300€ Per il noleggio di questo articolo è richiesto un deposito di 300€.',
      metaTitle: 'Noleggio scooter elettrico con braccioli',
      metaDescription: 'Noleggio Scooter Elettrico pieghevole con braccioli Deluxe per anziani e disabili: facilmente trasportabile in automobile.disponibilità immediata.',
      description: [
        '<h3><strong>Noleggio scooter elettrico con braccioli: comfort e libertà in viaggio</strong></h3>',
        '<p>Vivere la magia di&nbsp;<strong><a href="/scooter-elettrici-per-mobilita-a-roma-i-vantaggi-del-noleggio/?_gl=1*1qofl61*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ2MTQ4NS40LjAuMTc0NDQ2MTQ4NS4wLjAuMA..">Roma</a></strong>&nbsp;o l’arte senza tempo di&nbsp;<strong><a href="/florence-accessible-travel-guide-the-citys-inclusive-attractions/?_gl=1*1mfn495*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ2MTQ4NS40LjEuMTc0NDQ2MTUwNS4wLjAuMA..">Firenze</a></strong>&nbsp;non dovrebbe mai essere limitato dal tempo o dalla fatica. Il servizio di <strong>Noleggio</strong> dello <strong>Scooter Elettrico Pieghevole con Braccioli Deluxe</strong>&nbsp;per anziani e disabili nasce per offrire una mobilità agile ma sofisticata, unendo la praticità del design compatto con un comfort superiore. Ideale per chi desidera viaggiare con indipendenza, senza rinunciare alla sicurezza.</p>',
        '<h4>Cosa rende questo scooter davvero deluxe?</h4>',
        '<ul><li><strong>Braccioli integrati</strong>: per un sostegno stabile e una postura più confortevole durante tutto il tragitto.</li><li><strong>Sistema pieghevole intelligente</strong>: richiudibile con pochi gesti, si trasporta facilmente come un trolley.</li><li><strong>Massima autonomia</strong>: fino a 15 km con una sola carica – perfetto per un’intera giornata di visite culturali.</li><li><strong>Batteria al litio removibile</strong>: puoi ricaricarla comodamente anche in hotel o appartamento.</li><li><strong>Stabilità di guida</strong>: ruote anteriori gemellate e posteriori in gomma piena per muoverti agevolmente anche su strade storiche.</li><li><strong>Seduta comfort con schienale</strong><strong>integrato</strong>: per un relax completo anche nei momenti di pausa.</li></ul>',
        '<h4>Specifiche Tecniche dello Scooter Elettrico Pieghevole Deluxe</h4>',
        '<ul><li><strong>Velocità massima</strong>: 6 km/h</li><li><strong>Pendenza affrontabile</strong>: 3°</li><li><strong>Autonomia stimata</strong>: 15 km</li><li><strong>Peso</strong>: 27 kg con batteria – 25 kg senza</li><li><strong>Portata massima</strong>: 115 kg</li><li><strong>Batteria</strong>: Litio 24V 12 Ah</li><li><strong>Motore</strong>: 270W</li><li><strong>Dimensioni da chiuso</strong>: 75 × 48,5 × 45 cm</li></ul>',
        '<p>Clicca <a href="/wp-content/uploads/2023/02/SCHEDA-TECNICA-S19.pdf?_gl=1*3v2y5o*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ2MTQ4NS40LjEuMTc0NDQ2MTU1Ni4wLjAuMA..">qui</a> per scaricare la scheda tecnica completa </p>',
        '<h4>A chi consigliamo il noleggio del nostro scooter elettrico pieghevole Deluxe</h4>',
        '<p><strong>Il modo più semplice per vivere delle città straordinarie.</strong> Questo scooter è la scelta perfetta per:</p>',
        '<ul><li><strong>Viaggiatori senior</strong>, persone con mobilità ridotta o che semplicemente desiderano spostarsi senza fatica.</li><li><strong>Turisti internazionali</strong>&nbsp;che vogliono esplorare Roma e Firenze in libertà, senza rinunciare a comfort e autonomia.</li><li><strong>Famiglie</strong> in vacanza con nonni o parenti che preferiscono un supporto discreto ma funzionale.</li><li><strong>Visitatori temporaneamente infortunati</strong> che non vogliono perdersi le meraviglie d’Italia.</li><li><strong>Donne incinta</strong></li><li><strong>Persone con disabilità motorie </strong></li></ul>',
        '<p>Muoversi con uno&nbsp;<strong>scooter elettrico</strong>&nbsp;in città storiche come Roma e Firenze non è solo una questione di comodità: è anche&nbsp;<strong>un vantaggio pratico</strong>. Molti musei, siti archeologici e attrazioni offrono&nbsp;<strong>ingressi gratuiti o salta-fila</strong>&nbsp;ai visitatori con dispositivi di mobilità. Inoltre, non dovrai preoccuparti di lunghe distanze, salite o pavimentazioni irregolari: <strong>lo scooter si adatta a tutto.</strong></p>',
        '<h4>Perché scegliere Mia Medical per il noleggio dei tuoi ausili medicali</h4>',
        '<p>Scegliendo <strong>Mia Medical</strong> per il tuo noleggio: </p>',
        '<ul><li>Hai&nbsp;<strong>assistenza personalizzata</strong>&nbsp;e consegna dello scooter direttamente in&nbsp;<strong>hotel, B&amp;B o appartamento</strong>.</li><li>Trovi dispositivi&nbsp;<strong>igienizzati, sicuri e controllati</strong>&nbsp;da personale qualificato.</li><li>Hai&nbsp;<strong>supporto locale immediato</strong>, sia a Roma che a Firenze.</li><li>Prenoti in modo facile sia online, chiamandoci o mandandoci un messaggio al numero +<strong>39 392 65 09 237</strong>, con tariffe trasparenti e opzioni flessibili anche per più giorni, in base alle tue esigenze. </li></ul>',
        '<p><strong>Un piccolo mezzo, una grande libertà!</strong> Scopri sul nostro <strong><a href="/catalogo-noleggio/">sito</a></strong> tutta la vasta gamma di dispositivi che Mia Medical ha da offrire per aiutarti a <strong>riscoprire la libertà di muoverti in autonomia</strong>! Inoltre, sul nostro <strong><a href="/blog/?_gl=1*11dshrr*_up*MQ..*_ga*OTk3MzkwNTMuMTc0NDQ2MTcyMg..*_ga_D9FZ9V3LL7*MTc0NDQ2MTcyMS4xLjAuMTc0NDQ2MTcyMS4wLjAuMA..">blog</a></strong> potrai trovare molti articoli utili sul <strong>turismo accessibile</strong>, sia a Roma che Firenze, e anche una <strong><a href="/scooter-elettrici-per-mobilita-a-roma-i-vantaggi-del-noleggio/?_gl=1*1sq6s1u*_up*MQ..*_ga*OTk3MzkwNTMuMTc0NDQ2MTcyMg..*_ga_D9FZ9V3LL7*MTc0NDQ2MTcyMS4xLjEuMTc0NDQ2MTgwMC4wLjAuMA..">guida</a></strong> alla scelta consapevole per il modello del proprio scooter elettrico, nonché consigli e vantaggi sul noleggio! Visita il nostro sito e <strong><a href="/contatti/?_gl=1*5crgl*_up*MQ..*_ga*OTk3MzkwNTMuMTc0NDQ2MTcyMg..*_ga_D9FZ9V3LL7*MTc0NDQ2MTcyMS4xLjEuMTc0NDQ2MTg3MS4wLjAuMA..">iscriviti alla nostra newsletter</a></strong> per non perdertene neanche uno! </p>',
        '<p>Lascia che sia il Deluxe ad accompagnarti nel tuo viaggio. Dimentica stanchezza, rinunce o tempi morti. Con il noleggio del nostro scooter elettrico pieghevole per anziani e disabili, potrai&nbsp;<strong>vivere ogni scorcio con intensità</strong>, entrare nei luoghi più iconici senza ostacoli e goderti il tuo tempo con la serenità che meriti.</p>',
        '<h4>Contatti e Recapiti Utili </h4>',
        '<p>La tua avventura italiana inizia qui. <strong><a href="https://wa.me/393926509237">Contattaci</a></strong> oggi per la disponibilità e preventivo. Inoltre, se ancora non ti abbiamo convinto, chiamaci subito al numero <strong><a href="https://wa.me/393926509237">+39 392 65 09 237.</a></strong> Il nostro <strong>team di specialisti</strong> del settore sarà pronto a rispondere a ogni tua domanda e chiarire ogni dubbio. <strong>Contattaci</strong> oggi stesso per ricevere una consulenza gratuita, senza impegno, e fatti guidare dai nostri esperti per un’esperienza di noleggio personalizzata su misura alle tue necessità. </p>',
      ].join(''),
    },
    en: {
      title: 'Deluxe folding scooter with armrests for hire',
      slug: 'scooter-elettrico-pieghevole-con-braccioli-deluxe',
      shortDescription: 'Freedom and movement Rent your folding scooter, rediscover your independence! Lightweight and elegant. Its aluminium alloy body allows it to be easily folded for transport inside the car. Pick-up at the warehouse is free. We are in Rome and Florence. Free delivery in Rome and Florence for 30-day rentals! Deposit required: 300€ For the rental of this article, a deposit of 300€.',
      metaTitle: 'Folding electric scooter with armrests for hire',
      metaDescription: 'Hire the Deluxe folding mobility scooter with armrests: aluminium-alloy body that folds into a car boot. Available immediately.',
      description: [
        '<h3><strong>Electric scooter hire with armrests: comfort and freedom on your journey</strong></h3>',
        '<p>Experience the magic of&nbsp;<strong><a href="/en/scooter-elettrici-per-mobilita-a-roma-i-vantaggi-del-noleggio/?_gl=1*1qofl61*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ2MTQ4NS40LjAuMTc0NDQ2MTQ4NS4wLjAuMA..">Rome</a></strong>&nbsp;or the timeless art of&nbsp;<strong><a href="/en/florence-accessible-travel-guide-the-citys-inclusive-attractions/?_gl=1*1mfn495*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ2MTQ4NS40LjEuMTc0NDQ2MTUwNS4wLjAuMA..">Florence</a></strong>&nbsp;should never be limited by time or effort. The service of <strong>Hire</strong> of <strong>Deluxe Folding Electric Scooter with Armrests</strong>&nbsp;Created for the elderly and disabled, it aims to offer agile yet sophisticated mobility, combining the practicality of a compact design with superior comfort. Ideal for those who wish to travel independently, without sacrificing safety.</p>',
        '<h4>What makes this scooter truly deluxe?</h4>',
        '<ul><li><strong>Integrated armrests</strong>for stable support and a more comfortable posture throughout the journey.</li><li><strong>Intelligent folding system</strong>foldable with a few gestures, it can be easily transported like a trolley.</li><li><strong>Maximum autonomy</strong>up to 15 km on a single charge - perfect for a full day of cultural sightseeing.</li><li><strong>Removable lithium battery</strong>You can also recharge it comfortably in your hotel or flat.</li><li><strong>Driving stability</strong>twin front wheels and solid rubber rear wheels for easy movement even on historic roads.</li><li><strong>Comfort seat with backrest</strong><strong>integrated</strong>for complete relaxation even in your downtime.</li></ul>',
        '<h4>Technical Specifications of the Deluxe Folding Electric Scooter</h4>',
        '<ul><li><strong>Maximum speed</strong>6 km/h</li><li><strong>Negligible slope</strong>: 3°</li><li><strong>Estimated autonomy</strong>: 15 km</li><li><strong>Weight</strong>27 kg with battery - 25 kg without</li><li><strong>Maximum flow rate</strong>: 115 kg</li><li><strong>Battery</strong>Lithium 24V 12 Ah</li><li><strong>Motor</strong>: 270W</li><li><strong>Dimensions when closed</strong>75 × 48.5 × 45 cm</li></ul>',
        '<p>Click <a href="/wp-content/uploads/2023/02/SCHEDA-TECNICA-S19.pdf?_gl=1*3v2y5o*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ2MTQ4NS40LjEuMTc0NDQ2MTU1Ni4wLjAuMA..">here</a> to download the complete data sheet </p>',
        '<h4>To whom do we recommend the rental of our Deluxe folding electric scooter</h4>',
        '<p><strong>The easiest way to experience extraordinary cities.</strong> This scooter is the perfect choice for:</p>',
        '<ul><li><strong>Senior travellers</strong>people with reduced mobility or who simply wish to move around effortlessly.</li><li><strong>International tourists</strong>&nbsp;who want to explore Rome and Florence in freedom, without sacrificing comfort and autonomy.</li><li><strong>Families</strong> on holiday with grandparents or relatives who prefer discreet but functional support.</li><li><strong>Temporarily injured visitors</strong> who do not want to miss out on the wonders of Italy.</li><li><strong>Pregnant women</strong></li><li><strong>People with motor disabilities </strong></li></ul>',
        '<p>Moving with one&nbsp;<strong>electric scooter</strong>&nbsp;in historic cities such as Rome and Florence is not just a question of convenience: it is also&nbsp;<strong>a practical advantage</strong>. Many museums, archaeological sites and attractions offer&nbsp;<strong>free or skip-row admissions</strong>&nbsp;to visitors with mobility devices. In addition, you will not have to worry about long distances, climbs or uneven floors: <strong>the scooter adapts to everything.</strong></p>',
        '<h4>Why choose Mia Medical for the rental of your medical aids</h4>',
        '<p>Choosing <strong>Mia Medical</strong> for your hire: </p>',
        '<ul><li>Hai&nbsp;<strong>personalised assistance</strong>&nbsp;and delivery of the scooter directly to&nbsp;<strong>hotel, B&amp;B or flat</strong>.</li><li>Find devices&nbsp;<strong>sanitised, safe and controlled</strong>&nbsp;by qualified personnel.</li><li>Hai&nbsp;<strong>immediate local support</strong>in both Rome and Florence.</li><li>Book easily either online, by calling us or by sending us a message on +<strong>39 392 65 09 237</strong>with transparent rates and flexible options, even for several days, according to your needs. </li></ul>',
        '<p><strong>A small means, a big freedom!</strong> Find out about our <strong><a href="/en/rental-catalog/">.</a></strong> wide range of devices that Mia Medical has to offer to help you to <strong>rediscovering the freedom to move independently</strong>! In addition, on our <strong><a href="/en/blog/?_gl=1*11dshrr*_up*MQ..*_ga*OTk3MzkwNTMuMTc0NDQ2MTcyMg..*_ga_D9FZ9V3LL7*MTc0NDQ2MTcyMS4xLjAuMTc0NDQ2MTcyMS4wLjAuMA..">blog</a></strong> you will find many useful articles on the <strong>accessible tourism</strong>both in Rome and Florence, and also a <strong><a href="/en/scooter-elettrici-per-mobilita-a-roma-i-vantaggi-del-noleggio/?_gl=1*1sq6s1u*_up*MQ..*_ga*OTk3MzkwNTMuMTc0NDQ2MTcyMg..*_ga_D9FZ9V3LL7*MTc0NDQ2MTcyMS4xLjEuMTc0NDQ2MTgwMC4wLjAuMA..">guide</a></strong> to making an informed choice for the model of your electric scooter, as well as rental tips and advantages! Visit our website and <strong><a href="/en/contatti/?_gl=1*5crgl*_up*MQ..*_ga*OTk3MzkwNTMuMTc0NDQ2MTcyMg..*_ga_D9FZ9V3LL7*MTc0NDQ2MTcyMS4xLjEuMTc0NDQ2MTg3MS4wLjAuMA..">sign up for our newsletter</a></strong> not to miss a single one! </p>',
        '<p>Let the Deluxe be your companion on your journey. Forget about tiredness, compromises or downtime. By hiring our foldable electric scooter for older people and people with disabilities, you’ll be able to&nbsp;<strong>experiencing every glimpse with intensity</strong>enter the most iconic places unhindered and enjoy your time with the serenity you deserve.</p>',
        '<h4>Contacts and useful addresses </h4>',
        '<p>Your Italian adventure starts here. <strong><a href="https://wa.me/393926509237">Contact us</a></strong> today for availability and quotation. Also, if we still haven\'t convinced you, call us now at <strong><a href="https://wa.me/393926509237">+39 392 65 09 237.</a></strong> Our <strong>team of specialists</strong> of the industry will be ready to answer all your questions and clarify any doubts. <strong>Contact us</strong> today to receive a free, no-obligation consultation and let our experts guide you to a customised rental experience tailored to your needs. </p>',
      ].join(''),
    },
  },

  specs: {
    propulsion: 'electric',
    'max-load': 115,
    weight: { min: 25, max: 27 },
    'max-speed': 6,
    'max-gradient': 3,
    'battery-range': { min: 15, max: 15 },
    motor: { it: '270 W', en: '270 W' },
    battery: { it: 'Litio 24 V 12 Ah', en: 'Lithium, 24 V 12 Ah' },
    'frame-material': 'aluminium',
    'folded-size': { it: '75 × 48,5 × 45 cm', en: '75 × 48.5 × 45 cm' },
    foldable: true,
  },

  media: {
    thumbnail: { file: 'deluxe-folding-scooter-1.png', alt: { it: 'Noleggio scooter pieghevole con braccioli' } },
    gallery: [
      'deluxe-folding-scooter-2.jpg',
      'deluxe-folding-scooter-3.jpg',
    ],
  },

  questions: [...hireIntake],
  terms: [generalTerms],
});
