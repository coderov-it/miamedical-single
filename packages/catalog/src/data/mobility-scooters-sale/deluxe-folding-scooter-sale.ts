/**
 * Vendita Scooter pieghevole Deluxe con braccioli
 *
 * /prodotto/vendita-scooter-pieghevole-deluxe-con-braccioli/
 * WooCommerce product 15611, 3.880,00 € — the sale twin of the hire Deluxe.
 */

import { generalTerms } from '../shared/terms.ts';
import { mobilityScootersSale } from './category.ts';

export const deluxeFoldingScooterSale = mobilityScootersSale.fixed({
  code: 'deluxe-folding-scooter-sale',
  status: 'active',

  pricingMode: 'fixed',
  basePrice: 3880,

  translations: {
    it: {
      title: 'Vendita Scooter pieghevole Deluxe con braccioli',
      slug: 'vendita-scooter-pieghevole-deluxe-con-braccioli',
      shortDescription: 'Libertà e autonomia Acquista il tuo scooter elettrico pieghevole con braccioli Deluxe e muoviti in totale indipendenza ogni giorno. Compatto, leggero e progettato per il comfort, grazie alla scocca richiudibile è facilmente trasportabile e ideale anche per chi viaggia o necessita di un supporto pratico alla mobilità. Disponibile per acquisto con assistenza dedicata prima e dopo la vendita.',
      metaTitle: 'Vendita Scooter Pieghevole Deluxe con Braccioli | Mia Medical',
      metaDescription: 'Acquista scooter elettrico pieghevole con braccioli Deluxe: comfort, autonomia 15 km, facile da trasportare. Ideale per anziani e disabili.',
      description: [
        '<h2>Scooter Elettrico Pieghevole con Braccioli Deluxe: più comfort, più autonomia, più libertà</h2>',
        '<p>Lo scooter elettrico pieghevole con braccioli Deluxe è una soluzione pensata per chi desidera muoversi in autonomia senza rinunciare al comfort. Grazie alla struttura compatta e al sistema di chiusura intelligente, può essere facilmente trasportato e riposto, rendendolo adatto sia all’uso quotidiano che ai viaggi.</p>',
        '<p>Il design con braccioli integrati offre un supporto aggiuntivo durante la seduta, migliorando la postura e aumentando la stabilità durante la guida. La seduta ergonomica con schienale contribuisce a garantire una posizione confortevole anche per utilizzi prolungati.</p>',
        '<h2>Cosa rende questo scooter una scelta ideale</h2>',
        '<ul><li>Braccioli integrati: garantiscono un supporto stabile e una seduta più confortevole durante l’utilizzo.</li><li>Sistema pieghevole intelligente: lo scooter può essere richiuso rapidamente e trasportato con facilità, anche in auto o mezzi pubblici.</li><li>Batteria al litio removibile: consente la ricarica in modo pratico anche in ambienti domestici o strutture ricettive.</li><li>Autonomia fino a 15 km: ideale per spostamenti giornalieri, visite turistiche o attività urbane.</li><li>Stabilità di guida: le ruote anteriori gemellate e quelle posteriori in gomma piena permettono una guida fluida anche su superfici irregolari.</li><li>Seduta comfort con schienale: progettata per offrire sostegno e comodità durante tutto il tragitto.</li></ul>',
        '<h2>Specifiche Tecniche</h2>',
        '<p>Velocità massima: 6 km/h<br />Autonomia stimata: fino a 15 km<br />Pendenza affrontabile: 3°<br />Peso totale: 27 kg con batteria (25 kg senza batteria)<br />Portata massima: 115 kg<br />Batteria: Litio 24V 12 Ah<br />Motore: 270W<br />Dimensioni da chiuso: 75 × 48,5 × 45 cm</p>',
        '<h2>A chi è consigliato</h2>',
        '<p>Il prodotto è indicato per:</p>',
        '<ul><li>persone anziane</li><li>persone con mobilità ridotta</li><li>utenti con difficoltà motorie temporanee</li><li>persone con disabilità motorie</li><li>donne in gravidanza</li><li>viaggiatori che necessitano di un supporto alla mobilità</li></ul>',
        '<h2>Vantaggi nell’utilizzo</h2>',
        '<p>L’utilizzo di uno scooter elettrico in contesti urbani e turistici consente di affrontare percorsi lunghi, superfici irregolari e spostamenti quotidiani con maggiore facilità. La struttura compatta e pieghevole riduce gli ingombri, mentre la batteria removibile semplifica la gestione della ricarica.</p>',
        '<p>Inoltre, in molte strutture culturali e turistiche, l’utilizzo di dispositivi di mobilità può facilitare l’accesso e migliorare l’esperienza di visita.</p>',
        '<h2>Perché scegliere questo modello</h2>',
        '<p>Il modello Deluxe si distingue per la presenza dei braccioli, che migliorano il comfort e la stabilità rispetto ai modelli standard. È progettato per offrire un equilibrio tra praticità, sicurezza e comodità, risultando adatto a un utilizzo frequente e prolungato.</p>',
        '<h2>Contatti e informazioni</h2>',
        '<p>Per ricevere maggiori informazioni sul prodotto, disponibilità o modalità di acquisto:</p>',
        '<p>Telefono / WhatsApp: +39 392 65 09 237</p>',
        '<p>Supporto disponibile per richieste, consulenze e assistenza nella scelta del prodotto più adatto alle proprie esigenze.</p>',
      ].join(''),
    },
    en: {
      title: 'Deluxe folding scooter with armrests, for sale',
      slug: 'vendita-scooter-pieghevole-deluxe-con-braccioli',
      shortDescription: 'Freedom and autonomy Buy your Deluxe folding electric mobility scooter and get around in total independence every day. Compact, lightweight and designed for comfort, thanks to its foldable frame it is easily transportable and ideal even for those who travel or need practical mobility support. Available to buy with dedicated pre- and post-sales support.',
      metaTitle: 'Deluxe folding scooter with armrests for sale | Mia Medical',
      metaDescription: 'Buy the Deluxe folding mobility scooter with armrests: comfortable, 15 km on a charge, easy to carry. Right for older and disabled users.',
      description: [
        '<h2>Foldable Electric Scooter with Deluxe Armrests: more comfort, more range, more freedom</h2>',
        '<p>The Deluxe folding electric mobility scooter is a solution designed for those who want to move around independently without compromising on comfort. Thanks to its compact structure and intelligent folding system, it can be easily transported and stored, making it suitable for both daily use and travel.</p>',
        '<p>The design with integrated armrests offers additional support while sitting, improving posture and increasing stability during driving. The ergonomic seat with a backrest helps to ensure a comfortable position even during prolonged use.</p>',
        '<h2>What makes this scooter an ideal choice</h2>',
        '<ul><li>Integrated armrests: they guarantee stable support and a more comfortable seat during use.</li><li>Intelligent folding system: the scooter can be quickly folded and transported with ease, even in a car or on public transport.</li><li>Removable lithium battery: allows for convenient recharging even in domestic or hospitality environments.</li><li>Range of up to 15 km: ideal for daily commutes, sightseeing or urban activities.</li><li>Driving stability: the twin front wheels and solid rubber rear wheels allow for a smooth ride even on uneven surfaces.</li><li>Comfortable seat with backrest: designed to offer support and comfort throughout the journey.</li></ul>',
        '<h2>Technical Specifications</h2>',
        '<p>Maximum speed: 6 km/h<br />Estimated autonomy: up to 15 km<br />Manageable gradient: 3°<br />Total weight: 27 kg with battery (25 kg without battery)<br />Maximum load capacity: 115 kg<br />Battery: Lithium 24V 12 Ah<br />Motor: 270W<br />Closed dimensions: 75 × 48.5 × 45 cm</p>',
        '<h2>Who is it recommended for</h2>',
        '<p>The product is suitable for:</p>',
        '<ul><li>elderly people</li><li>people with reduced mobility</li><li>users with temporary motor impairments</li><li>persons with motor disabilities</li><li>pregnant women</li><li>travellers requiring mobility support</li></ul>',
        '<h2>Benefits of using</h2>',
        '<p>Using an electric scooter in urban and tourist settings makes it easier to tackle long routes, uneven surfaces and daily commutes. The compact, foldable design minimises bulk, while the removable battery simplifies charging management.</p>',
        '<p>Furthermore, in many cultural and tourist facilities, the use of mobility devices can facilitate access and improve the visitor experience.</p>',
        '<h2>Why choose this model</h2>',
        '<p>The Deluxe model stands out for the presence of armrests, which improve comfort and stability compared to the standard models. It is designed to offer a balance between practicality, safety and comfort, making it suitable for frequent and prolonged use.</p>',
        '<h2>Contact and information</h2>',
        '<p>For further information on the product, availability or purchase options:</p>',
        '<p>Phone / WhatsApp: +39 392 65 09 237</p>',
        '<p>Support available for enquiries, consultations and assistance in choosing the product best suited to your needs.</p>',
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
    'folded-size': { it: '75 × 48,5 × 45 cm', en: '75 × 48.5 × 45 cm' },
    foldable: true,
  },

  media: {
    thumbnail: { file: 'deluxe-folding-scooter-1.png', alt: { it: 'Noleggio scooter pieghevole con braccioli' } },
    gallery: [
      'deluxe-folding-scooter-2.jpg',
    ],
  },
  terms: [generalTerms],
});
