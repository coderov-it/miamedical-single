/**
 * Noleggio Deambulatore con tavoletta per appoggio antibrachiale
 *
 * /prodotto/noleggio-deambulatore-con-tavoletta-imbottita/
 * WooCommerce product 8939. No measurements on the page: `specs` is empty rather
 * than filled from the sibling walkers, because a forearm-support frame is not
 * the same frame as the underarm one whose table 9073 publishes.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { walkersHire } from './category.ts';

export const forearmSupportWalker = walkersHire.rental({
  code: 'forearm-support-walker',
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
      title: 'Noleggio Deambulatore con tavoletta per appoggio antibrachiale',
      slug: 'noleggio-deambulatore-con-tavoletta-imbottita',
      shortDescription: 'Noleggio Consegna a Roma e Firenze a partire da 30€. Nessun deposito richiesto. La consegna e il ritiro in magazzino sono GRATUITI!',
      metaTitle: 'Noleggio Deambulatore con tavoletta per appoggio antibrachiale',
      metaDescription: 'Noleggio Deambulatore con tavoletta antibrachiale per la fisioterapia e riabilitazione. Riacquista la tua libertà grazie aio prodotti Mia Medical.',
      description: [
        '<p>Hai difficoltà a camminare e cerchi un supporto stabile e confortevole? Abbiamo la soluzione ideale per te! Recupera la tua autonomia. Scegli il servizio di <strong>noleggio di un Deambulatore con Tavoletta per Appoggio Anti brachiale</strong> e godi del massimo del supporto, comfort e sicurezza.</p>',
        '<p>Se hai bisogno di un&nbsp;<strong>sostegno sicuro per la deambulazione</strong>, il&nbsp;<strong>noleggio del deambulatore con tavoletta per appoggio antibrachiale</strong>&nbsp;è una scelta pratica e conveniente. Questo ausilio è progettato per offrire&nbsp;<strong>stabilità, comfort e facilità di movimento</strong>, ideale per chi ha difficoltà a sostenere il peso con le mani o i polsi.</p>',
        '<h4><strong><a href="https://www.my-personaltrainer.it/salute-benessere/deambulatore.html">Cos’è un Deambulatore con Tavoletta per Appoggio Antibrachiale?</a></strong></h4>',
        '<p>Un&nbsp;<strong>deambulatore antibrachiale</strong>&nbsp;è un ausilio per la mobilità dotato di&nbsp;<strong>una tavoletta imbottita su cui appoggiare gli avambracci</strong>, riducendo lo sforzo su mani e polsi. È particolarmente utile per&nbsp;<strong>persone con artrite, debolezza agli arti superiori o problemi di equilibrio</strong>.</p>',
        '<h4><strong>Per Chi è Indicato il Noleggio di un Deambulatore con Tavoletta?</strong></h4>',
        '<p>Questo tipo di deambulatore è perfetto per:</p>',
        '<ul><li><strong>Persone con mobilità ridotta</strong>&nbsp;che hanno difficoltà a camminare autonomamente.</li><li><strong>Pazienti in riabilitazione</strong>&nbsp;dopo interventi chirurgici o traumi agli arti inferiori.</li><li><strong>Chi soffre di debolezza muscolare</strong>&nbsp;e ha bisogno di un supporto stabile.</li><li><strong>Anziani con difficoltà di equilibrio</strong>&nbsp;o problemi neurologici.</li><li><strong>Chi ha dolore o rigidità alle mani e ai polsi</strong>, come chi soffre di <a href="https://www.humanitas.it/malattie/artrite/">artrite</a>.</li></ul>',
        '<h4><strong>Perché Noleggiare un Deambulatore invece di Acquistarlo?</strong></h4>',
        '<p>Il&nbsp;<strong>noleggio di un deambulatore con tavoletta antibrachiale</strong>&nbsp;è una scelta intelligente se hai bisogno di un ausilio solo per un periodo limitato, ad esempio durante un recupero post-operatorio o una riabilitazione. I principali vantaggi sono:</p>',
        '<ul><li><strong>Risparmio economico</strong>&nbsp;rispetto all’acquisto.</li><li><strong>Massima flessibilità</strong>: puoi usarlo solo per il tempo necessario.</li><li><strong>Nessuna manutenzione</strong>: il dispositivo viene fornito igienizzato e pronto all’uso.</li><li><strong>Possibilità di sostituzione o upgrade</strong>&nbsp;se cambiano le tue esigenze.</li></ul>',
        '<h4><strong>Caratteristiche Tecniche del Deambulatore con Tavoletta Antibrachiale</strong></h4>',
        '<ul><li><strong>Telaio robusto e leggero</strong>&nbsp;in alluminio o acciaio, per garantire stabilità senza risultare troppo pesante.</li><li><strong>Tavoletta imbottita e regolabile in altezza</strong>, per adattarsi alla posizione più confortevole per l’utente.</li><li><strong>Impugnature ergonomiche</strong>&nbsp;per una presa sicura e confortevole.</li><li><strong>Ruote piroettanti</strong>&nbsp;con freni, per una maggiore sicurezza e facilità di movimento.</li><li><strong>Regolazione in altezza</strong>&nbsp;per adattarsi alle esigenze di ogni persona.</li></ul>',
        '<h4><strong>I Benefici del Noleggio del Deambulatore con Tavoletta Antibrachiale</strong></h4>',
        '<ul><li><strong>Maggiore stabilità e sicurezza</strong>&nbsp;durante la camminata.</li><li><strong>Riduzione della fatica</strong>&nbsp;grazie al supporto degli avambracci.</li><li><strong>Minor carico su mani, polsi e spalle</strong>, ideale per chi ha difficoltà a impugnare un normale deambulatore.</li><li><strong>Facilità di movimento</strong>, anche per spostamenti prolungati.</li><li><strong>Adatto per interni ed esterni</strong>, grazie alle ruote manovrabili.</li></ul>',
        '<p>Sei il caregiver di una persona anziana o di una persona non autosufficiente e hai bisogno di un aiuto? Il nostro <strong>infermiere</strong> di fiducia <strong><a href="http://www.arnaldiandrea.com">Andrea Arnaldi</a></strong> è specializzato nel campo <em><strong>dell’assistenza domiciliare</strong></em>, ed è pronto ad affiancarti per portare avanti le cure dal comfort della tua abitazione.&nbsp;</p>',
        '<h4><strong>Come Funziona il Noleggio con Mia Medical?</strong></h4>',
        '<p><a href="/mia-medical-condizioni-di-noleggio-dei-nostri-ausili-medicali/">Scopri le nostre modalità di noleggio cliccando qui.&nbsp;</a></p>',
        '<h4><strong>Perché Scegliere Mia Medical?</strong></h4>',
        '<p>Il noleggio di un ausilio medicale è un passo importante per il comfort e la salute dei nostri cari. <strong>Mia Medical</strong> ti offre:</p>',
        '<ul><li><strong>Consulenza personalizzata</strong>&nbsp;per aiutarti a trovare il prodotto giusto per le tue esigenze.</li><li><strong><a href="https://www.wimed.it/">Prodotti di alta qualità</a></strong>, certificati e sicuri provenienti dai <a href="https://movigroup.com/en/">migliori fornitori sul mercato</a>.</li><li><strong>Consegna rapida e assistenza garantita</strong>.</li></ul>',
        '<p>Se hai bisogno di ulteriori informazioni non esitare a <a href="https://wa.me/393926509237">contattarci telefonicamente</a>, siamo a tua completa disposizione per aiutarti a scegliere il modello di deambulatore o rollator che meglio si adatta alle tue esigenze! </p>',
      ].join(''),
    },
    en: {
      title: 'Walking frame with forearm support platform, for hire',
      slug: 'noleggio-deambulatore-con-tavoletta-imbottita',
      shortDescription: 'Hire. Delivery in Rome and Florence from 30€. No deposit required. Delivery and collection at the warehouse are FREE!',
      metaTitle: 'Forearm-support walking frame hire',
      metaDescription: 'Hire a walking frame with a forearm support platform for physiotherapy and rehabilitation, from Mia Medical.',
      description: [
        '<p>Do you have difficulty walking and are looking for a stable and comfortable support? We have the ideal solution for you! Recover your autonomy. Choose the <strong>rental of a Walker with Anti-Brachial Support Board</strong> and enjoy maximum support, comfort and safety.</p>',
        '<p>If you need a&nbsp;<strong>safe support for walking</strong>the&nbsp;<strong>rental of walker with antibrachial support board</strong>&nbsp;is a practical and convenient choice. This aid is designed to offer&nbsp;<strong>stability, comfort and ease of movement</strong>ideal for those who have difficulty supporting weight with their hands or wrists.</p>',
        '<h4><strong><a href="https://www.my-personaltrainer.it/salute-benessere/deambulatore.html">What is a Walker with Anti-Abrachial Support Board?</a></strong></h4>',
        '<p>A&nbsp;<strong>antibrachial walker</strong>&nbsp;is a mobility aid equipped with&nbsp;<strong>a padded board on which to rest your forearms</strong>reducing strain on hands and wrists. It is particularly useful for&nbsp;<strong>people with arthritis, upper limb weakness or balance problems</strong>.</p>',
        '<h4><strong>For Whom is the Rental of a Walker with Board Suitable?</strong></h4>',
        '<p>This type of walker is perfect for:</p>',
        '<ul><li><strong>Persons with reduced mobility</strong>&nbsp;who have difficulty walking independently.</li><li><strong>Rehabilitation patients</strong>&nbsp;after surgery or trauma to the lower limbs.</li><li><strong>Those suffering from muscle weakness</strong>&nbsp;and needs stable support.</li><li><strong>Elderly people with balance difficulties</strong>&nbsp;or neurological problems.</li><li><strong>Those with pain or stiffness in their hands and wrists</strong>such as those suffering from <a href="https://www.humanitas.it/malattie/artrite/">arthritis</a>.</li></ul>',
        '<h4><strong>Why rent a walker instead of buying one?</strong></h4>',
        '<p>The&nbsp;<strong>rental of a walker with anti-brachial board</strong>&nbsp;is a smart choice if you only need an aid for a limited period, e.g. during post-operative recovery or rehabilitation. The main advantages are:</p>',
        '<ul><li><strong>Saving money</strong>&nbsp;compared to the purchase.</li><li><strong>Maximum flexibility</strong>you can only use it for as long as necessary.</li><li><strong>No maintenance</strong>The device is delivered sanitised and ready for use.</li><li><strong>Possibility of replacement or upgrade</strong>&nbsp;if your needs change.</li></ul>',
        '<h4><strong>Technical Specifications of the Anti-Brachial Board Walker</strong></h4>',
        '<ul><li><strong>Robust, lightweight frame</strong>&nbsp;aluminium or steel, to ensure stability without being too heavy.</li><li><strong>Padded, height-adjustable tablet</strong>to adapt to the most comfortable position for the user.</li><li><strong>Ergonomic handles</strong>&nbsp;for a secure and comfortable grip.</li><li><strong>Swivel castors</strong>&nbsp;with brakes, for greater safety and ease of movement.</li><li><strong>Height adjustment</strong>&nbsp;to adapt to each person\'s needs.</li></ul>',
        '<h4><strong>The Benefits of Renting a Walker with Anti-Brachial Board</strong></h4>',
        '<ul><li><strong>Greater stability and security</strong>&nbsp;during the walk.</li><li><strong>Reducing fatigue</strong>&nbsp;thanks to the support of the forearms.</li><li><strong>Less load on hands, wrists and shoulders</strong>ideal for those who have difficulty holding a normal walker.</li><li><strong>Ease of movement</strong>even for longer journeys.</li><li><strong>Suitable for indoor and outdoor use</strong>thanks to manoeuvrable wheels.</li></ul>',
        '<p>Are you the caregiver of an elderly or dependent person and need help? Our <strong>nurse</strong> trustworthy <strong><a href="http://www.arnaldiandrea.com">Andrea Arnaldi</a></strong> specialises in the field <em><strong>home care</strong></em>and is ready to support you in taking care of the comfort of your home.&nbsp;</p>',
        '<h4><strong>How does Hire with Mia Medical work?</strong></h4>',
        '<p><a href="/en/mia-medical-condizioni-di-noleggio-dei-nostri-ausili-medicali/">Discover our rental options by clicking here.&nbsp;</a></p>',
        '<h4><strong>Why Choose Mia Medical?</strong></h4>',
        '<p>Hiring a medical aid is an important step for the comfort and health of our loved ones. <strong>Mia Medical</strong> offers you:</p>',
        '<ul><li><strong>Personalised consulting</strong>&nbsp;to help you find the right product for your needs.</li><li><strong><a href="https://www.wimed.it/">High-quality products</a></strong>certified and safe from <a href="https://movigroup.com/en/">best suppliers on the market</a>.</li><li><strong>Fast delivery and guaranteed service</strong>.</li></ul>',
        '<p>If you require further information, please do not hesitate to <a href="https://wa.me/393926509237">contact us by phone</a>We are happy to help you choose the model of walker or rollator that best suits your needs! </p>',
      ].join(''),
    },
  },

  media: {
    thumbnail: 'forearm-support-walker-1.jpg',
  },

  addons: [homeDelivery(30)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
