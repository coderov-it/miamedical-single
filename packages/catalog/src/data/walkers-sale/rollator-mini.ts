/**
 * Vendita Rollator Pieghevole Mini
 *
 * /prodotto/rollator-pieghevole-mini-in-vendita/
 * WooCommerce product 14638, 141,00 €. The three figures below are stated inside
 * the page's selling points rather than in a table — "peso di soli 5,9 kg,
 * portata massima 100 kg" and a padded seat "31×31 cm, con schienale integrato".
 */

import { generalTerms } from '../shared/terms.ts';
import { walkersSale } from './category.ts';

export const rollatorMini = walkersSale.fixed({
  code: 'rollator-mini',
  status: 'active',

  pricingMode: 'fixed',
  basePrice: 141,

  translations: {
    it: {
      title: 'Vendita Rollator Pieghevole Mini',
      slug: 'rollator-pieghevole-mini-in-vendita',
      shortDescription: 'Rollator pieghevole MINI MINI con le sue dimensioni ridotte e design pieghevole, si adatta perfettamente agli spazi ristretti, in casa o in viaggio. Acquista ora! Spedizione gratuita in tutta l’Italia.',
      metaTitle: 'Rollator pieghevole Mini in vendita',
      metaDescription: 'Scopri il Rollator pieghevole MINI, l’ausilio compatto e leggero per la mobilità. Seduta imbottita, ruote piroettanti e pieghevole per trasporto semplice',
      description: [
        '<h3><strong>Rollator pieghevole MINI: compatto, leggero e pratico</strong></h3>',
        '<p>Cerchi un ausilio per la mobilità che sia leggero, maneggevole e facile da trasportare? Il <strong>Rollator pieghevole MINI</strong> è la soluzione ideale per chi desidera un supporto sicuro senza rinunciare alla compattezza. Grazie alle sue dimensioni ridotte e al design pieghevole, si adatta perfettamente agli spazi ristretti, in casa o in viaggio.</p>',
        '<h3><strong>Caratteristiche principali del Rollator pieghevole MINI</strong></h3>',
        '<ul><li><strong>Dimensioni compatte</strong>: lunghezza 64 cm, altezza regolabile 71-84 cm, larghezza 45 cm tra i manici e 54 cm tra le ruote.</li><li><strong>Leggero e resistente</strong>: peso di soli 5,9 kg, portata massima 100 kg.</li><li><strong>Seduta imbottita</strong>: comoda, 31×31 cm, con schienale integrato per pause confortevoli.</li><li><strong>Ruote da 15 cm</strong>: ruote anteriori piroettanti per agilità e posteriori fisse per stabilità, dotate di freni a doppia funzione.</li><li><strong>Impugnature ergonomiche</strong>: regolabili in altezza per adattarsi a qualsiasi utente.</li><li><strong>Pieghevole e trasportabile</strong>: facilmente chiudibile per riporlo in auto o in casa, dimensioni da piegato 55x25x85 cm.</li><li><strong>Pratico accessorio</strong>: fornito con borsa porta oggetti per trasportare effetti personali durante gli spostamenti.</li></ul>',
        '<h3><strong>A chi è indicato il Rollator pieghevole MINI?</strong></h3>',
        '<p>Il Rollator MINI è perfetto per:</p>',
        '<ul><li>Persone con difficoltà di deambulazione che necessitano di un supporto sicuro e compatto.</li><li>Anziani che desiderano un ausilio leggero da usare in casa o fuori.</li><li>Chi ha bisogno di un rollator facile da trasportare in auto o in viaggio.</li></ul>',
        '<h3><strong>Perché scegliere il Rollator pieghevole MINI di Mia Medical</strong></h3>',
        '<p>Acquistando il Rollator MINI da Mia Medical, ottieni:</p>',
        '<ul><li>Un prodotto certificato Classe I, sicuro e di alta qualità.</li><li>Consulenza personalizzata per individuare il modello più adatto alle tue esigenze.</li><li>Consegna rapida e assistenza post-vendita garantita.</li><li>Un ausilio MINI, compatto e sempre pronto all’uso, senza rinunciare a comfort e stabilità.</li></ul>',
        '<p>Acquista subito il <strong>Rollator pieghevole MINI</strong> e ritrova la libertà di muoverti in autonomia, in casa o fuori, con leggerezza e sicurezza.</p>',
        '<p><a href="/contatti/">Contattaci</a> telefonicamente per maggiori informazioni o per ricevere una consulenza gratuita sul Rollator MINI.</p>',
      ].join(''),
    },
    en: {
      title: 'Mini folding rollator for sale',
      slug: 'rollator-pieghevole-mini-in-vendita',
      shortDescription: 'MINI folding rollator. Small and folding, the MINI fits where space is tight, at home or travelling. Buy now! Free shipping across Italy.',
      metaTitle: 'Mini folding rollator for sale',
      metaDescription: 'Meet the MINI folding rollator: compact, light, a padded seat, castoring wheels, and it folds for easy carrying.',
      description: [
        '<h3><strong>Folding rollator MINI: compact, lightweight and practical</strong></h3>',
        '<p>Are you looking for a mobility aid that is light, handy and easy to carry? The <strong>Folding rollator MINI</strong> is the ideal solution for those who want secure support without sacrificing compactness. Thanks to its small size and foldable design, it fits perfectly in tight spaces, at home or on the move.</p>',
        '<h3><strong>Main features of the Folding Rollator MINI</strong></h3>',
        '<ul><li><strong>Compact dimensions</strong>length 64 cm, adjustable height 71-84 cm, width 45 cm between handles and 54 cm between wheels.</li><li><strong>Lightweight and resistant</strong>weight of only 5.9 kg, maximum load capacity 100 kg.</li><li><strong>Upholstered seat</strong>Comfortable, 31×31 cm, with integrated backrest for comfortable breaks.</li><li><strong>15 cm wheels</strong>: front swivel wheels for agility and fixed rear wheels for stability, equipped with dual-function brakes.</li><li><strong>Ergonomic handles</strong>height adjustable to suit any user.</li><li><strong>Foldable and transportable</strong>Easily foldable for storage in the car or at home, dimensions when folded 55x25x85 cm.</li><li><strong>Practical accessory</strong>Supplied with a carry bag for transporting personal belongings when travelling.</li></ul>',
        '<h3><strong>Who is the Folding Rollator MINI suitable for?</strong></h3>',
        '<p>The Rollator MINI is perfect for:</p>',
        '<ul><li>People with walking difficulties who need a safe and compact support.</li><li>Elderly people who want a lightweight aid for use at home or outside.</li><li>Who needs a rollator that is easy to transport in the car or on the road.</li></ul>',
        '<h3><strong>Why choose the Folding Rollator MINI from Mia Medical</strong></h3>',
        '<p>When you buy the Rollator MINI from Mia Medical, you get:</p>',
        '<ul><li>A Class I certified, safe and high quality product.</li><li>Personalised advice to identify the model best suited to your needs.</li><li>Quick delivery and guaranteed after-sales service.</li><li>A MINI aid, compact and always ready to use, without sacrificing comfort and stability.</li></ul>',
        '<p>Buy the <strong>Folding rollator MINI</strong> and rediscover the freedom to move independently, indoors or out, lightly and safely.</p>',
        '<p><a href="/en/contatti/">Contact us</a> telephone for more information or to receive a free consultation on the Rollator MINI.</p>',
      ].join(''),
    },
  },

  specs: {
    'max-load': 100,
    weight: { min: 5.9, max: 5.9 },
    'has-seat': true,
    'reclining-backrest': false,
    upholstery: { it: 'Seduta imbottita 31 × 31 cm con schienale integrato', en: 'Padded 31 × 31 cm seat with an integrated backrest' },
    foldable: true,
  },

  media: {
    thumbnail: 'rollator-mini-1.png',
  },
  terms: [generalTerms],
});
