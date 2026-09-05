/**
 * Noleggio Deambulatore in alluminio pieghevole ultraleggero
 *
 * /prodotto/noleggio-deambulatore-in-alluminio/
 * WooCommerce product 8959. `frame-material: aluminium` and `foldable` are what
 * the product's own title states; nothing else on the page is measurable.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { walkersHire } from './category.ts';

export const ultralightAluminiumWalker = walkersHire.rental({
  code: 'ultralight-aluminium-walker',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(7, 30),
    days(15, 35),
    days(30, 50),
    days(45, 65),
    days(60, 80),
    days(90, 100),
  ],

  translations: {
    it: {
      title: 'Noleggio Deambulatore in alluminio pieghevole ultraleggero | Roma e Firenze',
      slug: 'noleggio-deambulatore-in-alluminio',
      shortDescription: 'Consegna a Roma e Firenze a partire da 30€. Nessun deposito richiesto. La consegna e il ritiro in magazzino sono GRATUITI!',
      metaTitle: 'Noleggio deambulatore pieghevole leggero | Roma e Firenze',
      metaDescription: 'Noleggio Deambulatore leggero a Roma e Firenze. Migliore Prezzo Garantito. Prenotazione Online. Disponibilità immediata. Visita il nostro Sit',
      description: [
        '<p>Hai bisogno di un supporto sicuro per camminare? Il nostro servizio di <strong>noleggio di&nbsp;deambulatore in alluminio pieghevole e ultraleggero a quattro ruote</strong>&nbsp;è la soluzione ideale per migliorare la tua mobilità in modo pratico e confortevole.</p>',
        '<h4>Cos’è un Deambulatore Pieghevole e Ultraleggero a Quattro Ruote?</h4>',
        '<p>Un deambulatore è un ausilio per la mobilità progettato per garantire&nbsp;<strong>stabilità, sicurezza e facilità di spostamento</strong>. Questo modello, realizzato in&nbsp;<strong>alluminio leggero</strong>, è dotato di&nbsp;<strong>quattro ruote</strong>, <strong>impugnature ergonomiche</strong> e un pratico sistema di frenata per un utilizzo sicuro sia in casa che all’aperto. Inoltre, la sua funzione <strong>pieghevole</strong> lo rende facile da trasportare. </p>',
        '<h4>A chi è indicato il servizio di noleggio di un deambulatore? &#8211; Roma e Firenze </h4>',
        '<p>I deambulatori&nbsp;<strong>sono indicati nella fase di rieducazione alla deambulazione in soggetti anziani o con limitazioni funzionali di varia natura</strong>. Offrono stabilità, facilità di utilizzo e migliorano la sensazione di equilibrio dell&#8217;utilizzatore.</p>',
        '<p>Il deambulatore in alluminio pieghevole ultraleggero con quattro ruote è ideale per:</p>',
        '<ul><li><strong>Persone con difficoltà motorie</strong>&nbsp;che necessitano di un supporto stabile per camminare.</li><li><strong>Pazienti in fase di riabilitazione</strong>&nbsp;dopo interventi o traumi agli arti inferiori.</li><li><strong>Anziani con problemi di equilibrio</strong>&nbsp;che cercano un ausilio sicuro e facile da manovrare.</li><li><strong>Persone con debolezza muscolare</strong>&nbsp;che vogliono ridurre lo sforzo nella deambulazione.</li></ul>',
        '<h4>Perchè Noleggiare un Deambulatore invece di Acquistarlo?</h4>',
        '<p>Il noleggio del deambulatore ultraleggero e pieghevole a quattro ruote a Roma e Firenze è la soluzione più conveniente se hai bisogno di un supporto solo per un periodo limitato, come durante un recupero post-operatorio o una terapia riabilitativa.</p>',
        '<ul><li><strong>Risparmio economico</strong>&nbsp;rispetto all’acquisto.</li><li><strong>Massima flessibilità</strong>: lo usi solo per il tempo necessario.</li><li><strong>Igienizzato e pronto all’uso</strong>, senza pensieri di manutenzione.</li><li><strong>Possibilità di sostituzione o upgrade</strong>&nbsp;in base alle tue esigenze.</li></ul>',
        '<h4>Caratteristiche Tecniche del Deambulatore Ultraleggero e Pieghevole </h4>',
        '<ul><li><strong>Struttura in alluminio leggero</strong>, resistente e facile da trasportare.</li><li><strong>Quattro ruote piroettanti</strong> per un’ottima manovrabilità.</li><li><strong>Freni di sicurezza</strong> per un maggiore controllo durante l’uso.</li><li><strong>Impugnature ergonomiche</strong> per una presa comoda e sicura.</li><li><strong>Ultraleggero e Pieghevole</strong> per adattarsi alle esigenze di ogni persona.</li></ul>',
        '<h4>I Benefici</h4>',
        '<ul><li><strong>Maggiore indipendenza</strong> negli spostamenti quotidiani.</li><li><strong>Facilità di utilizzo</strong>, anche per chi ha poca forza nelle mani.</li><li><strong>Adatto per interni </strong> grazie alle ruote manovrabili.</li><li><strong>Sicurezza e comfort</strong>, con un design studiato per ridurre il rischio di cadute.</li></ul>',
        '<p>In tal senso si tratta di uno strumento ideale per muoversi in&nbsp;<strong>casa. </strong></p>',
        '<p>Scopri tutte le opzioni di noleggio e scegli la soluzione più adatta a te. <strong><a href="/catalogo-noleggio/">Clicca qui per maggiori informazioni.</a></strong></p>',
        '<h4>Perché Scegliere Mia Medical?</h4>',
        '<ul><li><strong>Consulenza personalizzata</strong> per trovare il prodotto giusto per le tue esigenze.</li><li><strong>Prodotti di alta qualità</strong>, certificati e sicuri dai <a href="https://www.wimed.it/">migliori fornitori sul mercato.</a></li><li><strong>Consegna rapida</strong> e <strong>assistenza garantita</strong>.</li></ul>',
        '<p>Sei il caregiver di una persona anziana o di una persona non autosufficiente e hai bisogno di un aiuto? Il nostro <strong>infermiere</strong> di fiducia <strong><a href="http://www.arnaldiandrea.com">Andrea Arnaldi</a></strong> è specializzato nel campo <strong>dell’assistenza domiciliare</strong>, ed è pronto ad affiancarti per portare avanti le cure dal comfort della tua abitazione.</p>',
        '<p>Hai bisogno di aiuto nella scelta del deambulatore più adatto a te? <strong><a href="https://wa.me/393926509237">Contattaci ora</a></strong> per una consulenza gratuita!</p>',
      ].join(''),
    },
    en: {
      title: 'Ultralight folding aluminium walking frame, for hire | Rome and Florence',
      slug: 'noleggio-deambulatore-in-alluminio',
      shortDescription: 'Delivery in Rome and Florence from 30€. No deposit required. Delivery and collection from the warehouse are FREE!',
      metaTitle: 'Light folding walker hire | Rome and Florence',
      metaDescription: 'Hire a light walking frame in Rome and Florence. Best price guaranteed, book online, available immediately.',
      description: [
        '<p>Do you need a safe walking support? Our service of <strong>rental of foldable, ultralight aluminium four-wheel walker</strong>&nbsp;is the ideal solution to improve your mobility in a practical and comfortable way.</p>',
        '<h4>What is a Foldable and Ultralight Four-Wheel Walker?</h4>',
        '<p>A walker is a mobility aid designed to provide&nbsp;<strong>stability, safety and ease of movement</strong>. This model, made of&nbsp;<strong>lightweight aluminium</strong>, is equipped with&nbsp;<strong>four-wheelers</strong>, <strong>ergonomic handles</strong> and a practical braking system for safe use both indoors and outdoors. In addition, its function <strong>foldable</strong> makes it easy to transport. </p>',
        '<h4>For whom is a walker rental service indicated? - Rome and Florence </h4>',
        '<p>Walkers&nbsp;<strong>are indicated during gait re-education in elderly individuals or individuals with functional limitations of various kinds</strong>. They offer stability, ease of use and improve the user\'s feeling of balance.</p>',
        '<p>The ultralight folding aluminium walker with four wheels is ideal for:</p>',
        '<ul><li><strong>People with motor difficulties</strong>&nbsp;who need a stable support for walking.</li><li><strong>Patients undergoing rehabilitation</strong>&nbsp;after surgery or trauma to the lower limbs.</li><li><strong>Elderly people with balance problems</strong>&nbsp;who are looking for an aid that is safe and easy to manoeuvre.</li><li><strong>People with muscle weakness</strong>&nbsp;who want to reduce the effort in walking.</li></ul>',
        '<h4>Why rent a walker instead of buying one?</h4>',
        '<p>Renting an ultralight, foldable four-wheel walker in Rome and Florence is the most convenient solution if you only need support for a limited period, such as during post-operative recovery or rehabilitation therapy.</p>',
        '<ul><li><strong>Saving money</strong>&nbsp;compared to the purchase.</li><li><strong>Maximum flexibility</strong>use it only for as long as necessary.</li><li><strong>Sanitised and ready to use</strong>maintenance-free.</li><li><strong>Possibility of replacement or upgrade</strong>&nbsp;according to your needs.</li></ul>',
        '<h4>Technical Specifications of the Ultralight and Foldable Walker </h4>',
        '<ul><li><strong>Lightweight aluminium construction</strong>durable and easy to transport.</li><li><strong>Four swivel castors</strong> for excellent manoeuvrability.</li><li><strong>Safety brakes</strong> for greater control during use.</li><li><strong>Ergonomic handles</strong> for a comfortable and secure grip.</li><li><strong>Ultralight and Foldable</strong> to adapt to each person\'s needs.</li></ul>',
        '<h4>The Benefits</h4>',
        '<ul><li><strong>Greater independence</strong> in the daily commute.</li><li><strong>Ease of use</strong>even for those with little strength in their hands.</li><li><strong>Suitable for indoors </strong> thanks to manoeuvrable wheels.</li><li><strong>Safety and comfort</strong>design to reduce the risk of falls.</li></ul>',
        '<p>In this sense it is an ideal tool for moving in&nbsp;<strong>home. </strong></p>',
        '<p>Discover all the rental options and choose the solution that suits you best. <strong><a href="/en/rental-catalog/">Click here for more information.</a></strong></p>',
        '<h4>Why Choose Mia Medical?</h4>',
        '<ul><li><strong>Personalised consulting</strong> to find the right product for your needs.</li><li><strong>High-quality products</strong>certified and safe by the <a href="https://www.wimed.it/">best suppliers on the market.</a></li><li><strong>Quick delivery</strong> e <strong>guaranteed assistance</strong>.</li></ul>',
        '<p>Are you the caregiver of an elderly or dependent person and need help? Our <strong>nurse</strong> trustworthy <strong><a href="http://www.arnaldiandrea.com">Andrea Arnaldi</a></strong> specialises in the field <strong>home care</strong>and is ready to support you in taking care of the comfort of your home.</p>',
        '<p>Need help choosing the right walker for you? <strong><a href="https://wa.me/393926509237">Contact us now</a></strong> for a free consultation!</p>',
      ].join(''),
    },
  },

  specs: {
    'frame-material': 'aluminium',
    foldable: true,
  },

  media: {
    thumbnail: 'ultralight-aluminium-walker-1.jpg',
    gallery: [
      'ultralight-aluminium-walker-2.jpg',
    ],
  },

  addons: [homeDelivery(30)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
