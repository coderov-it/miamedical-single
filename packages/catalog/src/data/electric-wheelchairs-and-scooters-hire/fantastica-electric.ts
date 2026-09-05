/**
 * Noleggio Carrozzina Elettrica Pieghevole FANTASTICA
 *
 * /prodotto/noleggio-carrozzina-elettrica-fantastica/
 * WooCommerce product 15094.
 *
 * ⚠️ The page contradicts itself on weight: the opening paragraph says "un peso
 * di soli 16 kg senza batteria", the bullet beneath says "appena 18 kg senza
 * batteria", and the "Caratteristiche principali" list — the shop's own
 * specification block — says "Peso: 18 kg senza batteria". 18 kg is recorded, and
 * both sentences stay in the description exactly as written.
 *
 * ⚠️ 300 € deposit. Delivery 30 € out, 30 € back.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeCollection, homeDeliveryOnly } from '../shared/addons.ts';
import { electricWheelchairsAndScootersHire } from './category.ts';

export const fantasticaElectric = electricWheelchairsAndScootersHire.rental({
  code: 'fantastica-electric',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(3, 110),
    days(7, 160),
    days(15, 250),
    days(30, 390),
    days(45, 540),
  ],

  translations: {
    it: {
      title: 'Noleggio Carrozzina Elettrica Pieghevole FANTASTICA',
      slug: 'noleggio-carrozzina-elettrica-fantastica',
      shortDescription: 'Noleggio carrozzina elettrica FANTASTICA Compatta, leggera e completamente elettrica. Batteria al litio estraibile, pratica da ricaricare ovunque. Consegna gratuita a Roma e Firenze per i noleggi da 30 giorni! Consegna a domicilio: 30€ + 30€ per il ritiro. Il ritiro in magazzino è gratuito. Deposito richiesto: 300€ Per il noleggio di questo articolo è richiesto un deposito di 300€.',
      metaTitle: 'Noleggio Carrozzina Elettrica Pieghevole Fantastica',
      metaDescription: 'Noleggio carrozzina elettrica pieghevole per uso interno ed esterno. Ottima come carrozzina elettrica per anziani e carrozzina elettrica per disabili.',
      description: [
        '<h3>Carrozzina elettrica pieghevole da uso esterno ed interno: compatta, leggera e pratica!</h3>',
        '<p>La carrozzina elettrica pieghevole Fantastica a noleggio è la soluzione ideale per chi cerca un ausilio pratico e affidabile, pensato per <strong>uso esterno e interno</strong>, perfetto per anziani e persone con disabilità che desiderano maggiore autonomia negli spostamenti quotidiani.</p>',
        '<p>È una <strong>carrozzina elettrica per anziani e disabili</strong> progettata per garantire comfort, sicurezza e semplicità d’utilizzo, sia in casa che all’aperto.</p>',
        '<p>Grazie alle sue caratteristiche compatte, rappresenta anche una valida <strong>carrozzina elettrica per uso esterno</strong>, ideale per passeggiate, viaggi e spostamenti urbani.</p>',
        '<p>Le dimensioni ridotte e il meccanismo di chiusura a libretto permettono di ripiegarla rapidamente, occupando pochissimo spazio: perfetta da trasportare in auto o su mezzi pubblici.</p>',
        '<p>Con un peso di <strong>soli 16 kg senza batteria</strong>, è una delle carrozzine elettriche pieghevoli più leggere della sua categoria.</p>',
        '<h2>Perché scegliere il noleggio della Carrozzina Elettrica pieghevole Fantastica?</h2>',
        '<p><strong>Ultra leggera e trasportabile</strong><br />Con appena <strong>18 kg senza batteria</strong>, è facile da sollevare, caricare e riporre, anche per accompagnatori o familiari.</p>',
        '<p><strong>Pieghevole e compatta</strong><br />La chiusura a libretto consente di ridurre al minimo l’ingombro, rendendola perfetta per spazi ristretti e viaggi.</p>',
        '<p><strong>Uso interno ed esterno</strong><br />Questa <strong>carrozzina elettrica pieghevole</strong> è ideale per uso interno ed esterno. Maneggevole e stabile, si adatta con naturalezza agli ambienti domestici così come a passeggiate e spostamenti urbani.</p>',
        '<p><strong>Joystick ambidestro</strong><br />Il joystick può essere posizionato <strong>a destra o a sinistra</strong>, garantendo un controllo intuitivo e personalizzabile in base alle esigenze dell’utente.</p>',
        '<p><strong>Batteria al litio estraibile</strong><br />Dotata di <strong>batteria al litio</strong>, facilmente removibile per una ricarica pratica e veloce, anche senza spostare l’intera carrozzina.</p>',
        '<p><strong>Portata fino a 120 kg</strong><br />Struttura solida e affidabile, con <strong>portata massima di 120 kg</strong>. Disponibili anche versioni con <strong>misure più grandi e portata fino a 150 kg</strong>.</p>',
        '<h2>Caratteristiche principali</h2>',
        '<ul><li>Tipologia: carrozzina elettrica pieghevole</li><li>Utilizzo: interno ed esterno</li><li>Peso: <strong>18 kg senza batteria</strong></li><li>Batteria: <strong>litio, estraibile</strong></li><li>Chiusura: a libretto</li><li>Comandi: joystick ambidestro</li><li>Portata massima: <strong>120 kg</strong></li><li>Ingombri: ridotti, ideale per spazi piccoli</li></ul>',
        '<h2>La scelta giusta per il noleggio</h2>',
        '<p>Disporre di una carrozzina elettrica pieghevole come la <strong>Fantastica</strong> semplifica la routine quotidiana e rende ogni spostamento più sereno. È la soluzione ideale per:</p>',
        '<ul><li>Persone con mobilità ridotta</li><li>Viaggiatori e turisti</li><li>Utilizzo temporaneo post-operatorio</li><li>Chi cerca un ausilio pratico, leggero e immediato</li></ul>',
        '<p>Compatta, affidabile e intuitiva, la Fantastica è pensata per accompagnarti ovunque, senza rinunce.</p>',
        '<h2>Noleggia la Carrozzina Elettrica Fantastica per uso interno ed esterno con Mia Medical Italia: soluzione perfetta per disabili ed anziani</h2>',
        '<p>Il noleggio della <strong>carrozzina elettrica pieghevole</strong> Fantastica è disponibile con consegna e ritiro.<br />Contattaci per <strong>tariffe giornaliere, settimanali o personalizzate</strong>.</p>',
        '<p>📞 <strong>+39 392 65 09 237</strong><br />💬 WhatsApp attivo – assistenza gratuita e senza impegno</p>',
        '<p>Scopri anche gli altri <a href="/catalogo-noleggio/">ausili elettrici disponibili</a> e visita il nostro <a href="/blog/">blog </a>per consigli su <strong>mobilità e turismo accessibile</strong>.</p>',
        '<p><strong>Muoviti in libertà, ogni giorno. Con Fantastica, è davvero possibile.</strong></p>',
        '<h2>Link utili</h2>',
        '<p>Approfondisci le normative sulla mobilità su sito del <strong><a href="https://www.salute.gov.it/new/">Ministero della Salute</a></strong></p>',
      ].join(''),
    },
    en: {
      title: 'FANTASTICA folding electric wheelchair for hire',
      slug: 'noleggio-carrozzina-elettrica-fantastica',
      shortDescription: 'Electric wheelchair hire FANTASTICA Compact, lightweight and fully electric. Battery extractable lithium, convenient to recharge anywhere. Free delivery in Rome and Florence for rentals of 30 days or more! Home delivery: €30 + €30 for collection. Collection from the warehouse is free of charge. Deposit required: 300€ For the rental of this article, a deposit of 300€.',
      metaTitle: 'FANTASTICA folding electric wheelchair hire',
      metaDescription: 'Hire the Fantastica folding electric wheelchair for indoors and out: 18 kg without its battery, removable lithium pack, ambidextrous joystick.',
      description: [
        '<h3>Foldable electric wheelchair for indoor and outdoor use: compact, lightweight and practical!</h3>',
        '<p>The rental Fantastica folding electric wheelchair is the ideal solution for anyone looking for a practical and reliable aid, designed for <strong>for indoor and outdoor use</strong>, perfect for elderly people and people with disabilities who want greater independence in their daily travel.</p>',
        '<p>It\'s a <strong>electric wheelchair for the elderly and disabled</strong> designed to guarantee comfort, safety and ease of use, both indoors and outdoors.</p>',
        '<p>Thanks to its compact design, it is also a valuable <strong>electric wheelchair for outdoor use</strong>, ideal for walks, trips and getting around town.</p>',
        '<p>Its compact size and fold-out mechanism mean it can be folded away quickly, taking up very little space: perfect for carrying in the car or on public transport.</p>',
        '<p>With a weight of <strong>only 16 kg without battery</strong>, it is one of the lightest folding electric wheelchairs in its category.</p>',
        '<h2>Why choose the rental of the Fantastica folding electric wheelchair?</h2>',
        '<p><strong>Ultra-light and transportable</strong><br />With just <strong>18 kg without battery</strong>, it is easy to lift, load and store, even for carers or family members.</p>',
        '<p><strong>Foldable and compact</strong><br />The fold-flat design reduces the footprint to a minimum, making it perfect for tight spaces and travel.</p>',
        '<p><strong>Indoor and outdoor use</strong><br />This <strong>folding electric wheelchair</strong> it is ideal for indoor and outdoor use. Handy and stable, it fits naturally into home environments as well as for walks and urban travel.</p>',
        '<p><strong>Ambidextrous joystick</strong><br />The joystick can be positioned <strong>right or left</strong>, ensuring intuitive and customisable control according to the user\'s needs.</p>',
        '<p><strong>Removable lithium battery</strong><br />Equipped with <strong>lithium battery</strong>, easily removable for practical and quick charging, even without moving the entire wheelchair.</p>',
        '<p><strong>Load capacity up to 120 kg</strong><br />Solid and reliable structure, with <strong>maximum load capacity of 120 kg</strong>. Also available are versions with <strong>larger sizes and capacity up to 150 kg</strong>.</p>',
        '<h2>Main features</h2>',
        '<ul><li>Type: electric folding wheelchair</li><li>Use: indoor and outdoor</li><li>Weight: <strong>18 kg without battery</strong></li><li>Battery: <strong>lithium, extractable</strong></li><li>Closure: booklet</li><li>Controls: ambidextrous joystick</li><li>Maximum capacity: <strong>120 kg</strong></li><li>Footprint: small, ideal for small spaces</li></ul>',
        '<h2>The right choice for hire</h2>',
        '<p>Having a folding electric wheelchair such as the <strong>Fantastic</strong> simplifies your daily routine and makes every journey more relaxed. It is the ideal solution for:</p>',
        '<ul><li>Persons with reduced mobility</li><li>Travellers and tourists</li><li>Temporary post-operative use</li><li>Those looking for a practical, light and immediate aid</li></ul>',
        '<p>Compact, reliable and intuitive, the Fantastica is designed to go with you everywhere, without compromise.</p>',
        '<h2>Hire the Fantastic Electric Wheelchair for indoor and outdoor use from Mia Medical Italia: the perfect solution for people with disabilities and the elderly</h2>',
        '<p>The rental of the <strong>folding electric wheelchair</strong> Fantastica is available with delivery and collection.<br />Contact us for <strong>daily, weekly or customised rates</strong>.</p>',
        '<p>📞 <strong>+39 392 65 09 237</strong><br />💬 WhatsApp active – free and no-obligation assistance</p>',
        '<p>Find out about the others too <a href="/en/rental-catalog/">electric aids available</a> and visit our <a href="/en/blog/">blog </a>for advice on <strong>mobility and accessible tourism</strong>.</p>',
        '<p><strong>Move freely, every day. With Fantastica, it really is possible.</strong></p>',
        '<h2>Useful links</h2>',
        '<p>Find out more about mobility regulations on the website of the <strong><a href="https://www.salute.gov.it/new/">Ministry of Health</a></strong></p>',
      ].join(''),
    },
  },

  specs: {
    propulsion: 'electric',
    'indoor-outdoor': 'both',
    'max-load': 120,
    weight: { min: 18, max: 18 },
    battery: { it: 'Litio, estraibile', en: 'Lithium, removable' },
    controls: { it: 'Joystick ambidestro', en: 'Joystick, mountable left or right' },
    foldable: true,
  },

  media: {
    thumbnail: { file: 'fantastica-electric-1.png', alt: { it: 'Noleggio carrozzina elettrica pieghevole' } },
  },

  addons: [homeDeliveryOnly(30), homeCollection(30)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
