/**
 * Noleggio rampa e pedane per disabili
 *
 * /prodotto/noleggio-rampa-pedana-per-disabili/
 * WooCommerce product 8988. Filed here rather than under Montascale because the
 * site's own Yoast primary term for it is Carrozzine, though it is listed under
 * both.
 *
 * ⚠️ One variation (13629) is labelled "32 giorni - 25 €". 25 € is what every
 * sibling charges for THREE days, and the ladder runs 7/15/30/45/60/90 around it,
 * so the 32 is near-certainly a typo for 3. It is written as the site has it —
 * duration 32 — and listed in docs/catalog/README.md for the shop to correct.
 *
 * No propulsion, no seat: a ramp has neither, and the specs it does fill are the
 * four its own page prints.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { wheelchairsHire } from './category.ts';

export const ramp = wheelchairsHire.rental({
  code: 'ramp',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(7, 30),
    days(15, 35),
    days(30, 50),
    days(32, 25),
    days(45, 65),
    days(60, 80),
    days(90, 100),
  ],

  translations: {
    it: {
      title: 'Noleggio rampa e pedane per disabili',
      slug: 'noleggio-rampa-pedana-per-disabili',
      shortDescription: 'Noleggio e affitto rampa o pedana per disabili Noleggio per 1 giorno: 15€ con ritiro solamente in sede. Consegna e ritiro a domicilio solo a Roma e Firenze a partire da 30€. Il ritiro degli ausili in magazzino è gratuito.',
      metaTitle: 'Affitto rampe per le scale per disabili a noleggio',
      metaDescription: 'Affitto rampe per le scale per disabili a noleggio: pedane leggere e pieghevoli per sedia a rotelle, passeggini e bici. Prenota ora!',
      description: [
        '<p>La <strong>rampa o pedana a noleggio</strong> è la soluzione ideale per chi cerca <strong>affitto rampe per le scale per disabili a noleggio</strong>. Questa pedana permette di superare gradini e ostacoli quotidiani in completa sicurezza, rendendo più semplice la vita a chi utilizza <strong>sedia a rotelle</strong>, <strong>passeggini</strong> o anche per caricare <strong>biciclette</strong> sull’auto.</p>',
        '<p>Realizzata in <strong>lega d’alluminio di elevata qualità</strong>, la rampa è leggera, resistente e duratura. La <strong>superficie antiscivolo in PVC</strong> e i bordi alti garantiscono la massima sicurezza durante l’utilizzo. La pedana è <strong>pieghevole</strong>, chiudibile come una valigia, e dotata di <strong>maniglia pratica</strong> per il trasporto a mano o in auto.</p>',
        '<h3><strong>Caratteristiche principali</strong></h3>',
        '<ul><li>Materiale: <strong>lega d’alluminio resistente e leggera</strong></li><li>Dimensioni: 91 cm x 73 cm</li><li>Peso: 7 kg</li><li>Carico massimo: 272 kg</li><li>Colori disponibili: argento e nero</li><li>Adatta per: sedie a rotelle, passeggini, biciclette</li></ul>',
        '<p>Questa pedana è ideale per chi necessita di una soluzione temporanea o per eventi, grazie al servizio di <strong>noleggio e affitto</strong>. La possibilità di piegarla e trasportarla facilmente la rende pratica sia per uso domestico che per spostamenti in auto.</p>',
        '<h4><strong>Vantaggi dell’affitto</strong></h4>',
        '<ul><li>Risparmio rispetto all’acquisto di pedane permanenti</li><li>Consegna rapida e immediata a Roma, Firenze e altre città</li><li>Adatta a uso quotidiano o occasionale</li><li>Sicurezza garantita grazie alla struttura robusta e ai bordi antiscivolo</li></ul>',
        '<p>Per completare l’esperienza utente, puoi inserire <strong>link interni</strong> a prodotti correlati:</p>',
        '<ul><li><a href="/catalogo-noleggio/">Sollevatori per bagno</a></li><li><a href="/catalogo-noleggio/">Carrozzine pieghevoli</a></li></ul>',
        '<p>E <strong>link esterni</strong> utili per informazioni e normative:</p>',
        '<ul><li><a href="https://www.normattiva.it/">Normative sull’accessibilità</a></li><li><a href="https://www.anci.it/">Linee guida rampe disabili</a></li></ul>',
        '<p>Grazie a queste caratteristiche, l’<strong>affitto rampe per le scale per disabili a noleggio</strong> rappresenta una soluzione pratica, sicura e immediatamente disponibile per chiunque abbia bisogno di superare gradini o caricare veicoli senza difficoltà. Prenota ora la tua rampa o pedana online e ricevi consegna rapida direttamente a casa o sul luogo desiderato.</p>',
      ].join(''),
    },
    en: {
      title: 'Ramp and threshold plate hire',
      slug: 'noleggio-rampa-pedana-per-disabili',
      shortDescription: 'Hire and rental of ramps or platforms for the disabled. Hire for 1 day: 15€ with pick-up on site only. Home delivery and collection only in Rome and Florence starting from €30. Picking up aids from the warehouse is free of charge.',
      metaTitle: 'Wheelchair ramp hire | Rome and Florence',
      metaDescription: 'Hire a folding aluminium ramp: 91 × 73 cm, 7 kg, rated to 272 kg. Non-slip PVC surface and a carry handle.',
      description: [
        '<p>La <strong>rental ramp or platform</strong> it is the ideal solution for those looking for <strong>handicapped stair ramps for hire</strong>. This ramp makes it possible to overcome steps and everyday obstacles in complete safety, making life easier for those who use <strong>wheelchair</strong>, <strong>prams</strong> or even to load <strong>bicycles</strong> in the car.</p>',
        '<p>Made of <strong>high-grade aluminium alloy</strong>, the ramp is lightweight, strong and durable. The <strong>non-slip PVC surface</strong> and the high edges guarantee maximum safety during use. The platform is <strong>foldable</strong>, which can be closed like a suitcase, and equipped with <strong>practical handle</strong> for hand or car transport.</p>',
        '<h3><strong>Main features</strong></h3>',
        '<ul><li>Material: <strong>strong, lightweight aluminium alloy</strong></li><li>Dimensions: 91 cm x 73 cm</li><li>Weight: 7 kg</li><li>Maximum load: 272 kg</li><li>Available colours: silver and black</li><li>Suitable for: wheelchairs, wheelchair, bicycles</li></ul>',
        '<p>This platform is ideal for those who need a temporary solution or for events, thanks to the service of <strong>rental and lease</strong>. The ability to fold it and carry it easily makes it practical for both home use and car journeys.</p>',
        '<h4><strong>Advantages of renting</strong></h4>',
        '<ul><li>Savings compared to purchasing permanent ramps</li><li>Fast and immediate delivery in Rome, Florence and other cities</li><li>Suitable for daily or occasional use</li><li>Guaranteed safety thanks to robust construction and non-slip edges</li></ul>',
        '<p>To complete the user experience, you can enter <strong>internal links</strong> to related products:</p>',
        '<ul><li><a href="/en/rental-catalog/">Bathroom lifts</a></li><li><a href="/en/rental-catalog/">Folding wheelchairs</a></li></ul>',
        '<p>E <strong>external links</strong> useful for information and regulations:</p>',
        '<ul><li><a href="https://www.normattiva.it/">Accessibility regulations</a></li><li><a href="https://www.anci.it/">Guidelines for disabled ramps</a></li></ul>',
        '<p>Thanks to these features, the’<strong>handicapped stair ramps for hire</strong> it represents a practical, safe and immediately available solution for anyone needing to overcome steps or load vehicles without difficulty. Book your ramp or platform online now and receive fast delivery directly to your home or desired location.</p>',
      ].join(''),
    },
  },

  specs: {
    'max-load': 272,
    weight: { min: 7, max: 7 },
    'total-width': { min: 73, max: 73 },
    'total-length': { min: 91, max: 91 },
    'frame-material': 'aluminium',
    foldable: true,
    colour: { it: 'Argento e nero', en: 'Silver and black' },
  },

  media: {
    thumbnail: { file: 'ramp-1.jpg', alt: { it: 'rampa per disabili' } },
    gallery: [
      'ramp-2.png',
      'ramp-3.jpg',
      'ramp-4.jpg',
      'ramp-5.jpg',
    ],
  },

  addons: [homeDelivery(30)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
