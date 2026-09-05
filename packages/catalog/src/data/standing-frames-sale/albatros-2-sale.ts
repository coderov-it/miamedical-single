/**
 * Vendita verticalizzatore attivo Albatros 2
 *
 * /prodotto/verticalizzatore-attivo-albatros-2-in-vendita/
 * WooCommerce product 14621, 2.780,00 € — the sale twin of the hire Albatros 2,
 * and the same two facts: it folds in seconds, and a charge is good for 40 lifts.
 */

import { generalTerms } from '../shared/terms.ts';
import { standingFramesSale } from './category.ts';

export const albatros2Sale = standingFramesSale.fixed({
  code: 'albatros-2-sale',
  status: 'active',

  pricingMode: 'fixed',
  basePrice: 2780,

  translations: {
    it: {
      title: 'Vendita verticalizzatore attivo Albatros 2',
      slug: 'verticalizzatore-attivo-albatros-2-in-vendita',
      shortDescription: 'Verticalizzatore stand-up elettrico Mette in posizione eretta senza sforzo da parte del paziente! Guarda il video per il funzionamento. Compatto, pieghevole e facile da usare. Batteria fino a 40 sollevamenti con una sola carica. Disponibilità immediata. Consegna Gratuita in caso di Acquisto',
      metaTitle: 'Verticalizzatore attivo Albatros 2 in vendita',
      metaDescription: 'Vendita Verticalizzatore attivo Albatros 2: assistenza sicura e pratica. Compatto, pieghevole e facile da usare. Disponibilità immediata.',
      description: [
        '<h3>Vendita Verticalizzatore attivo Albatros 2: assistenza sicura e senza sforzo</h3>',
        '<p>Il <strong>Verticalizzatore attivo Albatros 2</strong> è la soluzione ideale per chi cerca un supporto pratico, compatto e affidabile nella mobilità assistita. Grazie al suo design pieghevole e al funzionamento intuitivo, permette di sollevare e spostare la persona in totale sicurezza, riducendo lo sforzo del caregiver e aumentando il comfort dell’assistito.</p>',
        '<h3>Perché scegliere il Verticalizzatore attivo Albatros 2?</h3>',
        '<ul><li><strong>Massima praticità</strong>: struttura pieghevole che si chiude in pochi secondi per facilitare trasporto e stoccaggio.</li><li><strong>Stabilità e comfort</strong>: pedane con lacci in velcro e imbragatura inclusa, per garantire sicurezza e sostegno ottimali.</li><li><strong>Autonomia garantita</strong>: batterie ricaricabili con caricabatterie interno e circa 40 sollevamenti con una carica completa.</li><li><strong>Sicurezza totale</strong>: arresto di emergenza, abbassamento manuale e segnalatore acustico in caso di batteria scarica.</li><li><strong>Tecnologia affidabile</strong>: motore e centralina Linak, telecomando ergonomico e componentistica di alta qualità.</li></ul>',
        '<h3>Verticalizzatore Albatros 2: il tuo alleato per la mobilità assistita</h3>',
        '<p>Il <strong>Sollevatore Albatros 2 Plus</strong> è progettato per:</p>',
        '<ul><li>Caregiver e familiari che desiderano un aiuto pratico e sicuro.</li><li>Persone con mobilità ridotta che necessitano trasferimenti confortevoli.</li><li>Strutture sanitarie e residenze assistenziali che vogliono garantire sicurezza e qualità ai loro ospiti.</li></ul>',
        '<h3>Acquista il Verticalizzatore attivo Albatros 2 da Mia Medical Italia</h3>',
        '<p>Contattaci subito per conoscere la disponibilità del <strong>Verticalizzatore attivo Albatros 2</strong> e scoprire anche gli altri modelli di sollevatori, carrozzine e ausili per la mobilità.</p>',
        '<p>Chiama ora al +39 392 65 09 237<br />Mandaci un messaggio su WhatsApp: il nostro team è sempre pronto a rispondere a ogni domanda.</p>',
        '<p>Scopri anche gli altri modelli di <a href="/catalogo-noleggio/">sollevatori</a>, <a href="/catalogo-noleggio/">carrozzine</a> e <a href="/catalogo-noleggio/">ausili per la mobilità</a> che <strong>Mia Medical Italia</strong> mette a disposizione.</p>',
        '<p><strong>Muoviti e solleva senza pensieri, con Albatros 2 la sicurezza è a portata di mano.</strong></p>',
      ].join(''),
    },
    en: {
      title: 'Albatros 2 active standing hoist, for sale',
      slug: 'verticalizzatore-attivo-albatros-2-in-vendita',
      shortDescription: 'Electric stand-up standing hoist. Brings someone upright with no effort on their part. Watch the video to see it work. Compact, folding and easy to use. The battery is good for up to 40 lifts on one charge. Available immediately.',
      metaTitle: 'Albatros 2 active standing hoist for sale',
      metaDescription: 'Albatros 2 active standing hoist for sale: safe, practical assistance. Compact, folding and easy to use. Available immediately.',
      description: [
        '<h3>Sale Albatros 2 active verticiser: safe and effortless assistance</h3>',
        '<p>The <strong>Albatros 2 active verticaliser</strong> is the ideal solution for those seeking a practical, compact and reliable support in assisted mobility. Thanks to its foldable design and intuitive operation, it allows the person to be lifted and moved in total safety, reducing the caregiver\'s effort and increasing the caregiver\'s comfort.</p>',
        '<h3>Why choose the Albatros 2 Active Verticaliser?</h3>',
        '<ul><li><strong>Maximum practicality</strong>foldable structure that closes in seconds for easy transport and storage.</li><li><strong>Stability and comfort</strong>: footplates with Velcro straps and sling included for optimal safety and support.</li><li><strong>Guaranteed autonomy</strong>rechargeable batteries with internal charger and approximately 40 lifts on a full charge.</li><li><strong>Total security</strong>emergency stop, manual lowering and low battery warning horn.</li><li><strong>Reliable technology</strong>Linak motor and control unit, ergonomic remote control and high-quality components.</li></ul>',
        '<h3>Albatros 2 verticaliser: your ally for assisted mobility</h3>',
        '<p>The <strong>Lift Albatros 2 Plus</strong> is designed for:</p>',
        '<ul><li>Caregivers and family members who want safe and practical help.</li><li>People with reduced mobility requiring comfortable transfers.</li><li>Healthcare facilities and nursing homes that want to guarantee safety and quality for their residents.</li></ul>',
        '<h3>Buy the Albatros 2 active verticiser from Mia Medical Italia</h3>',
        '<p>Contact us now for availability of the <strong>Albatros 2 active verticaliser</strong> and also discover other models of lifts, wheelchairs and mobility aids.</p>',
        '<p>Call now on +39 392 65 09 237<br />Send us a message on WhatsApp: our team is always ready to answer any questions.</p>',
        '<p>Discover also the other models of <a href="/en/rental-catalog/">lifters</a>, <a href="/en/rental-catalog/">wheelchairs</a> e <a href="/en/rental-catalog/">mobility aids</a> which <strong>Mia Medical Italia</strong> makes available.</p>',
        '<p><strong>Move and lift without worries, with Albatros 2 safety is at your fingertips.</strong></p>',
      ].join(''),
    },
  },

  specs: {
    'lifts-per-charge': 40,
    foldable: true,
  },

  media: {
    thumbnail: { file: 'albatros-2-1.png', alt: { it: 'Noleggio verticalizzatore attivo Albatros2' } },
    gallery: [
      'albatros-2-2.png',
      'albatros-2-3.jpg',
      'albatros-2-4.jpg',
    ],
  },
  terms: [generalTerms],
});
