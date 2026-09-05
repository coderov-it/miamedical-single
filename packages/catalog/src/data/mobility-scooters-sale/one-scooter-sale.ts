/**
 * Vendita Scooter Elettrico ONE
 *
 * /prodotto/vendita-scooter-elettrico-one/
 * WooCommerce product 15613, 1.680,00 € — the sale twin of the hire One, and the
 * page calls it "il più venduto della sua categoria".
 */

import { generalTerms } from '../shared/terms.ts';
import { mobilityScootersSale } from './category.ts';

export const oneScooterSale = mobilityScootersSale.fixed({
  code: 'one-scooter-sale',
  status: 'active',

  pricingMode: 'fixed',
  basePrice: 1680,

  translations: {
    it: {
      title: 'Vendita Scooter Elettrico ONE',
      slug: 'vendita-scooter-elettrico-one',
      shortDescription: 'Libertà e movimento! Il piu venduto della sua categoria ! Acquista il tuo Scooter One e riscopri la tua indipendenza ogni giorno! Disponibile per acquisto immediato.',
      metaTitle: 'Vendita Scooter Elettrico ONE | Mia medical',
      metaDescription: 'Scooter elettrico ONE in vendita: compatto, potente e facile da trasportare. Autonomia fino a 30 km, comfort elevato e ideale e urbana per persone con mobilità ridotta.',
      description: [
        '<h3>Libertà, comfort e autonomia per muoverti senza limiti</h3>',
        '<p>Lo <strong>Scooter Elettrico ONE</strong> è la soluzione ideale per chi desidera mantenere indipendenza e mobilità in totale sicurezza, sia in città che negli spostamenti quotidiani. Compatto, affidabile e facile da utilizzare, è progettato per offrire comfort elevato e prestazioni costanti nel tempo.</p>',
        '<p>Perfetto per anziani e persone con mobilità ridotta, ma anche per chi cerca un mezzo pratico e maneggevole per muoversi in ambienti urbani o durante i viaggi.</p>',
        '<h2>Perché scegliere lo Scooter Elettrico ONE</h2>',
        '<p><strong>✔ Compatto ma potente</strong><br />Struttura agile e facile da manovrare, ideale per marciapiedi, centri urbani e spazi interni.<br /><strong>✔ Autonomia fino a 30 km</strong><br />Grazie alle batterie da 25Ah, puoi affrontare la giornata senza preoccuparti della ricarica.<br /><strong>✔ Comfort superiore</strong><br />Seduta ergonomica, braccioli regolabili e guida stabile anche su superfici irregolari.<br /><strong>✔ Facile da trasportare</strong><br />Si smonta rapidamente senza attrezzi, perfetto da riporre in auto o trasportare.<br /><strong>✔ Guida fluida e sicura</strong><br />Ruote pneumatiche che assorbono le asperità del terreno per una maggiore stabilità.<br /><strong>✔ Display LED intuitivo</strong><br />Controllo immediato dello stato della batteria e delle funzioni principali.</p>',
        '<h2>Caratteristiche tecniche principali</h2>',
        '<ul><li>Velocità massima: 8 km/h</li><li>Autonomia: fino a 30 km</li><li>Portata massima: 140 kg</li><li>Motore: 270W</li><li>Batterie: 2 x 12V 25Ah</li><li>Dimensioni: 103 × 49 × 88 cm</li><li>Ruote pneumatiche per maggiore comfort</li><li>Struttura smontabile e trasportabile</li></ul>',
        '<h2>A chi è consigliato</h2>',
        '<ul><li>Persone con mobilità ridotta</li><li>Anziani che desiderano maggiore autonomia</li><li>Chi cerca un mezzo pratico per la città</li><li>Chi ha bisogno di uno scooter facilmente trasportabile</li><li>Utilizzo quotidiano sia indoor che outdoor</li></ul>',
        '<h2>Affidabilità e praticità ogni giorno</h2>',
        '<p>Lo Scooter Elettrico ONE è progettato per offrire un equilibrio perfetto tra prestazioni, sicurezza e semplicità d’uso. È una scelta ideale per chi vuole tornare a muoversi in autonomia senza rinunciare al comfort.</p>',
        '<h2>Contattaci per informazioni o acquisto</h2>',
        '<p><strong><a href="https://wa.me/393926509237">Contattaci</a></strong> per tariffe e disponibilità giornaliere.<br />Inoltre, <strong><a href="/catalogo-vendita/">scopri tutti gli altri modelli di scooter elettrici </a></strong>per la mobilità che Mia Medical Italia ha da offrire. Sul nostro <a href="/blog/?_gl=1*1rhu24b*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODM1NC4wLjAuMA..">blog</a> è possibile anche trovare un <strong><a href="/scooter-elettrici-per-mobilita-a-roma-i-vantaggi-del-noleggio/?_gl=1*fgzqby*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODM5Mi4wLjAuMA..">articolo-guida</a></strong> ad una scelta consapevole del modello per il proprio scooter elettrico, nonché una grande varietà di consigli per il turismo accessibile. </p>',
        '<p>Per disponibilità, prezzo e consulenza personalizzata:<br />📞 <a href="https://wa.me/393926509237">+39 392 65 09 237 </a>(anche WhatsApp)</p>',
        '<p>Il nostro team è a disposizione per aiutarti a scegliere la soluzione più adatta alle tue esigenze.</p>',
        '<p><strong>Scooter Elettrico ONE: la tua indipendenza, ogni giorno.</strong></p>',
      ].join(''),
    },
    en: {
      title: 'ONE electric scooter for sale',
      slug: 'vendita-scooter-elettrico-one',
      shortDescription: 'Freedom and movement! The best seller in its category! Buy your Scooter One and rediscover your independence every day! Available for immediate purchase.',
      metaTitle: 'ONE electric scooter for sale | Mia Medical',
      metaDescription: 'ONE mobility scooter for sale: compact, powerful and easy to transport. Up to 30 km on a charge, comfortable, and made for town.',
      description: [
        '<h3>Freedom, comfort and autonomy to move without limits</h3>',
        '<p>Lo <strong>Electric Scooter ONE</strong> It is the ideal solution for those wishing to maintain independence and mobility in complete safety, both in the city and for daily travel. Compact, reliable and easy to use, it is designed to offer high comfort and consistent performance over time.</p>',
        '<p>Ideal for the elderly and people with reduced mobility, but also for anyone looking for a practical and manageable means of transport to get around in urban environments or while travelling.</p>',
        '<h2>Why choose the ONE Electric Scooter</h2>',
        '<p><strong>✔ Compact yet powerful</strong><br />Agile and easy to manoeuvre structure, ideal for pavements, city centres and indoor spaces.<br /><strong>✔ Range of up to 30 km</strong><br />Thanks to the 25Ah batteries, you can get through the day without worrying about recharging.<br /><strong>✔ Superior comfort</strong><br />Ergonomic seat, adjustable armrests and stable ride even on uneven surfaces.<br /><strong>✔ Easy to carry</strong><br />It disassembles quickly without tools, perfect for storing in the car or transporting.<br /><strong>✔ Smooth and safe drive</strong><br />Pneumatic tyres that absorb bumps in the ground for greater stability.<br /><strong>✔ Intuitive LED display</strong><br />Immediate check of battery status and main functions.</p>',
        '<h2>Main technical features</h2>',
        '<ul><li>Maximum speed: 8 km/h</li><li>Autonomy: up to 30 km</li><li>Maximum load capacity: 140 kg</li><li>Motor: 270W</li><li>Batteries: 2 x 12V 25Ah</li><li>Dimensions: 103 × 49 × 88 cm</li><li>Pneumatic wheels for more comfort</li><li>Demountable and transportable structure</li></ul>',
        '<h2>Who is it recommended for</h2>',
        '<ul><li>Persons with reduced mobility</li><li>Elderly people wanting greater autonomy</li><li>Anyone looking for a practical vehicle for the city</li><li>Who needs an easily transportable scooter</li><li>Daily indoor and outdoor use</li></ul>',
        '<h2>Reliability and practicality every day</h2>',
        '<p>The ONE Electric Scooter is designed to offer a perfect balance of performance, safety and ease of use. It is an ideal choice for anyone wanting to regain independent mobility without compromising on comfort.</p>',
        '<h2>Contact us for information or purchase</h2>',
        '<p><strong><a href="https://wa.me/393926509237">Contact us</a></strong> for daily rates and availability.<br />In addition, <strong><a href="/en/sale-catalog/">discover all other electric scooter models </a></strong>for mobility that Mia Medical Italia has to offer. On our <a href="/en/blog/?_gl=1*1rhu24b*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODM1NC4wLjAuMA..">blog</a> it is also possible to find a <strong><a href="/en/scooter-elettrici-per-mobilita-a-roma-i-vantaggi-del-noleggio/?_gl=1*fgzqby*_up*MQ..*_ga*NTgyMjUxNDg0LjE3NDQ0NDYyMjE.*_ga_D9FZ9V3LL7*MTc0NDQ1ODE2OS4zLjEuMTc0NDQ1ODM5Mi4wLjAuMA..">article-guide</a></strong> towards a well-informed choice of model for one\'s mobility scooter, as well as a wide variety of tips for accessible tourism. </p>',
        '<p>For availability, price and personal consultation:<br />📞 <a href="https://wa.me/393926509237">+39 392 65 09 237 </a>(also WhatsApp)</p>',
        '<p>Our team is on hand to help you choose the solution that best suits your needs.</p>',
        '<p><strong>Electric Scooter ONE: your independence, every day.</strong></p>',
      ].join(''),
    },
  },

  specs: {
    propulsion: 'electric',
    'max-load': 140,
    'max-speed': 8,
    'battery-range': { min: 30, max: 30 },
    motor: { it: '270 W', en: '270 W' },
    battery: { it: '2 x 12 V 25 Ah', en: '2 × 12 V 25 Ah' },
    'total-length': { min: 103, max: 103 },
    'total-width': { min: 49, max: 49 },
    'total-height': { min: 88, max: 88 },
  },

  media: {
    thumbnail: { file: 'one-scooter-1.png', alt: { it: 'Scooter elettrico One' } },
  },
  terms: [generalTerms],
});
