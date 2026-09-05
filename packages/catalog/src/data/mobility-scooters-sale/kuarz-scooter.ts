/**
 * Vendita Scooter Elettrico Kuarz
 *
 * /prodotto/vendita-scooter-elettrico-kuarz/
 * WooCommerce product 15545, 3.990,00 € — the fastest, longest-legged and
 * heaviest scooter in the catalogue, and the only product whose page gives a
 * turning radius. The short description names it a Vermeiren.
 *
 *   Velocità massima  15 km/h    Autonomia  fino a 45 km
 *   Motore  750 W               Batterie  80 Ah AGM sigillate
 *   Capacità di carico  165 kg  Peso scooter  158 kg
 *   Larghezza totale  680 mm    Lunghezza totale  1505 mm
 *   Altezza totale  1345 – 1395 mm    Altezza sedile  480 – 530 mm regolabile
 *   Raggio di sterzata  3400 mm
 *
 * The page quotes these in millimetres; they are recorded in centimetres, which
 * is the spec's unit, and every conversion is exact.
 */

import { generalTerms } from '../shared/terms.ts';
import { mobilityScootersSale } from './category.ts';

export const kuarzScooter = mobilityScootersSale.fixed({
  code: 'kuarz-scooter',
  status: 'active',
  brand: 'Vermeiren',

  pricingMode: 'fixed',
  basePrice: 3990,

  translations: {
    it: {
      title: 'Vendita Scooter Elettrico Kuarz',
      slug: 'vendita-scooter-elettrico-kuarz',
      shortDescription: 'Libertà di movimento Acquista lo scooter elettrico Vermeiren Kuarz e riscopri la libertà di muoverti in totale autonomia! Grazie ai comandi intuitivi e al potente motore, potrai spostarti comodamente e in sicurezza per le tue attività quotidiane. Siamo a Roma e Firenze.',
      metaTitle: 'Scooter elettrico Kuarz per anziani e disabili – Comfort e autonomia',
      metaDescription: 'Acquista lo scooter elettrico Kuarz per anziani e disabili: autonomia fino a 45 km, comfort, sicurezza e design moderno per muoversi senza limiti.',
      description: [
        '<p>Vendita scooter elettrico<strong> Kuarz</strong> da esterno per anziani e persone con mobilità ridotta: libertà, sicurezza e stile per muoverti senza limiti.</p>',
        '<p>Se desideri spostarti con autonomia e sicurezza durante le tue giornate, lo scooter elettrico <strong>Vermeiren Kuarz</strong> è la soluzione perfetta per ritrovare indipendenza e comfort. Ideale per passeggiate, commissioni quotidiane o momenti di relax all’aperto, questo scooter combina tecnologia avanzata, design moderno e massima stabilità su strada.</p>',
        '<p>Progettato per offrire un’esperienza di guida fluida e sicura, garantisce comfort elevato e prestazioni affidabili anche per lunghi spostamenti.</p>',
        '<h2>Perché scegliere lo Scooter Elettrico Vermeiren Kuarz?</h2>',
        '<p><strong>Massimo comfort:</strong><br />Sedile ampio, ergonomico e regolabile con schienale pieghevole e braccioli comodi per una postura rilassata anche durante lunghi tragitti.</p>',
        '<p><strong>Grande autonomia:</strong><br />Percorri fino a <strong>45 km</strong> con una sola ricarica grazie alle batterie potenti da 80 Ah, ideali per un’intera giornata fuori casa.</p>',
        '<p><strong>Prestazioni elevate:</strong><br />Motore da <strong>750W</strong> e velocità fino a <strong>15 km/h</strong>, per muoverti rapidamente e senza fatica.</p>',
        '<p><strong>Sicurezza totale:</strong><br />Sistema di illuminazione LED SBS “See and Be Seen”, indicatori di direzione, freni elettromagnetici e sistema antiribaltamento per una guida stabile e sicura.</p>',
        '<p><strong>Guida semplice e intuitiva:</strong><br />Display LCD con luminosità adattiva e comandi facili da utilizzare, pensati per rendere la guida accessibile a tutti.</p>',
        '<p><strong>Design elegante:</strong><br />Linee moderne e una vasta gamma di colori disponibili per uno scooter che unisce mobilità e stile personale.</p>',
        '<h2>Caratteristiche tecniche e dettagli pratici</h2>',
        '<p>Velocità massima: <strong>15 km/h</strong><br />Autonomia: <strong>fino a 45 km</strong><br />Motore: <strong>750 W</strong><br />Batterie: <strong>80 Ah AGM sigillate</strong><br />Capacità di carico: <strong>165 kg</strong><br />Larghezza totale: <strong>680 mm</strong><br />Lunghezza totale: <strong>1505 mm</strong><br />Altezza totale: <strong>1345 – 1395 mm</strong><br />Altezza sedile: <strong>480 – 530 mm regolabile</strong><br />Raggio di sterzata: <strong>3400 mm</strong><br />Peso scooter: <strong>158 kg</strong><br />Illuminazione: <strong>LED anteriori e posteriori</strong></p>',
        '<h2>Acquista ora lo Scooter Elettrico Vermeiren Kuarz</h2>',
        '<p>Con <strong>Mia Medical Italia</strong> hai la sicurezza di acquistare un prodotto affidabile, certificato e progettato per migliorare la mobilità quotidiana.</p>',
        '<p>Il nostro team ti guiderà passo dopo passo nella scelta dello scooter più adatto alle tue esigenze, offrendo assistenza completa prima e dopo l’acquisto.</p>',
        '<p>📞 <strong>Chiamaci subito:</strong> +39 392 65 09 237<br />💬 <strong>Scrivici su WhatsApp</strong> per ricevere una consulenza gratuita e senza impegno.</p>',
      ].join(''),
    },
    en: {
      title: 'Kuarz electric scooter for sale',
      slug: 'vendita-scooter-elettrico-kuarz',
      shortDescription: 'Freedom of movement Buy the Vermeiren Kuarz electric scooter and rediscover the freedom to get about in complete independence! Thanks to its intuitive controls and powerful motor, you’ll be able to get about comfortably and safely as you go about your daily activities. We’re based in Rome and Florence.',
      metaTitle: 'Kuarz mobility scooter for older and disabled users – comfort and range',
      metaDescription: 'Buy the Kuarz mobility scooter for older and disabled users: up to 45 km on a charge, comfortable, safe and modern.',
      description: [
        '<p>Electric scooter sales<strong> Kuarz</strong> Outdoor seating for older people and those with reduced mobility: freedom, safety and style to get about without limits.</p>',
        '<p>If you want to get about independently and safely throughout the day, the electric scooter <strong>Vermeiren Kuarz</strong> It is the perfect solution for regaining independence and comfort. Ideal for walks, daily errands or relaxing outdoors, this scooter combines advanced technology, modern design and maximum stability on the road.</p>',
        '<p>Designed to offer a smooth and safe driving experience, it guarantees a high level of comfort and reliable performance, even on long journeys.</p>',
        '<h2>Why choose the Vermeiren Kuarz electric scooter?</h2>',
        '<p><strong>Maximum comfort:</strong><br />A spacious, ergonomic and adjustable seat with a reclining backrest and comfortable armrests, ensuring a relaxed posture even on long journeys.</p>',
        '<p><strong>Long battery life:</strong><br />Go as far as <strong>45 km</strong> on a single charge, thanks to the powerful 80 Ah batteries, which are ideal for a whole day out and about.</p>',
        '<p><strong>High performance:</strong><br />Engine from <strong>750W</strong> and speeds of up to <strong>15 km/h</strong>, so you can move quickly and effortlessly.</p>',
        '<p><strong>Total security:</strong><br />SBS “See and Be Seen” LED lighting system, indicators, electromagnetic brakes and an anti-rollover system for a stable and safe ride.</p>',
        '<p><strong>A simple and intuitive guide:</strong><br />An LCD display with adaptive brightness and user-friendly controls, designed to make driving accessible to everyone.</p>',
        '<p><strong>Elegant design:</strong><br />Modern lines and a wide range of colours are available for a scooter that combines mobility with personal style.</p>',
        '<h2>Technical features and practical details</h2>',
        '<p>Maximum speed: <strong>15 km/h</strong><br />Autonomy: <strong>up to 45 km</strong><br />Motor: <strong>750 W</strong><br />Batteries: <strong>80 Ah sealed AGM batteries</strong><br />Load capacity: <strong>165 kg</strong><br />Total width: <strong>680 mm</strong><br />Overall length: <strong>1505 mm</strong><br />Total height: <strong>1345 – 1395 mm</strong><br />Seat height: <strong>480–530 mm, adjustable</strong><br />Turning circle: <strong>3,400 mm</strong><br />Scooter weight: <strong>158 kg</strong><br />Lighting: <strong>Front and rear LEDs</strong></p>',
        '<h2>Buy the Vermeiren Kuarz Electric Scooter now</h2>',
        '<p>With <strong>Mia Medical Italia</strong> You can be sure you’re buying a reliable, certified product designed to improve your everyday mobility.</p>',
        '<p>Our team will guide you step by step in choosing the scooter best suited to your needs, offering comprehensive support both before and after your purchase.</p>',
        '<p>📞 <strong>Call us now:</strong> +39 392 65 09 237<br />💬 <strong>Write to us on WhatsApp</strong> to receive a free, no-obligation consultation.</p>',
      ].join(''),
    },
  },

  specs: {
    propulsion: 'electric',
    'max-load': 165,
    weight: { min: 158, max: 158 },
    'max-speed': 15,
    'battery-range': { min: 45, max: 45 },
    motor: { it: '750 W', en: '750 W' },
    battery: { it: '80 Ah AGM sigillate', en: '80 Ah sealed AGM' },
    'total-width': { min: 68, max: 68 },
    'total-length': { min: 150.5, max: 150.5 },
    'total-height': { min: 134.5, max: 139.5 },
    'seat-height': { min: 48, max: 53 },
    'turning-radius': 340,
  },

  media: {
    thumbnail: 'kuarz-scooter-1.png',
    gallery: [
      'kuarz-scooter-2.png',
      'kuarz-scooter-3.png',
      'kuarz-scooter-4.png',
      'kuarz-scooter-5.png',
    ],
  },
  terms: [generalTerms],
});
