/**
 * Vendita carrozzina usata modello "Fantastica" 1
 *
 * /prodotto/vendita-carrozzina-usata-modello-fantastica-1/
 * WooCommerce product 14363, 539,00 €. Out of stock on the live site.
 *
 * Its page says 16 kg without the battery where its sibling 14371 says 18 kg —
 * the same disagreement the new Fantastica's own page carries. Each product
 * records what its own page states.
 */

import { generalTerms } from '../shared/terms.ts';
import { usedDealsSale } from './category.ts';

export const usedFantastica1 = usedDealsSale.fixed({
  code: 'used-fantastica-1',
  status: 'active',
  stock: 0,

  pricingMode: 'fixed',
  basePrice: 539,

  translations: {
    it: {
      title: 'Vendita carrozzina usata modello “Fantastica” 1',
      slug: 'vendita-carrozzina-usata-modello-fantastica-1',
      shortDescription: 'Carrozzina elettrica fantastica Compatta e pieghevole per uso interno ed esterno. Solo 16 kg senza batteria, facile da trasportare. Maneggevole, con chiusura a libretto e joystick ambidestro. La batteria è estraibile per una ricarica pratica e veloce',
      metaTitle: 'Vendita carrozzina usata modello "Fantastica" 1 - Mia Medical Italia',
      metaDescription: 'Carrozzina usata modello fantastica in vendita. Disponibilità immediata. Consegna rapida 24/48h. Il miglior rapporto qualità prezzo sul mercato! Chiama ora.',
      description: [
        '<p>La carrozzina elettrica <strong>Fantastica</strong> è pensata per uso interno ed esterno. <br />Ha dimensioni ridotte, per ingombri piccoli.<br />Maneggevole e con chiusura a libretto. <br />Joystick posizionabile a sinistra o destra. <br />La batteria è estraibile facilmente. <br />Il peso della carrozzina senza la batteria è di soli 16kg !!! </p>',
        '<p>Portata fino a 130kg.</p>',
        '<p><strong>Vendita carrozzina usata modello Fantastica: perchè sceglierla<br /></strong><br />Disporre di una carrozzina elettrica pieghevole come la <strong>Fantastica Power Smart Mia</strong> semplifica significativamente la routine quotidiana: perfetta sia per l’uso interno che esterno, questa carrozzina combina praticità, sicurezza e portabilità senza compromessi.</p>',
        '<p>Grazie al meccanismo di <strong>chiusura a libretto</strong>, puoi richiuderla rapidamente e riporla in spazi ridotti quando non serve, ideale per l’abitazione, l’ufficio o il viaggio.</p>',
        '<p>Grazie al design <strong>ultra-compatto e leggero</strong> (solo 16 kg senza batteria), si muove agevolmente anche in spazi ristretti, offrendo un’autonomia che si adatta alle esigenze reali di chi la utilizza.</p>',
        '<p>Il <strong>joystick ambidestro</strong>, posizionabile a sinistra o a destra, garantisce un controllo intuitivo e personalizzabile, per un’esperienza più sicura e confortevole.</p>',
        '<p>Questa carrozzina è l’alleato perfetto per chi cerca un ausilio mobile che unisca:</p>',
        '<ul><li><strong>Versatilità d’uso</strong>: si adatta all’interno come all’esterno, rispondendo alla quotidianità senza limiti.</li><li><strong>Facilità e sicurezza</strong>: design pensato per essere intuitivo, stabile e affidabile.</li><li><strong>Portabilità immediata</strong>: costi contenuti, peso ridotto e struttura pieghevole per essere sempre pronta, ovunque.</li></ul>',
        '<p>Scopri di più sui nostri ausili usati nel nostro <a href="/vendita-ausili-rigenerati-carrozzine-elettriche-rollator-scooter-per-mobilita/">articolo</a>!</p>',
      ].join(''),
    },
    en: {
      title: 'Used "Fantastica" wheelchair 1, for sale',
      slug: 'vendita-carrozzina-usata-modello-fantastica-1',
      shortDescription: 'Fantastic electric wheelchair Compact and foldable for indoor and outdoor use. Only 16 kg without battery, easy to transport. Handy, with booklet closure and ambidextrous joystick. The battery is removable for quick and convenient charging',
      metaTitle: 'Used "Fantastica" wheelchair 1 for sale - Mia Medical Italia',
      metaDescription: 'Used Fantastica wheelchair for sale. Available immediately, delivered in 24–48 hours. The best quality for the money.',
      description: [
        '<p>The electric wheelchair <strong>Fantastic</strong> is designed for indoor and outdoor use. <br />It has small dimensions for small footprints.<br />Handy and with booklet closure. <br />Joystick can be positioned to the left or right. <br />The battery is easily removable. <br />The weight of the wheelchair without the battery is only 16kg !!! </p>',
        '<p>Load capacity up to 130kg.</p>',
        '<p><strong>Used wheelchair model Fantastica for sale: why choose it<br /></strong><br />Having a folding electric wheelchair such as the <strong>Fantastic Power Smart Mia</strong> significantly simplifies the daily routine: perfect for both indoor and outdoor use, this wheelchair combines practicality, safety and portability without compromise.</p>',
        '<p>Thanks to the <strong>booklet closure</strong>, you can quickly fold it up and store it in small spaces when not needed, ideal for home, office or travel.</p>',
        '<p>Thanks to the design <strong>ultra-compact and lightweight</strong> (only 16 kg without battery), it moves easily even in tight spaces, offering a range that adapts to the real needs of its users.</p>',
        '<p>The <strong>ambidextrous joystick</strong>, which can be positioned to the left or right, provides intuitive and customisable control for a safer and more comfortable experience.</p>',
        '<p>This wheelchair is the perfect ally for anyone looking for a mobile aid that combines:</p>',
        '<ul><li><strong>Versatility of use</strong>It adapts indoors as well as outdoors, responding to everyday life without limits.</li><li><strong>Ease and safety</strong>design to be intuitive, stable and reliable.</li><li><strong>Immediate portability</strong>low cost, low weight and foldable structure to be always ready, anywhere.</li></ul>',
        '<p>Find out more about our used aids in our <a href="/en/vendita-ausili-rigenerati-carrozzine-elettriche-rollator-scooter-per-mobilita/">article</a>!</p>',
      ].join(''),
    },
  },

  specs: {
    condition: 'used',
    propulsion: 'electric',
    'max-load': 130,
    weight: { min: 16, max: 16 },
    battery: { it: 'Litio, estraibile', en: 'Lithium, removable' },
    controls: { it: 'Joystick ambidestro', en: 'Joystick, mountable left or right' },
    foldable: true,
  },

  media: {
    thumbnail: 'used-fantastica-1-1.png',
    gallery: [
      'used-fantastica-1-2.jpg',
      'used-fantastica-1-3.jpg',
      'used-fantastica-1-4.jpg',
      'used-fantastica-1-5.jpg',
      'used-fantastica-1-6.png',
      'used-fantastica-1-7.jpg',
    ],
  },
  terms: [generalTerms],
});
