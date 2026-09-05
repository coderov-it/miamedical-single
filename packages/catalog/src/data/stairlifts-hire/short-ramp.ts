/**
 * Noleggio rampa e pedane corta per disabili
 *
 * /prodotto/noleggio-rampa-e-pedane-corta-per-disabili/
 * WooCommerce product 12361.
 *
 * ⚠️ Its page prints the SAME three figures as the long ramp (8988) — 91 × 73 cm,
 * 7 kg, 272 kg — although one is sold as the short version and the other is not.
 * The copy is duplicated on the live site; both are recorded as they stand and the
 * duplication is in docs/catalog/README.md.
 */

import { days } from '../shared/packages.ts';
import { generalTerms } from '../shared/terms.ts';
import { hireIntake } from '../shared/questions.ts';
import { homeDelivery } from '../shared/addons.ts';
import { stairliftsHire } from './category.ts';

export const shortRamp = stairliftsHire.rental({
  code: 'short-ramp',
  status: 'active',

  pricingMode: 'rental',
  rentalUnit: 'day',
  packages: [
    days(3, 25),
    days(7, 30),
    days(15, 35),
    days(30, 50),
    days(45, 65),
    days(60, 80),
    days(90, 100),
  ],

  translations: {
    it: {
      title: 'Noleggio rampa e pedane corta per disabili',
      slug: 'noleggio-rampa-e-pedane-corta-per-disabili',
      shortDescription: 'Noleggio rampa o pedana per disabili Consegna e ritiro a domicilio solo a Roma e Firenze a partire da 30€. Noleggio per 1 giorno: 15€ con ritiro solamente in sede. Il ritiro degli ausili in magazzino è gratuito.',
      metaTitle: 'Affitto rampe per le scale per disabili a noleggio.',
      metaDescription: 'Noleggio rampe per le scale per disabili: pedane leggere, antiscivolo, ideali per sedie a rotelle, passeggini o biciclette. Prenota ora!',
      description: [
        '<p>La <strong>rampa o pedana a noleggio</strong> è la soluzione ideale per chi cerca <strong>affitto rampe per le scale per disabili a noleggio</strong> in sicurezza e con la massima praticità. Realizzata in <strong>lega di alluminio di elevata qualità</strong>, questa pedana garantisce leggerezza, resistenza e lunga durata nel tempo. La superficie è rivestita in <strong>PVC antiscivolo</strong>, mentre i bordi alti assicurano stabilità e sicurezza durante l’utilizzo.</p>',
        '<p>Questa ampia rampa è perfetta per consentire a chi utilizza <strong>sedia a rotelle</strong> di salire gradini o entrare in auto senza sforzo. Grazie al suo design versatile, la pedana si adatta anche al carico di <strong>passeggini o biciclette</strong>, rendendo il trasporto facile e sicuro. Una pratica <strong>maniglia in plastica</strong> permette di trasportare la rampa comodamente ovunque serva.</p>',
        '<h3><strong>Caratteristiche principali:</strong></h3>',
        '<ul><li><strong>Materiale:</strong> lega d’alluminio resistente e leggera</li><li><strong>Dimensioni:</strong> 91 cm x 73 cm</li><li><strong>Peso:</strong> 7 kg</li><li><strong>Carico massimo supportato:</strong> 272 kg</li><li><strong>Colori disponibili:</strong> argento e nero</li></ul>',
        '<p>Questa rampa è disponibile a <strong>noleggio immediato</strong> e consente di risolvere facilmente le difficoltà di accesso a scale o veicoli senza dover acquistare una pedana permanente. L’<strong>affitto rampe per le scale per disabili a noleggio</strong> è ideale per uso temporaneo, eventi o esigenze personali momentanee.</p>',
        '<p>Per migliorare l’esperienza utente, puoi inserire <strong>link interni</strong> verso altre soluzioni per la mobilità, ad esempio:</p>',
        '<ul><li><a href="/catalogo-noleggio/">Sollevatori per bagno</a></li><li><a href="/catalogo-noleggio/">Carrozzine pieghevoli</a></li></ul>',
        '<p>E <strong>link esterni</strong> utili per approfondire:</p>',
        '<ul><li><a href="https://www.normattiva.it/">Normative sull’accessibilità</a></li><li><a href="https://www.anci.it/">Linee guida per rampe disabili</a></li></ul>',
        '<p>Grazie alla combinazione di <strong>leggerezza, sicurezza e facilità di trasporto</strong>, la nostra pedana è perfetta per chi cerca <strong>affitto rampe per le scale per disabili a noleggio</strong> a Roma, Firenze e altre città italiane. Prenota subito online e ricevi la rampa direttamente a casa o sul luogo desiderato.</p>',
      ].join(''),
    },
    en: {
      title: 'Short ramp and threshold plate hire',
      slug: 'noleggio-rampa-e-pedane-corta-per-disabili',
      shortDescription: 'Rental of a ramp or platform for the disabled Home delivery and collection only in Rome and Florence starting from €30. Hire for 1 day: 15€ with pick-up on site only. Picking up aids from the warehouse is free of charge.',
      metaTitle: 'Disabled stair ramps for hire',
      metaDescription: 'Stair ramp hire for disabled users: light, non-slip plates, right for wheelchairs, pushchairs or bicycles.',
      description: [
        '<p>La <strong>rental ramp or platform</strong> it is the ideal solution for those looking for <strong>handicapped stair ramps for hire</strong> safely and with maximum practicality. Made of <strong>high-grade aluminium alloy</strong>, this platform guarantees lightness, strength and long-lasting durability. The surface is coated in <strong>Non-slip PVC</strong>, whilst the high edges ensure stability and safety during use.</p>',
        '<p>This wide ramp is perfect for allowing those who use <strong>wheelchair</strong> to climb steps or enter a car effortlessly. Thanks to its versatile design, the platform also fits the load of <strong>buggies or bicycles</strong>, making transport easy and safe. A practical <strong>plastic handle</strong> allows the ramp to be conveniently transported wherever it is needed.</p>',
        '<h3><strong>Main features:</strong></h3>',
        '<ul><li><strong>Material:</strong> strong, lightweight aluminium alloy</li><li><strong>Dimensions:</strong> 91 cm x 73 cm</li><li><strong>Weight:</strong> 7 kg</li><li><strong>Maximum load supported:</strong> 272 kg</li><li><strong>Available colours:</strong> silver and black</li></ul>',
        '<p>This ramp is available at <strong>immediate hire</strong> and makes it easy to resolve difficulties in accessing stairs or vehicles without having to purchase a permanent ramp.’<strong>handicapped stair ramps for hire</strong> It is ideal for temporary use, events or momentary personal needs.</p>',
        '<p>To improve the user experience, you can insert <strong>internal links</strong> towards other mobility solutions, for example:</p>',
        '<ul><li><a href="/en/rental-catalog/">Bathroom lifts</a></li><li><a href="/en/rental-catalog/">Folding wheelchairs</a></li></ul>',
        '<p>E <strong>external links</strong> useful for further study:</p>',
        '<ul><li><a href="https://www.normattiva.it/">Accessibility regulations</a></li><li><a href="https://www.anci.it/">Guidelines for disabled ramps</a></li></ul>',
        '<p>Thanks to the combination of <strong>lightness, safety and portability</strong>, our exercise mat is perfect for anyone looking for <strong>handicapped stair ramps for hire</strong> in Rome, Florence and other Italian cities. Book online now and get the ramp delivered directly to your home or desired location.</p>',
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
    thumbnail: 'short-ramp-1.jpg',
    gallery: [
      'short-ramp-2.png',
      'short-ramp-3.jpg',
      'short-ramp-4.jpg',
    ],
  },

  addons: [homeDelivery(30)],

  questions: [...hireIntake],
  terms: [generalTerms],
});
