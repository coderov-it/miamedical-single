/**
 * Vendita carrozzina Reclinabile
 *
 * /prodotto/vendita-carrozzina-reclinabile/  ·  WooCommerce product 15877, 440,00 €.
 *
 * The sale page lists the chair's features but prints no measurements at all — no
 * seat width, no weight, no load limit. None are copied across from the hire
 * listing (9034): a different page is a different product, and borrowing its
 * figures would be inventing them.
 */

import { generalTerms } from '../shared/terms.ts';
import { wheelchairsSale } from './category.ts';

export const recliningWheelchairSale = wheelchairsSale.fixed({
  code: 'reclining-wheelchair-sale',
  status: 'active',

  pricingMode: 'fixed',
  basePrice: 440,

  translations: {
    it: {
      title: 'Vendita carrozzina Reclinabile',
      slug: 'vendita-carrozzina-reclinabile',
      shortDescription: 'Acquisto carrozzina Consegna gratuita in tutta Italia. Carrozzina reclinabile comoda e sicura. Ideale per anziani e persone con disabilità. Schienale e pedane regolabili.Completamente pieghevole. Chiamaci subito per informazioni e acquisto.',
      metaTitle: 'Carrozzina Reclinabile in Vendita | Comfort e Sicurezza',
      metaDescription: 'Acquista una carrozzina reclinabile in vendita: comoda e sicura. Ideale per anziani e persone con disabilità. Schienale e pedane regolabili. Consegna rapida',
      description: [
        '<p>La carrozzina reclinabile in Vendita è progettata per garantire <strong>comfort, autonomia e sicurezza</strong> a persone con mobilità ridotta o che necessitano di assistenza continuativa. Grazie alla struttura robusta e alle numerose regolazioni, rappresenta una soluzione completa sia per uso domestico che sanitario.</p>',
        '<h2>Caratteristiche principali</h2>',
        '<p>Le caratteristiche di questa carrozzina reclinabile in vendita sono:</p>',
        '<ul><li><strong>Schienale reclinabile multiposizione</strong> per massimo comfort e riposo prolungato</li><li><strong>Pedane regolabili e removibili</strong> per adattarsi a ogni utente</li><li><strong>Braccioli estraibili o ribaltabili</strong> per facilitare trasferimenti laterali</li><li><strong>Poggiatesta ergonomico</strong> per supporto cervicale</li><li><strong>Sistema solleva-gambe integrato</strong> per migliorare la circolazione</li><li><strong>Telaio pieghevole in acciaio rinforzato</strong> per trasporto e stoccaggio facilitati</li><li><strong>Ruote posteriori ad alta scorrevolezza con freni di sicurezza</strong></li><li><strong>Seduta imbottita e traspirante</strong> per uso prolungato senza fastidi</li></ul>',
        '<h2>Vantaggi della carrozzina reclinabile in Vendita </h2>',
        '<ul><li>Massimo comfort anche per utilizzi prolungati</li><li>Facilità di movimentazione e gestione da parte dell’assistente</li><li>Struttura resistente e adatta a uso quotidiano intensivo</li><li>Adatta sia a casa che in strutture sanitarie</li><li>Regolazioni multiple per esigenze diverse dell’utente</li></ul>',
        '<h2>Ideale per</h2>',
        '<ul><li>Anziani con ridotta autonomia motoria</li><li>Persone in fase post-operatoria o riabilitazione</li><li>Utenti con disabilità temporanea o permanente</li><li>Case di cura, RSA e strutture sanitarie</li></ul>',
        '<h2>Materiali e qualità della carrozzina reclinabile in vendita </h2>',
        '<p>La carrozzina è realizzata con <strong>materiali medicali certificati</strong>, progettata per garantire stabilità, durata nel tempo e sicurezza nell’utilizzo quotidiano. Tutti i componenti sono testati per assicurare affidabilità e resistenza.</p>',
        '<h2>Manutenzione e pulizia</h2>',
        '<p>La superficie è facile da pulire e igienizzare con prodotti medicali standard. Tutti i materiali sono resistenti a disinfezioni frequenti.</p>',
        '<h2>Disponibilità e assistenza </h2>',
        '<p>Per questa carrozzina reclinabile in vendita ti offriamo: </p>',
        '<ul><li>Consegna rapida su tutto il territorio nazionale</li><li>Supporto tecnico per configurazione e utilizzo</li><li>Possibilità di consulenza per scelta modello più adatto</li></ul>',
        '<h2>Acquisto e informazioni della carrozzina reclinabile in vendita</h2>',
        '<p>Per preventivi o disponibilità:</p>',
        '<p>📞 +39 392 650 9237<br />✉️ amministrazione@miamedicalitalia.it</p>',
        '<p>Per ulteriori informazioni puoi consultare anche le nostre altre<strong><a href="/catalogo-vendita/">carrozzine in vendita</a></strong> disponibili.</p>',
        '<p>Scopri qui la nostra pagine <a href="https://facebook.com/MIAMedicalitalia/">Facebook </a></p>',
      ].join(''),
    },
    en: {
      title: 'Reclining wheelchair for sale',
      slug: 'vendita-carrozzina-reclinabile',
      shortDescription: 'Purchase wheelchair Delivery free throughout Italy. Comfortable and safe reclining wheelchair. Ideal for the elderly and people with disabilities. Adjustable backrest and footrests. Fully foldable. Call us now for information and purchase.',
      metaTitle: 'Reclining wheelchair for sale | Comfort and safety',
      metaDescription: 'Buy a reclining wheelchair: multi-position backrest, headrest, integrated leg lift, adjustable footrests and a folding reinforced steel frame.',
      description: [
        '<p>The reclining wheelchair for sale is designed to ensure <strong>comfort, autonomy and safety</strong> for people with reduced mobility or who require continuous care. Thanks to its sturdy structure and numerous adjustments, it represents a complete solution for both domestic and healthcare use.</p>',
        '<h2>Main features</h2>',
        '<p>The features of this reclining wheelchair for sale are:</p>',
        '<ul><li><strong>Multi-position reclining backrest</strong> for maximum comfort and prolonged rest</li><li><strong>Adjustable and removable footpegs</strong> to suit every user</li><li><strong>Removable or fold-down armrests</strong> to facilitate lateral transfers</li><li><strong>Ergonomic headrest</strong> for neck support</li><li><strong>Integrated leg-lift system</strong> to improve circulation</li><li><strong>Folding frame made of reinforced steel</strong> for easier transport and storage</li><li><strong>High-manoeuvrability rear wheels with safety brakes</strong></li><li><strong>Padded and breathable seat</strong> for prolonged use without discomfort</li></ul>',
        '<h2>Advantages of a reclining wheelchair for sale </h2>',
        '<ul><li>Maximum comfort, even during prolonged use</li><li>Ease of movement and handling by the carer</li><li>A sturdy design suitable for intensive daily use</li><li>Suitable for use both at home and in healthcare settings</li><li>Multiple adjustments for different user needs</li></ul>',
        '<h2>Ideal for</h2>',
        '<ul><li>Older people with reduced mobility</li><li>People in the post-operative phase or undergoing rehabilitation</li><li>Users with temporary or permanent disabilities</li><li>Care homes, residential care homes and healthcare facilities</li></ul>',
        '<h2>Materials and quality of the reclining wheelchair for sale </h2>',
        '<p>The wheelchair is made with <strong>certified medical materials</strong>, designed to guarantee stability, durability over time and safety in daily use. All components are tested to ensure reliability and resistance.</p>',
        '<h2>Maintenance and cleaning</h2>',
        '<p>The surface is easy to clean and sanitise with standard medical products. All materials are resistant to frequent disinfection.</p>',
        '<h2>Availability and support </h2>',
        '<p>With this reclining wheelchair for sale, we offer you: </p>',
        '<ul><li>Fast delivery throughout the country</li><li>Technical support for configuration and use</li><li>Consultancy available for choosing the most suitable model</li></ul>',
        '<h2>Purchasing and information on reclining wheelchairs for sale</h2>',
        '<p>For quotes or availability:</p>',
        '<p>📞 +39 392 650 9237<br />✉️ amministrazione@miamedicalitalia.it</p>',
        '<p>For further information you can also consult our other<strong><a href="/en/sale-catalog/">wheelchairs for sale</a></strong> available.</p>',
        '<p>Discover our pages here <a href="https://facebook.com/MIAMedicalitalia/">Facebook </a></p>',
      ].join(''),
    },
  },

  specs: {
    'frame-material': 'steel',
    upholstery: { it: 'Seduta imbottita e traspirante', en: 'Padded, breathable seat' },
    foldable: true,
    'reclining-backrest': true,
    headrest: true,
    'elevating-legrests': true,
    'removable-armrests': true,
    'removable-footrests': true,
    brakes: 'parking',
  },

  media: {
    thumbnail: { file: 'reclining-wheelchair-1.jpg', alt: { it: 'carrozzina con schienale reclinabile' } },
    gallery: [
      'reclining-wheelchair-2.jpg',
      'reclining-wheelchair-3.jpg',
    ],
  },
  terms: [generalTerms],
});
