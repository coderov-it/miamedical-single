/**
 * Scooter Elettrico Maximo
 *
 * /prodotto/scooter-elettrico-maximo-a-noleggio/  ·  WooCommerce product 11856.
 *
 * The largest machine in the category — 160 kg capacity, 89 kg with its batteries
 * in — and the only one whose page quotes an odd split delivery charge: "Consegna
 * a domicilio: 33€ + 35€ per il ritiro". Both figures are written as they stand.
 *
 * ⚠️ 400 € deposit.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeCollection, homeDeliveryOnly } from '../shared/addons.ts';
import { electricWheelchairsAndScootersHire } from './category.ts';

export const maximoScooter = electricWheelchairsAndScootersHire.rental({
  code: 'maximo-scooter',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(3, 120),
    days(7, 200),
    days(15, 300),
    days(30, 490),
    days(45, 610),
  ],

  translations: {
    it: {
      title: 'Scooter Elettrico Maximo',
      slug: 'scooter-elettrico-maximo-a-noleggio',
      shortDescription: 'Libertà e movimento Noleggia il tuo scooter e riscopri la tua indipendenza! Il ritiro in magazzino è gratuito. Siamo a Roma e Firenze. Consegna gratuita a Roma e Firenze per i noleggi da 30 giorni! Consegna a domicilio: 33€ + 35€ per il ritiro. Deposito richiesto: 400€ Per il noleggio di questo articolo è richiesto un deposito di 400€.',
      metaTitle: 'Noleggio Scooter Elettrico Maximo per disabili ed anziani.',
      metaDescription: 'Noleggio Scooter Elettrico Maximo bariatrico per anziani e disabili: Batteria fino a 35km. Disponibilità immediata. Fino a 160kg.',
      description: [
        '<h3>Noleggio Scooter Elettrico Maximo per anziani e disabili: scopri l’Italia con sicurezza e comfort! Eleganza, sicurezza e autonomia per vivere Roma e Firenze senza limiti.</h3>',
        '<p><strong>Il noleggio scooter elettrico Maximo è la soluzione ideale per chi cerca uno scooter elettrico bariatrico per anziani e disabili che desiderano visitare Roma e Firenze in totale sicurezza e autonomia. Eleganza, comfort e libertà per vivere l’Italia senza limiti.</strong></p>',
        '<p>Se desideri esplorare la bellezza senza tempo di Roma o l’eleganza rinascimentale di Firenze in piena autonomia, il MAXIMO è il compagno di viaggio ideale. Con il suo design semplice ma tecnologicamente avanzato, questo scooter garantisce prestazioni elevate, massimo comfort e una sicurezza totale.</p>',
        '<h4><strong>Perché scegliere il noleggio dello scooter elettrico Maximo</strong> per anziani e disabili?</h4>',
        '<ul><li><strong>Comfort superiore</strong>: ruote pneumatiche da 14” con battistrada largo e sospensioni avanzate per una guida fluida anche su ciottoli e marciapiedi irregolari</li><li><strong>Seduta ergonomica e regolabile</strong>: schienale pieghevole e ruotabile, poggiatesta e braccioli personalizzabili per ogni esigenza.</li><li><strong>Alta autonomia</strong>: percorri fino a&nbsp;<strong>35 km</strong>&nbsp;con batterie potenziate – perfetto per un’intera giornata di visite</li><li><strong>Sicurezza garantita</strong>: specchietto retrovisore, luci LED, clacson, freno di stazionamento e avviso di retromarcia.</li><li><strong>Tecnologia intuitiva</strong>: display con indicatore di carica e manubrio abbattibile per ridurre l’ingombro.</li><li><strong>Design versatile</strong>: adatto a tutte le età e perfetto per affrontare salite fino a&nbsp;<strong>8°</strong>&nbsp;e superare ostacoli fino a 7 cm.</li></ul>',
        '<h4>Caratteristiche tecniche principali dello scooter elettrico Maximo bariatrico</h4>',
        '<ul><li><strong>Velocità massima</strong>: 12,8 km/h</li><li><strong>Autonomia</strong>: 25 km (standard) – 35 km (batterie potenziate)</li><li><strong>Capacità di carico</strong>: 160 kg</li><li><strong>Dimensioni</strong>: 120 cm (lunghezza) × 58 cm (larghezza)</li><li><strong>Peso</strong>: 89 kg con batterie – 65 kg senza</li><li><strong>Batterie</strong>: 2 x 12V 36 Ah / potenziate 2 x 12V 50 Ah</li><li><strong>Motore</strong>: 470W</li><li><strong>Freni e sospensioni</strong>: sistema avanzato per una guida sicura e stabile</li></ul>',
        '<h4>Il tuo viaggio senza limiti con Mia Medical Italia e lo scooter elettrico Maximo a noleggio!</h4>',
        '<p>C<a href="/mobility-scooter-for-travel-in-rome-top-benefits-of-rental/?_gl=1*o1efy1*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODE3Ny4wLjAuMA..">he tu voglia esplorare il Colosseo o passeggiare sul Ponte Vecchio</a>, il&nbsp;<strong>MAXIMO</strong>&nbsp;ti offre la libertà di goderti ogni istante con serenità. È ideale per:</p>',
        '<ul><li>Viaggiatori senior o persone con mobilità ridotta</li><li>Chi cerca un’esperienza confortevole anche su lunghe distanze</li><li>Chi vuole muoversi in sicurezza con comodità&nbsp;</li><li>Donne incinta&nbsp;</li></ul>',
        '<h4>Come funziona il noleggio con Mia Medical</h4>',
        '<p>Il nostro <strong>Scooter Elettrico Maximo</strong> è disponibile per consegna e ritiro a <strong>Roma</strong> e <strong>Firenze</strong>. Prenotalo <a href="/contatti/?_gl=1*u51f7s*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODE3Ny4wLjAuMA..">online</a> o <strong><a href="https://wa.me/393926509237">chiamaci al numero +39 392 65 09 237</a></strong>: al resto ci pensiamo noi! Prenota ora il to scooter e scopri l’Italia in libertà. </p>',
        '<p><strong><a href="/mia-medical-condizioni-di-noleggio-dei-nostri-ausili-medicali/?_gl=1*1sjr1ym*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODI3Ni4wLjAuMA..">Nota bene: ricorda sempre di consultare le nostre condizioni di noleggio. </a></strong></p>',
        '<p>Muoviti senza preoccupazioni, goditi le <strong><a href="/5-accessible-day-trips-from-rome-italy-beyond-the-jubilee/?_gl=1*boeah4*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODMwNy4wLjAuMA..">meraviglie delle città Italian</a></strong>e un passo alla volta…o forse una ruota alla volta. </p>',
        '<h4>Recapiti Utili</h4>',
        '<p><strong><a href="https://wa.me/393926509237">Contattaci</a></strong> per tariffe e disponibilità giornaliere. Inoltre, <strong><a href="/catalogo-noleggio/">scopri tutti gli altri modelli di scooter elettrici </a></strong>per la mobilità che Mia Medical Italia ha da offrire. Sul nostro <a href="/blog/?_gl=1*1rhu24b*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODM1NC4wLjAuMA..">blog</a> è possibile anche trovare un <strong><a href="/scooter-elettrici-per-mobilita-a-roma-i-vantaggi-del-noleggio/?_gl=1*fgzqby*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODM5Mi4wLjAuMA..">articolo-guida</a></strong> ad una scelta consapevole del modello per il proprio scooter elettrico, nonché una grande varietà di consigli per il turismo accessibile. Iscriviti alla nostra <strong><a href="/contatti/?_gl=1*zp8cyw*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODQwOS4wLjAuMA..">newsletter</a></strong> per non perdertene neanche uno. </p>',
        '<p>Non ti abbiamo ancora convinto? Chiamaci ora al <strong><a href="https://wa.me/393926509237">+39 392 65 09 237</a></strong> o mandaci un messaggio su whatsapp, il nostro team di specialisti del settore è sempre disponibile a rispondere a qualsiasi domanda e chiarire ogni dubbio. Chiamaci per una consulenza gratuita, senza impegno, e ti aiuteremo noi a trovare l’opzione di noleggio che meglio di adatta alle tu necessità! </p>',
        '<h4>Noleggia lo Scooter Elettrico bariatrico Maximo e Riscopri la libertà di muoverti in autonomia con Mia Medical Italia!</h4>',
        '<p>Affitta il Tuo compagno di Viaggio. Autonomia a portata di mano, Semplice, Sicuro, Conveniente! Per una mobilità senza limiti. E&#8217; la tua chiave per l&#8217;indipendenza. <strong><a href="https://wa.me/393926509237">Chiamaci ora al +39 392 65 09 237</a></strong> o visita il nostro <strong><a href="/catalogo-noleggio/">sito web</a></strong>.</p>',
      ].join(''),
    },
    en: {
      title: 'Maximo electric scooter for hire',
      slug: 'scooter-elettrico-maximo-a-noleggio',
      shortDescription: 'Freedom and movement Rent your scooter and rediscover your independence! Pick-up at the warehouse is free. We are in Rome and Florence. Free delivery in Rome and Florence for 30-day rentals! Home delivery: 33€ + 35€ for collection. Deposit required: 400€ For the rental of this article, a deposit of 400€.',
      metaTitle: 'Maximo electric scooter hire | Up to 160 kg',
      metaDescription: 'Hire the bariatric Maximo mobility scooter: up to 160 kg, 12.8 km/h, and 25–35 km on a charge. Available immediately.',
      description: [
        '<h3>Maximo Electric Mobility Scooter rental for the elderly and disabled: discover Italy in safety and comfort! Elegance, safety and autonomy to experience Rome and Florence without limits.</h3>',
        '<p><strong>The Maximo electric scooter rental is the ideal solution for anyone looking for a bariatric electric scooter for seniors and people with disabilities who want to visit Rome and Florence in complete safety and independence. Elegance, comfort and freedom to experience Italy without limits.</strong></p>',
        '<p>If you wish to explore the timeless beauty of Rome or the Renaissance elegance of Florence in complete freedom, the MAXIMO is the ideal travel companion. With its simple yet technologically advanced design, this scooter guarantees high performance, maximum comfort and total safety.</p>',
        '<h4><strong>Why choose the Maximo electric scooter rental</strong> for the elderly and disabled?</h4>',
        '<ul><li><strong>Superior comfort</strong>14" pneumatic wheels with wide tread and advanced suspension for a smooth ride even on cobblestones and uneven pavements</li><li><strong>Ergonomic and adjustable seat</strong>foldable and rotatable backrest, headrest and armrests that can be customised to suit every need.</li><li><strong>High autonomy</strong>: go as far as&nbsp;<strong>35 km</strong>&nbsp;with upgraded batteries - perfect for a full day of visits</li><li><strong>Guaranteed security</strong>rear-view mirror, LED lights, horn, parking brake and reverse warning.</li><li><strong>Intuitive technology</strong>: display with charge indicator and folding handlebar to reduce bulk.</li><li><strong>Versatile design</strong>: suitable for all ages and perfect for ascents up to&nbsp;<strong>8°</strong>&nbsp;and overcome obstacles of up to 7 cm.</li></ul>',
        '<h4>Main technical features of the Maximo bariatric mobility scooter</h4>',
        '<ul><li><strong>Maximum speed</strong>12.8 km/h</li><li><strong>Autonomy</strong>25 km (standard) - 35 km (enhanced batteries)</li><li><strong>Load capacity</strong>160 kg</li><li><strong>Dimensions</strong>: 120 cm (length) × 58 cm (width)</li><li><strong>Weight</strong>89 kg with batteries - 65 kg without</li><li><strong>Batteries</strong>: 2 x 12V 36 Ah / upgraded 2 x 12V 50 Ah</li><li><strong>Motor</strong>: 470W</li><li><strong>Brakes and suspension</strong>advanced system for safe and stable driving</li></ul>',
        '<h4>Your journey without limits with Mia Medical Italia and the Maximo electric scooter for hire!</h4>',
        '<p>C<a href="/en/mobility-scooter-for-travel-in-rome-top-benefits-of-rental/?_gl=1*o1efy1*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODE3Ny4wLjAuMA..">whether you want to explore the Colosseum or stroll on the Ponte Vecchio</a>the&nbsp;<strong>MAXIMO</strong>&nbsp;offers you the freedom to enjoy every moment with serenity. It is ideal for:</p>',
        '<ul><li>Senior travellers or persons with reduced mobility</li><li>Those seeking a comfortable experience even over long distances</li><li>Those who want to move around safely in comfort&nbsp;</li><li>Pregnant women&nbsp;</li></ul>',
        '<h4>How rental works with Mia Medical</h4>',
        '<p>Our <strong>Maximo Electric Scooter</strong> is available for delivery and collection at <strong>Rome</strong> e <strong>Florence</strong>. Book it <a href="/en/contatti/?_gl=1*u51f7s*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODE3Ny4wLjAuMA..">online</a> o <strong><a href="https://wa.me/393926509237">call us on +39 392 65 09 237</a></strong>we\'ll take care of the rest! Book your scooter now and discover Italy in freedom. </p>',
        '<p><strong><a href="/en/mia-medical-condizioni-di-noleggio-dei-nostri-ausili-medicali/?_gl=1*1sjr1ym*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODI3Ni4wLjAuMA..">Please note: always remember to consult our rental conditions. </a></strong></p>',
        '<p>Move without worries, enjoy the <strong><a href="/en/5-accessible-day-trips-from-rome-italy-beyond-the-jubilee/?_gl=1*boeah4*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODMwNy4wLjAuMA..">wonders of the cities Italian</a></strong>and one step at a time... or perhaps one wheel at a time. </p>',
        '<h4>Useful addresses</h4>',
        '<p><strong><a href="https://wa.me/393926509237">Contact us</a></strong> for daily rates and availability. In addition, <strong><a href="/en/rental-catalog/">discover all other electric scooter models </a></strong>for mobility that Mia Medical Italia has to offer. On our <a href="/en/blog/?_gl=1*1rhu24b*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODM1NC4wLjAuMA..">blog</a> it is also possible to find a <strong><a href="/en/scooter-elettrici-per-mobilita-a-roma-i-vantaggi-del-noleggio/?_gl=1*fgzqby*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODM5Mi4wLjAuMA..">article-guide</a></strong> to an informed choice of model for your electric scooter, as well as a wide variety of tips for accessible tourism. Subscribe to our <strong><a href="/en/contatti/?_gl=1*zp8cyw*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODQwOS4wLjAuMA..">newsletter</a></strong> not to miss a single one. </p>',
        '<p>Haven\'t we convinced you yet? Call us now at <strong><a href="https://wa.me/393926509237">+39 392 65 09 237</a></strong> or send us a message on whatsapp, our specialist team is always available to answer any questions and clarify any doubts. Call us for a free, no-obligation consultation and we will help you find the rental option that best suits your needs! </p>',
        '<h4>Hire the Maximo bariatric electric mobility scooter and rediscover the freedom to move around independently with Mia Medical Italia!</h4>',
        '<p>Rent Your Travelling Companion. Autonomy at your fingertips, Simple, Safe, Affordable! For mobility without limits. Your key to independence. <strong><a href="https://wa.me/393926509237">Call us now on +39 392 65 09 237</a></strong> or visit our <strong><a href="/en/rental-catalog/">website</a></strong>.</p>',
      ].join(''),
    },
  },

  specs: {
    propulsion: 'electric',
    'max-load': 160,
    weight: { min: 65, max: 89 },
    'max-speed': 12.8,
    'battery-range': { min: 25, max: 35 },
    motor: { it: '470 W', en: '470 W' },
    battery: { it: '2 x 12 V 36 Ah, potenziate 2 x 12 V 50 Ah', en: '2 × 12 V 36 Ah, or 2 × 12 V 50 Ah upgraded' },
    'total-length': { min: 120, max: 120 },
    'total-width': { min: 58, max: 58 },
  },

  media: {
    thumbnail: { file: 'maximo-scooter-1.png', alt: { it: 'Vendita Scooter Elettrico Maximo' } },
    gallery: [
      'maximo-scooter-2.jpg',
      'maximo-scooter-3.jpg',
    ],
  },

  addons: [homeDeliveryOnly(33), homeCollection(35)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
