/**
 * Vendita Deambulatore in alluminio pieghevole ultraleggero
 *
 * /prodotto/deambulatore-in-alluminio-pieghevole-ultraleggero-in-vendita/
 * WooCommerce product 14646, 98,00 € — the cheapest product in the catalogue.
 * The page body prints no figures at all and never mentions a seat; `has-seat`
 * comes from the shop's own Yoast description, "il rollator pieghevole in
 * alluminio leggero e resistente, con ruote, seduta e cestino". It is the
 * weakest-sourced spec in the catalogue — the shop's words, but not on the page
 * a customer reads.
 */

import { generalTerms } from '../shared/terms.ts';
import { walkersSale } from './category.ts';

export const ultralightAluminiumWalkerSale = walkersSale.fixed({
  code: 'ultralight-aluminium-walker-sale',
  status: 'active',

  pricingMode: 'fixed',
  basePrice: 98,

  translations: {
    it: {
      title: 'Vendita Deambulatore in alluminio pieghevole ultraleggero',
      slug: 'deambulatore-in-alluminio-pieghevole-ultraleggero-in-vendita',
      shortDescription: 'Deambulatore in alluminio pieghevole ultraleggero Acquista ora! Spedizione gratuita in tutta l’Italia.',
      metaTitle: 'Deambulatore in alluminio pieghevole ultraleggero in vendita',
      metaDescription: 'Acquista il rollator pieghevole in alluminio leggero e resistente, con ruote, seduta e cestino. Spedizione gratuita in tutta Italia.',
      description: [
        '<p>Hai bisogno di un supporto sicuro per camminare? Il nostro <strong>deambulatore in alluminio pieghevole e ultraleggero a quattro ruote</strong> è la soluzione ideale per migliorare la tua mobilità in modo pratico e confortevole.</p>',
        '<h3>Cos’è un Deambulatore Pieghevole e Ultraleggero a Quattro Ruote?</h3>',
        '<p>Un deambulatore è un ausilio per la mobilità progettato per garantire&nbsp;<strong>stabilità, sicurezza e facilità di spostamento</strong>. Questo modello, realizzato in&nbsp;<strong>alluminio leggero</strong>, è dotato di&nbsp;<strong>quattro ruote</strong>,&nbsp;<strong>impugnature ergonomiche</strong>&nbsp;e un pratico sistema di frenata per un utilizzo sicuro sia in casa che all’aperto. Inoltre, la sua funzione&nbsp;<strong>pieghevole</strong>&nbsp;lo rende facile da trasportare.</p>',
        '<h3>Per chi è indicato questo deambulatore? </h3>',
        '<p>I deambulatori&nbsp;<strong>sono indicati nella fase di rieducazione alla deambulazione in soggetti anziani o con limitazioni funzionali di varia natura</strong>. Offrono stabilità, facilità di utilizzo e migliorano la sensazione di equilibrio dell’utilizzatore.</p>',
        '<p>Il deambulatore in alluminio pieghevole ultraleggero con quattro ruote è ideale per:</p>',
        '<ul><li><strong>Persone con difficoltà motorie</strong> che necessitano di un supporto stabile per camminare.</li><li><strong>Pazienti in fase di riabilitazione</strong> dopo interventi o traumi agli arti inferiori.</li><li><strong>Anziani con problemi di equilibrio</strong> che cercano un ausilio sicuro e facile da manovrare.</li><li><strong>Persone con debolezza muscolare</strong> che vogliono ridurre lo sforzo nella deambulazione.</li></ul>',
        '<h3>Caratteristiche Tecniche del Deambulatore Ultraleggero e Pieghevole</h3>',
        '<ul><li><strong>Struttura in alluminio leggero</strong>, resistente e facile da trasportare.</li><li><strong>Quattro ruote piroettanti</strong> per un’ottima manovrabilità.</li><li><strong>Freni di sicurezza</strong> per un maggiore controllo durante l’uso.</li><li><strong>Impugnature ergonomiche</strong> per una presa comoda e sicura.</li><li><strong>Ultraleggero e Pieghevole</strong> per adattarsi alle esigenze di ogni persona.</li></ul>',
        '<h3>I Benefici</h3>',
        '<ul><li><strong>Maggiore indipendenza</strong> negli spostamenti quotidiani.</li><li><strong>Facilità di utilizzo</strong>, anche per chi ha poca forza nelle mani.</li><li><strong>Adatto per interni </strong>grazie alle ruote manovrabili.</li><li><strong>Sicurezza e comfort</strong>, con un design studiato per ridurre il rischio di cadute.</li></ul>',
        '<p>In tal senso si tratta di uno strumento ideale per muoversi in&nbsp;<strong>casa.</strong></p>',
        '<h3>Perché Scegliere Mia Medical?</h3>',
        '<ul><li><strong>Consulenza personalizzata</strong> per trovare il prodotto giusto per le tue esigenze.</li><li><strong>Prodotti di alta qualità</strong>, certificati e sicuri dai <a href="https://www.wimed.it/">migliori fornitori sul mercato.</a></li><li><strong>Consegna rapida</strong> e <strong>assistenza garantita</strong>.</li></ul>',
        '<p>Sei il caregiver di una persona anziana o di una persona non autosufficiente e hai bisogno di un aiuto? Il nostro&nbsp;<strong>infermiere</strong>&nbsp;di fiducia&nbsp;<strong><a href="http://www.arnaldiandrea.com/">Andrea Arnaldi</a></strong>&nbsp;è specializzato nel campo&nbsp;<strong>dell’assistenza domiciliare</strong>, ed è pronto ad affiancarti per portare avanti le cure dal comfort della tua abitazione.</p>',
        '<p>Hai bisogno di aiuto nella scelta del deambulatore più adatto a te?&nbsp;<strong><a href="https://wa.me/393926509237">Contattaci ora</a></strong>&nbsp;per una consulenza gratuita!</p>',
      ].join(''),
    },
    en: {
      title: 'Ultralight folding aluminium walking frame, for sale',
      slug: 'deambulatore-in-alluminio-pieghevole-ultraleggero-in-vendita',
      shortDescription: 'Ultralight folding aluminium walking frame. Buy now! Free shipping across Italy.',
      metaTitle: 'Ultralight folding aluminium walker for sale',
      metaDescription: 'Buy a light, sturdy folding aluminium rollator with wheels, a seat and a basket. Free shipping across Italy.',
      description: [
        '<p>Do you need safe support for walking? Our <strong>foldable, ultralight aluminium walker with four wheels</strong> is the ideal solution to improve your mobility in a practical and comfortable way.</p>',
        '<h3>What is a Foldable and Ultralight Four-Wheel Walker?</h3>',
        '<p>A walker is a mobility aid designed to provide&nbsp;<strong>stability, safety and ease of movement</strong>. This model, made of&nbsp;<strong>lightweight aluminium</strong>, is equipped with&nbsp;<strong>four-wheelers</strong>,&nbsp;<strong>ergonomic handles</strong>&nbsp;and a practical braking system for safe use both indoors and outdoors. In addition, its function&nbsp;<strong>foldable</strong>&nbsp;makes it easy to transport.</p>',
        '<h3>For whom is this walker suitable? </h3>',
        '<p>Walkers&nbsp;<strong>are indicated during gait re-education in elderly individuals or individuals with functional limitations of various kinds</strong>. They offer stability, ease of use and improve the user\'s feeling of balance.</p>',
        '<p>The ultralight folding aluminium walker with four wheels is ideal for:</p>',
        '<ul><li><strong>People with motor difficulties</strong> who need a stable support for walking.</li><li><strong>Patients undergoing rehabilitation</strong> after surgery or trauma to the lower limbs.</li><li><strong>Elderly people with balance problems</strong> who are looking for an aid that is safe and easy to manoeuvre.</li><li><strong>People with muscle weakness</strong> who want to reduce the effort in walking.</li></ul>',
        '<h3>Technical Specifications of the Ultralight and Foldable Walker</h3>',
        '<ul><li><strong>Lightweight aluminium construction</strong>durable and easy to transport.</li><li><strong>Four swivel castors</strong> for excellent manoeuvrability.</li><li><strong>Safety brakes</strong> for greater control during use.</li><li><strong>Ergonomic handles</strong> for a comfortable and secure grip.</li><li><strong>Ultralight and Foldable</strong> to adapt to each person\'s needs.</li></ul>',
        '<h3>The Benefits</h3>',
        '<ul><li><strong>Greater independence</strong> in the daily commute.</li><li><strong>Ease of use</strong>even for those with little strength in their hands.</li><li><strong>Suitable for indoors </strong>thanks to manoeuvrable wheels.</li><li><strong>Safety and comfort</strong>design to reduce the risk of falls.</li></ul>',
        '<p>In this sense it is an ideal tool for moving in&nbsp;<strong>home.</strong></p>',
        '<h3>Why Choose Mia Medical?</h3>',
        '<ul><li><strong>Personalised consulting</strong> to find the right product for your needs.</li><li><strong>High-quality products</strong>certified and safe by the <a href="https://www.wimed.it/">best suppliers on the market.</a></li><li><strong>Quick delivery</strong> e <strong>guaranteed assistance</strong>.</li></ul>',
        '<p>Are you the caregiver of an elderly or dependent person and need help? Our&nbsp;<strong>nurse</strong>&nbsp;trustworthy&nbsp;<strong><a href="http://www.arnaldiandrea.com/">Andrea Arnaldi</a></strong>&nbsp;specialises in the field&nbsp;<strong>home care</strong>and is ready to support you in taking care of the comfort of your home.</p>',
        '<p>Need help choosing the right walker for you?&nbsp;<strong><a href="https://wa.me/393926509237">Contact us now</a></strong>&nbsp;for a free consultation!</p>',
      ].join(''),
    },
  },

  specs: {
    'frame-material': 'aluminium',
    'has-seat': true,
    foldable: true,
  },

  media: {
    thumbnail: 'ultralight-aluminium-walker-1.jpg',
  },
  terms: [generalTerms],
});
