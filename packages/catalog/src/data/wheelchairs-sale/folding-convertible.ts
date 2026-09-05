/**
 * Vendita Carrozzina pieghevole da transito o da autospinta
 *
 * /prodotto/vendita-carrozzina-pieghevole/  ·  WooCommerce product 9051, 279,00 €.
 *
 * `propulsion: convertible` is not a hedge — the page sells the chair as usable
 * both ways: "Uso con accompagnatore (transito)" and "Uso autonomo (autospinta)".
 * Four seat sizes are listed (41, 43, 46 and 50 cm), recorded as the span they
 * cover.
 *
 * It also carries a WooCommerce attribute table, which is where the rest come
 * from:
 *
 *   Depth sitting  40 cm    Width  56 cm    Maximum depth  105 cm
 *   Weight  18 Kg           Maximum capacity  150 Kg
 */

import { generalTerms } from '../shared/terms.ts';
import { wheelchairsSale } from './category.ts';

export const foldingConvertible = wheelchairsSale.fixed({
  code: 'folding-convertible',
  status: 'active',

  pricingMode: 'fixed',
  basePrice: 279,

  translations: {
    it: {
      title: 'Vendita Carrozzina pieghevole da transito o da autospinta',
      slug: 'vendita-carrozzina-pieghevole',
      shortDescription: 'CarrozzinA di transito e da autospinta Consegna gratuita. Disponibilitàm immediata Prenota subito!',
      metaTitle: 'Vendita carrozzina da transito o da autospinta',
      metaDescription: 'Vendita Carrozzina da transito e da autospinta per anziani con seduta imbottita. Consegna a domicilio chiama al 3926509237 o prenota online!',
      description: [
        '<p><strong>Vendita carrozzina da transito o da autospinta.</strong> Questa carrozzina pieghevole è progettata per offrire una soluzione pratica e versatile alla mobilità di persone anziane o con ridotta capacità motoria. Il modello è utilizzabile sia come carrozzina da transito, sia come carrozzina da autospinta, a seconda delle esigenze dell’utente e del contesto di utilizzo.</p>',
        '<p>La struttura è realizzata in acciaio verniciato, robusta e resistente all’uso quotidiano. È dotata di quattro ruote piene, pensate per garantire stabilità e ridurre la manutenzione, rendendola adatta sia per ambienti interni che per spostamenti all’esterno su superfici urbane.</p>',
        '<h2>Utilizzo</h2>',
        '<p><strong>Vendita carrozzina da transito o da autospinta.</strong><br />La carrozzina può essere impiegata in due modalità:</p>',
        '<ul><li><strong>Uso con accompagnatore (transito):</strong> consente lo spostamento dell’utente con l’assistenza di una terza persona, risultando particolarmente maneggevole negli spazi interni e domestici.</li><li><strong>Uso autonomo (autospinta):</strong> permette all’utente di muoversi in autonomia grazie alle ruote posteriori predisposte per la spinta diretta.</li></ul>',
        '<h2>Caratteristiche principali carrozzina pieghevole da transito e autospinta</h2>',
        '<ul><li>Telaio in acciaio verniciato</li><li>Struttura pieghevole per facilitare trasporto e stoccaggio</li><li>Quattro ruote piene per maggiore stabilità e minore manutenzione</li><li>Seduta imbottita per un comfort prolungato</li><li>Utilizzo sia interno che esterno</li></ul>',
        '<h2>Misure disponibili della seduta</h2>',
        '<ul><li>41 cm</li><li>43 cm</li><li>46 cm</li><li>50 cm</li></ul>',
        '<h2>Informazioni di vendita carrozzina da transito e autospinta</h2>',
        '<p>La carrozzina è disponibile per la vendita con possibilità di consegna a domicilio. È possibile effettuare l’ordine o richiedere informazioni chiamando il numero 392 650 9237 oppure prenotando direttamente online.</p>',
        '<p>Per vedere tutto il catalogo di Carozzine in vendita MiaMedical clicca <a href="/catalogo-vendita/">qui.</a></p>',
        '<h2>Link utili</h2>',
        '<p>Per maggiori informazioni sugli ausili per la mobilità e l’assistenza alle persone con disabilità è possibile consultare il portale del <a href="https://www.salute.gov.it/new/">Ministero della Salute.</a></p>',
      ].join(''),
    },
    en: {
      title: 'Folding transit or self-propelled wheelchair for sale',
      slug: 'vendita-carrozzina-pieghevole',
      shortDescription: 'Transit and self-propelled wheelchair. Free delivery. Available immediately. Order now!',
      metaTitle: 'Transit or self-propelled wheelchair for sale',
      metaDescription: 'Buy a folding wheelchair usable as a transit or a self-propelled chair: painted steel frame, four solid wheels, seats from 41 to 50 cm.',
      description: [
        '<p><strong>Transit or self-propelled wheelchair for sale.</strong> This folding wheelchair is designed to offer a practical and versatile mobility solution for elderly people or those with reduced mobility. The model can be used both as a transit wheelchair and as a self-propelled wheelchair, depending on the user\'s needs and the context of use.</p>',
        '<p>The structure is made of painted steel, robust and resistant to daily use. It is equipped with four solid wheels, designed to guarantee stability and reduce maintenance, making it suitable both for indoor environments and for outdoor movement on urban surfaces.</p>',
        '<h2>Use</h2>',
        '<p><strong>Transit or self-propelled wheelchair for sale.</strong><br />The wheelchair can be used in two modes:</p>',
        '<ul><li><strong>Accompanied use (transit):</strong> it allows the user to be moved with the assistance of a third person, making it particularly easy to handle in indoor and home environments.</li><li><strong>Autonomous use (self-propelled):</strong> allows the user to move independently thanks to the rear wheels designed for direct push.</li></ul>',
        '<h2>Key features folding transit and self-propelled wheelchair</h2>',
        '<ul><li>Painted steel frame</li><li>Foldable frame for easy transport and storage</li><li>Four full wheels for greater stability and less maintenance</li><li>Padded seat for prolonged comfort</li><li>Indoor and outdoor use</li></ul>',
        '<h2>Available seat sizes</h2>',
        '<ul><li>41 cm</li><li>43 cm</li><li>46 cm</li><li>50 cm</li></ul>',
        '<h2>Sales information transit and self-propelled wheelchair</h2>',
        '<p>The wheelchair is available for purchase with the option of home delivery. You can place an order or request information by calling 392 650 9237 or by booking directly online.</p>',
        '<p>To see the entire MiaMedical catalogue for sale click <a href="/en/sale-catalog/">here.</a></p>',
        '<h2>Useful links</h2>',
        '<p>For further information on mobility aids and assistance for people with disabilities, you can consult the portal of <a href="https://www.salute.gov.it/new/">Ministry of Health.</a></p>',
      ].join(''),
    },
  },

  specs: {
    propulsion: 'convertible',
    'max-load': 150,
    weight: { min: 18, max: 18 },
    'seat-width': { min: 41, max: 50 },
    'seat-depth': { min: 40, max: 40 },
    'total-width': { min: 56, max: 56 },
    'total-length': { min: 105, max: 105 },
    'frame-material': 'painted-steel',
    upholstery: { it: 'Seduta imbottita', en: 'Padded seat' },
    'wheel-type': 'solid',
    foldable: true,
  },

  media: {
    thumbnail: { file: 'folding-convertible-1.jpg', alt: { it: 'Carrozzina da transito o da autospinta' } },
    gallery: [
      { file: 'folding-convertible-2.jpg', alt: { it: 'Noleggio ausili per terapia a domicilio' } },
      'folding-convertible-3.jpg',
    ],
  },
  terms: [generalTerms],
});
