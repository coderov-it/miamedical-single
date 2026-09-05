/**
 * Noleggio scooter Elettrico One
 *
 * /prodotto/scooter-elettrico-one-a-noleggio-per-disabili-ed-anziani/
 * WooCommerce product 14117. Pneumatic tyres "per un comfort superiore su
 * percorsi esterni", which is why `wheel-type` is set here and left off the two
 * folding scooters, whose pages do not say.
 *
 * ⚠️ 300 € deposit.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeCollection, homeDeliveryOnly } from '../shared/addons.ts';
import { electricWheelchairsAndScootersHire } from './category.ts';

export const oneScooter = electricWheelchairsAndScootersHire.rental({
  code: 'one-scooter',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(3, 110),
    days(7, 160),
    days(15, 250),
    days(30, 390),
    days(45, 540),
  ],

  translations: {
    it: {
      title: 'Noleggio scooter Elettrico One',
      slug: 'scooter-elettrico-one-a-noleggio-per-disabili-ed-anziani',
      shortDescription: 'Libertà e movimento! Noleggia il tuo Scooter One e riscopri la tua indipendenza! Il ritiro in magazzino è gratuito. Siamo a Roma e Firenze. Consegna gratuita a Roma e Firenze per i noleggi da 30 giorni. Consegna a domicilio: 30€ + 30€ per il ritiro. Deposito richiesto: 300€ Per il noleggio di questo articolo è richiesto un deposito di 300€.',
      metaTitle: 'Noleggio scooter elettrico One per anziani e disabili',
      metaDescription: 'Noleggio scooter elettrico One per anziani e disabili a Roma e Firenze. Scooter elettrico con autonomia fino a 30 km, comfort e consegna rapida.',
      description: [
        '<h3>Scopri l’Italia con sicurezza e comfort!<br />Eleganza, sicurezza e autonomia per vivere Roma e Firenze senza limiti.</h3>',
        '<p>Che tu voglia percorrere i vicoli storici di <strong>Roma</strong>, attraversare le piazze di <strong>Firenze</strong> o semplicemente goderti un weekend fuori porta, il noleggio <strong>Scooter Elettrico ONE</strong> per anziani e disabili è il compagno di viaggio perfetto. <strong>Compatto, potente e confortevole</strong>, ti offre tutto ciò che serve per vivere l’esterno in autonomia e sicurezza.</p>',
        '<h3>Noleggio scooter elettrico One: caratteristiche e vantaggi</h3>',
        '<ul><li><strong>Ideale per ambienti urbani ed esterni</strong>: non lasciarti ingannare dalla sua compattezza. Le ruote ad aria garantiscono una guida fluida e ammortizzata anche su superfici irregolari, marciapiedi e pavé.</li><li><strong>Autonomia potenziata</strong>: grazie alle batterie da <strong>25 Ah</strong>, percorri fino a <strong>30 km</strong> in piena serenità, perfetto per le tue giornate in città.</li><li><strong>Comfort elevato</strong>: seduta ergonomica, braccioli regolabili e una struttura pensata per garantire la massima comodità durante l’utilizzo prolungato.</li><li><strong>Facilmente smontabile</strong>: trasportarlo in auto o riporlo a casa è semplicissimo. Si smonta in pochi secondi senza bisogno di attrezzi.</li><li><strong>Display LED intuitivo</strong>: controlla lo stato della batteria in un attimo grazie al pratico schermo digitale.</li><li><strong>Personalizzabile</strong>: scegli ogni giorno il tuo stile! Lo scooter include <strong>quattro cover intercambiabili</strong> in diversi colori.</li></ul>',
        '<h3>Caratteristiche tecniche principali dello scooter elettrico ONE</h3>',
        '<ul><li><strong>Velocità massima</strong>: 8 km/h</li><li><strong>Autonomia</strong>: fino a 30 km</li><li><strong>Capacità di carico</strong>: 140 kg</li><li><strong>Motore</strong>: 270W</li><li><strong>Batterie</strong>: 2 x 12V 25 Ah</li><li><strong>Dimensioni</strong>: 103 cm (lunghezza) × 49 cm (larghezza) × 88 cm (altezza)</li><li><strong>Peso</strong>: leggero e facilmente smontabile per il trasporto</li><li><strong>Ruote</strong>: pneumatiche per un comfort superiore su percorsi esterni</li><li><strong>Colore</strong>: 4 cover intercambiabili incluse</li></ul>',
        '<h3><strong>Noleggio scooter elettrico One per la tua mobilità urbana in libertà</strong></h3>',
        '<p>Lo <strong>Scooter Elettrico ONE</strong> per anziani e disabili è pensato per:</p>',
        '<ul><li>Chi cerca uno scooter <strong>compatto ma potente</strong>, perfetto per muoversi in autonomia in città</li><li><strong>Persone con mobilità ridotta</strong> che desiderano mantenere uno stile di vita attivo</li><li>Viaggiatori che necessitano di un mezzo <strong>pratico da trasportare</strong> in auto o treno</li><li>Chi desidera un <strong>mezzo comodo e versatile</strong> per l’uso quotidiano all’aperto</li></ul>',
        '<h3>Come funziona il noleggio con Mia Medical</h3>',
        '<p>Il nostro <strong>Scooter Elettrico ONE</strong> è disponibile per consegna e ritiro a <strong>Roma</strong> e <strong>Firenze</strong>. Prenotalo <a href="/contatti/?_gl=1*u51f7s*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODE3Ny4wLjAuMA..">online</a> o <strong><a href="https://wa.me/393926509237">chiamaci al numero +39 392 65 09 237</a></strong>: al resto ci pensiamo noi! Prenota ora il to scooter e scopri l’Italia in libertà.</p>',
        '<p><strong><a href="/mia-medical-condizioni-di-noleggio-dei-nostri-ausili-medicali/?_gl=1*1sjr1ym*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODI3Ni4wLjAuMA..">Nota bene: ricorda sempre di consultare le nostre condizioni di noleggio. </a></strong></p>',
        '<p>Muoviti senza preoccupazioni, goditi le <strong><a href="/5-accessible-day-trips-from-rome-italy-beyond-the-jubilee/?_gl=1*boeah4*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODMwNy4wLjAuMA..">meraviglie delle città Italian</a></strong>e un passo alla volta…o forse una ruota alla volta. </p>',
        '<h4>Recapiti Utili</h4>',
        '<p><strong><a href="https://wa.me/393926509237">Contattaci</a></strong> per tariffe e disponibilità giornaliere. <br />Inoltre, <strong><a href="/catalogo-noleggio/">scopri tutti gli altri modelli di scooter elettrici </a></strong>per la mobilità che Mia Medical Italia ha da offrire. Sul nostro <a href="/blog/?_gl=1*1rhu24b*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODM1NC4wLjAuMA..">blog</a> è possibile anche trovare un <strong><a href="/scooter-elettrici-per-mobilita-a-roma-i-vantaggi-del-noleggio/?_gl=1*fgzqby*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODM5Mi4wLjAuMA..">articolo-guida</a></strong> ad una scelta consapevole del modello per il proprio scooter elettrico, nonché una grande varietà di consigli per il turismo accessibile. Iscriviti alla nostra <strong><a href="/contatti/?_gl=1*zp8cyw*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODQwOS4wLjAuMA..">newsletter</a></strong> per non perdertene neanche uno.</p>',
        '<p>Non ti abbiamo ancora convinto? Chiamaci ora al <strong><a href="https://wa.me/393926509237">+39 392 65 09 237</a></strong> o mandaci un messaggio su whatsapp, il nostro team di specialisti del settore è sempre disponibile a rispondere a qualsiasi domanda e chiarire ogni dubbio. Chiamaci per una consulenza gratuita, senza impegno, e ti aiuteremo noi a trovare l’opzione di noleggio che meglio di adatta alle tu necessità! </p>',
        '<h4>Riscopri la libertà di muoverti in autonomia con Mia Medical Italia!</h4>',
        '<p>Affitta il Tuo compagno di Viaggio. Autonomia a portata di mano, Semplice, Sicuro, Conveniente! Per una mobilità senza limiti. E&#8217; la tua chiave per l&#8217;indipendenza. <strong><a href="https://wa.me/393926509237">Chiamaci ora al +39 392 65 09 237</a></strong> o visita il nostro <strong><a href="/catalogo-noleggio/">sito web</a></strong>.</p>',
      ].join(''),
    },
    en: {
      title: 'One electric scooter for hire',
      slug: 'scooter-elettrico-one-a-noleggio-per-disabili-ed-anziani',
      shortDescription: 'Freedom and movement! Rent your Scooter One and rediscover your independence! Pick-up at the warehouse is free. We are in Rome and Florence. Free delivery in Rome and Florence for 30-day rentals. Home delivery: 30€ + 30€ for withdrawal. Deposit required: 300€ For the rental of this article, a deposit of 300€.',
      metaTitle: 'One electric scooter hire | Rome and Florence',
      metaDescription: 'Hire the One mobility scooter in Rome and Florence: up to 30 km on a charge, 140 kg capacity, pneumatic tyres, quick delivery.',
      description: [
        '<h3>Discover Italy with confidence and comfort!<br />Elegance, security and autonomy to experience Rome and Florence without limits.</h3>',
        '<p>Whether you want to walk the historic alleys of <strong>Rome</strong>, cross the squares of <strong>Florence</strong> or simply enjoy a weekend away, the rental <strong>Electric Scooter ONE</strong> It is the perfect travel companion for the elderly and disabled. <strong>Compact, powerful and comfortable</strong>It offers you everything you need to experience the outdoors independently and safely.</p>',
        '<h3>One electric scooter rental: features and benefits</h3>',
        '<ul><li><strong>Ideal for urban and outdoor environments</strong>don\'t let its compactness fool you. The air wheels guarantee a smooth and cushioned ride even on uneven surfaces, pavements and cobblestones.</li><li><strong>Enhanced autonomy</strong>thanks to the <strong>25 Ah</strong>walk to <strong>30 km</strong> in serenity, perfect for your days in the city.</li><li><strong>High comfort</strong>ergonomic seat, adjustable armrests and a structure designed for maximum comfort during prolonged use.</li><li><strong>Easily disassembled</strong>Transporting it in the car or storing it at home is easy. It disassembles in seconds without the need for tools.</li><li><strong>Intuitive LED display</strong>Check the battery status at a glance thanks to the handy digital screen.</li><li><strong>Customisable</strong>choose your style every day! The scooter includes <strong>four interchangeable covers</strong> in different colours.</li></ul>',
        '<h3>Main technical characteristics of the ONE electric scooter</h3>',
        '<ul><li><strong>Maximum speed</strong>8 km/h</li><li><strong>Autonomy</strong>up to 30 km</li><li><strong>Load capacity</strong>140 kg</li><li><strong>Motor</strong>: 270W</li><li><strong>Batteries</strong>: 2 x 12V 25 Ah</li><li><strong>Dimensions</strong>: 103 cm (length) × 49 cm (width) × 88 cm (height)</li><li><strong>Weight</strong>Lightweight and easily disassembled for transport</li><li><strong>Wheels</strong>: pneumatics for superior comfort on outdoor routes</li><li><strong>Colour</strong>: 4 interchangeable covers included</li></ul>',
        '<h3><strong>Rent the One electric scooter for your urban mobility with freedom</strong></h3>',
        '<p>Lo <strong>Electric Scooter ONE</strong> for the elderly and disabled it is designed for:</p>',
        '<ul><li>Those looking for a scooter <strong>compact but powerful</strong>perfect for moving independently in the city</li><li><strong>Persons with reduced mobility</strong> who wish to maintain an active lifestyle</li><li>Travellers needing a means <strong>practical to transport</strong> by car or train</li><li>Who wants a <strong>comfortable and versatile vehicle</strong> for everyday outdoor use</li></ul>',
        '<h3>How rental works with Mia Medical</h3>',
        '<p>Our <strong>Electric Scooter ONE</strong> is available for delivery and collection at <strong>Rome</strong> e <strong>Florence</strong>. Book it <a href="/en/contatti/?_gl=1*u51f7s*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODE3Ny4wLjAuMA..">online</a> o <strong><a href="https://wa.me/393926509237">call us on +39 392 65 09 237</a></strong>we\'ll take care of the rest! Book your scooter now and discover Italy in freedom.</p>',
        '<p><strong><a href="/en/mia-medical-condizioni-di-noleggio-dei-nostri-ausili-medicali/?_gl=1*1sjr1ym*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODI3Ni4wLjAuMA..">Please note: always remember to consult our rental conditions. </a></strong></p>',
        '<p>Move without worries, enjoy the <strong><a href="/en/5-accessible-day-trips-from-rome-italy-beyond-the-jubilee/?_gl=1*boeah4*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODMwNy4wLjAuMA..">wonders of the cities Italian</a></strong>and one step at a time... or perhaps one wheel at a time. </p>',
        '<h4>Useful addresses</h4>',
        '<p><strong><a href="https://wa.me/393926509237">Contact us</a></strong> for daily rates and availability. <br />In addition, <strong><a href="/en/rental-catalog/">discover all other electric scooter models </a></strong>for mobility that Mia Medical Italia has to offer. On our <a href="/en/blog/?_gl=1*1rhu24b*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODM1NC4wLjAuMA..">blog</a> it is also possible to find a <strong><a href="/en/scooter-elettrici-per-mobilita-a-roma-i-vantaggi-del-noleggio/?_gl=1*fgzqby*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODM5Mi4wLjAuMA..">article-guide</a></strong> to an informed choice of model for your electric scooter, as well as a wide variety of tips for accessible tourism. Subscribe to our <strong><a href="/en/contatti/?_gl=1*zp8cyw*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODQwOS4wLjAuMA..">newsletter</a></strong> not to miss a single one.</p>',
        '<p>Haven\'t we convinced you yet? Call us now at <strong><a href="https://wa.me/393926509237">+39 392 65 09 237</a></strong> or send us a message on whatsapp, our specialist team is always available to answer any questions and clarify any doubts. Call us for a free, no-obligation consultation and we will help you find the rental option that best suits your needs! </p>',
        '<h4>Rediscover the freedom to move independently with Mia Medical Italia!</h4>',
        '<p>Rent Your Travelling Companion. Autonomy at your fingertips, Simple, Safe, Affordable! For mobility without limits. Your key to independence. <strong><a href="https://wa.me/393926509237">Call us now on +39 392 65 09 237</a></strong> or visit our <strong><a href="/en/rental-catalog/">website</a></strong>.</p>',
      ].join(''),
    },
  },

  specs: {
    propulsion: 'electric',
    'indoor-outdoor': 'outdoor',
    'max-load': 140,
    'max-speed': 8,
    'battery-range': { min: 30, max: 30 },
    motor: { it: '270 W', en: '270 W' },
    battery: { it: '2 x 12 V 25 Ah', en: '2 × 12 V 25 Ah' },
    'total-length': { min: 103, max: 103 },
    'total-width': { min: 49, max: 49 },
    'total-height': { min: 88, max: 88 },
    'wheel-type': 'pneumatic',
  },

  media: {
    thumbnail: { file: 'one-scooter-1.png', alt: { it: 'Scooter elettrico One' } },
  },

  addons: [homeDeliveryOnly(30), homeCollection(30)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
