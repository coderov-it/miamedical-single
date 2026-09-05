/**
 * Vendita carrozzina Elettrica Superwheel
 *
 * /prodotto/carrozzina-elettrica-superwheel-in-vendita/
 * WooCommerce product 14602, 3.892,00 € — the sale twin of the hire Superwheel.
 *
 * ⚠️ This page carries BOTH figures, and so does the hire page — with the two
 * swapped. Here the selling point says "portata fino a 135 kg" and the
 * specification block says "Capacità di carico: 150 kg"; on the hire page
 * (14542) it is the other way round. Each product takes the figure from its own
 * specification block, which is 150 kg here and 135 kg there. One machine, two
 * ratings, and the shop needs to settle which. See docs/catalog/README.md.
 */

import { generalTerms } from '../shared/terms.ts';
import { electricWheelchairsSale } from './category.ts';

export const superwheelElectricSale = electricWheelchairsSale.fixed({
  code: 'superwheel-electric-sale',
  status: 'active',

  pricingMode: 'fixed',
  basePrice: 3892,

  translations: {
    it: {
      title: 'Vendita carrozzina Elettrica Superwheel',
      slug: 'carrozzina-elettrica-superwheel-in-vendita',
      shortDescription: 'Libertà di movimento Acquista la carrozzina elettrica Superwheel e riscopri la comodità di muoverti senza fatica! Il joystick elettrico gestisce l’intera carrozzina: guida, schienale e pedane in totale semplicità. Il ritiro in magazzino è gratuito. Siamo a Roma e Firenze.',
      metaTitle: 'Vendita carrozzina elettrica Superwheel per anziani e disabili',
      metaDescription: 'Vendita carrozzina elettrica Superwheel da esterno e interno per anziani e disabili. Autonomia fino a 25 km, comfort e sicurezza. Disponibilità immediata.',
      description: [
        '<p>La vendita carrozzina elettrica Superwheel è pensata per anziani e disabili che desiderano vivere ogni giornata con maggiore autonomia, comfort e sicurezza. Questa carrozzina elettrica da esterno e interno unisce design moderno, praticità e alte prestazioni, risultando ideale sia per l’utilizzo quotidiano sia per gli spostamenti in città come Roma, Milano e Firenze.</p>',
        '<p>Grazie alla struttura pieghevole e completamente smontabile, la carrozzina elettrica Superwheel è facile da trasportare in auto e garantisce massima libertà di movimento.</p>',
        '<h3>Perché scegliere la Carrozzina Elettrica Superwheel?</h3>',
        '<p><strong>Massimo comfort</strong>: seduta ergonomica da 43 cm, schienale reclinabile e pedane elevabili con prolungamento per appoggio testa, braccioli regolabili.<br /><strong>Alta autonomia</strong>: percorri fino a 25 km con batterie al litio potenziate – ideale per un’intera giornata di visite o commissioni.<br /><strong>Joystick:</strong>&nbsp;Con un solo joystick controlli tutto: direzione, velocità, schienale e pedane regolabili.<br /><strong>Sicurezza garantita</strong>: joystick elettrico intuitivo, ruote pneumatiche 4&#215;4 per tutti i terreni, freni affidabili e stabilità su qualsiasi superficie.<br /><strong>Trasporto semplice</strong>: completamente pieghevole e smontabile, perfetta per essere caricata in auto; cestello posteriore rimovibile.<br /><strong>Design versatile</strong>: compatta con ingombro totale di 63 cm aperta, portata fino a 135 kg, adatta a tutte le età.</p>',
        '<h3>Caratteristiche tecniche della carrozzina elettrica Superwheel</h3>',
        '<ul><li><strong>Velocità massima</strong>: 8 km/h</li><li><strong>Autonomia</strong>: 13 km (standard) – 25 km (batterie potenziate)</li><li><strong>Capacità di carico</strong>: 150 kg</li><li><strong>Seduta</strong>: 43 cm</li><li><strong>Schienale</strong>: reclinabile con prolungamento per testa</li><li><strong>Motore</strong>: 2 x 250W</li><li><strong>Batterie</strong>: Litio, peso 1,3 kg</li><li><strong>Ruote</strong>: pneumatiche 4&#215;4 con camera d’aria</li><li><strong>Comandi</strong>: joystick elettrico per l’utente</li></ul>',
        '<h3>Acquista ora la tua Carrozzina Elettrica Superwheel da esterno ed interno</h3>',
        '<p>Acquista ora la tua carrozzina: la vendita carrozzina elettrica Superwheel di Mia Medical Italia ti garantisce qualità, assistenza e disponibilità immediata. Il nostro team ti accompagnerà passo passo nella scelta e nell’acquisto, fornendoti assistenza completa pre e post vendita.</p>',
        '<p>Effettuiamo spedizione rapida in tutta Italia: Roma, Milano, Napoli, Torino, Firenze e Bologna.</p>',
        '<p>Chiamaci subito al <strong>+39 392 65 09 237</strong> o scrivici su WhatsApp: riceverai una consulenza gratuita e senza impegno.</p>',
        '<h2>Link Utili</h2>',
        '<p>Scopri anche tutte le nostre carrozzine elettriche disponibili in vendita nel <a href="/catalogo-vendita/">catalogo Mia Medical Italia.</a><br />Altrimenti trovi <a href="/catalogo-noleggio/">qui</a> tutte le carrozzine elettriche a noleggio. </p>',
        '<p>Per maggiori informazioni sulla mobilità assistita puoi consultare il sito del <a href="https://www.salute.gov.it/new/">Ministero della Salute.</a></p>',
      ].join(''),
    },
    en: {
      title: 'Superwheel electric wheelchair for sale',
      slug: 'carrozzina-elettrica-superwheel-in-vendita',
      shortDescription: 'Freedom of movement Purchase the Superwheel electric wheelchair and rediscover the convenience of moving around effortlessly! The electric joystick controls the entire wheelchair: steering, backrest and footrests in total simplicity. Pick-up at the warehouse is free. We are in Rome and Florence.',
      metaTitle: 'Superwheel electric wheelchair for sale, for older and disabled users',
      metaDescription: 'Superwheel indoor-outdoor electric wheelchair for sale, for older and disabled users. Up to 25 km on a charge, comfortable and safe.',
      description: [
        '<p>The sale of the Superwheel electric wheelchair is designed for elderly people and individuals with disabilities who want to live every day with greater independence, comfort and safety. This outdoor and indoor electric wheelchair combines modern design, practicality and high performance, making it ideal both for daily use and for getting around cities such as Rome, Milan and Florence.</p>',
        '<p>Thanks to its folding and completely detachable structure, the Superwheel electric wheelchair is easy to transport in a car and guarantees maximum freedom of movement.</p>',
        '<h3>Why choose the Superwheel Electric Wheelchair?</h3>',
        '<p><strong>Maximum comfort</strong>ergonomic 43 cm seat, reclining backrest and elevating footrests with extension for head support, adjustable armrests.<br /><strong>High autonomy</strong>: travel up to 25 kilometres with enhanced lithium batteries – ideal for a full day of sightseeing or errands.<br /><strong>Joystick:</strong>&nbsp;With one joystick you control everything: direction, speed, backrest and adjustable footpegs.<br /><strong>Guaranteed security</strong>: intuitive electric joystick, 4×4 pneumatic wheels for all terrains, reliable brakes and stability on any surface.<br /><strong>Simple transport</strong>fully foldable and removable, perfect for loading in the car; removable rear basket.<br /><strong>Versatile design</strong>: compact with a total footprint of 63 cm when open, load capacity up to 135 kg, suitable for all ages.</p>',
        '<h3>Technical specifications of the Superwheel electric wheelchair</h3>',
        '<ul><li><strong>Maximum speed</strong>8 km/h</li><li><strong>Autonomy</strong>: 13 kilometres (standard) – 25 kilometres (enhanced batteries)</li><li><strong>Load capacity</strong>150 kg</li><li><strong>Seating</strong>43 cm</li><li><strong>Backrest</strong>: reclining with head extension</li><li><strong>Motor</strong>2 x 250W</li><li><strong>Batteries</strong>Lithium, weight 1.3 kg</li><li><strong>Wheels</strong>: 4×4 tyres with inner tubes</li><li><strong>Commands</strong>: electric joystick for the user</li></ul>',
        '<h3>Buy your Superwheel electric wheelchair for indoor and outdoor use now</h3>',
        '<p>Buy your wheelchair now: the sale of the Superwheel electric wheelchair by Mia Medical Italia guarantees you quality, support and immediate availability. Our team will guide you step by step through the selection and purchase process, providing you with comprehensive pre- and post-sale support.</p>',
        '<p>We offer fast delivery throughout Italy: Rome, Milan, Naples, Turin, Florence and Bologna.</p>',
        '<p>Call us now at <strong>+39 392 65 09 237</strong> or write to us on WhatsApp: you will receive a free, no-obligation consultation.</p>',
        '<h2>Useful Links</h2>',
        '<p>Discover all our electric wheelchairs available for sale in the <a href="/en/sale-catalog/">Mia Medical Italia catalogue.</a><br />Otherwise, you’ll find <a href="/en/rental-catalog/">here</a> All electric wheelchairs available for hire. </p>',
        '<p>For further information on assisted mobility, you can consult the website of the <a href="https://www.salute.gov.it/new/">Ministry of Health.</a></p>',
      ].join(''),
    },
  },

  specs: {
    propulsion: 'electric',
    'indoor-outdoor': 'both',
    'max-load': 150,
    'max-speed': 8,
    'battery-range': { min: 13, max: 25 },
    motor: { it: '2 x 250 W', en: '2 × 250 W' },
    battery: { it: 'Litio, peso 1,3 kg', en: 'Lithium, 1.3 kg' },
    controls: { it: 'Joystick elettrico per l’utente', en: 'Electric joystick, operated by the user' },
    'seat-width': { min: 43, max: 43 },
    'wheel-type': 'pneumatic',
    'rear-wheels': { it: 'Pneumatiche 4×4 con camera d’aria', en: 'Pneumatic 4×4, inner tube' },
    'reclining-backrest': true,
    headrest: true,
    'elevating-legrests': true,
    foldable: true,
  },

  media: {
    thumbnail: { file: 'superwheel-electric-1.png', alt: { it: 'Vendita carrozzina elettrica Superwheel' } },
    gallery: [
      'superwheel-electric-2.png',
      'superwheel-electric-3.png',
      'superwheel-electric-4.png',
      'superwheel-electric-5.png',
      'superwheel-electric-6.png',
    ],
  },
  terms: [generalTerms],
});
