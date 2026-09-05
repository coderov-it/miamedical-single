/**
 * Vendita Carrozzina Elettrica Pieghevole Fantastica Power Smart Mia
 *
 * /prodotto/vendita-carrozzina-elettrica-pieghevole-fantastica-mia-medical/
 * WooCommerce product 8801, 1.890,00 €, and out of stock — see the note on the
 * category.
 *
 * Its attribute table is the source for the seat, the speed, the range and the
 * weight:
 *
 *   Seat width  43 cm      Depth sitting  43 cm
 *   Full speed  10 km/h    Battery autonomy  20 Km
 *   Weight without batteries  32 kg
 *   Maximum capacity  130 Kg | 150 Kg
 *
 * The capacity row holds two values. 130 kg is recorded — the lower, because a
 * load limit is a safety figure — and the ambiguity is in
 * docs/catalog/README.md.
 */

import { generalTerms } from '../shared/terms.ts';
import { electricWheelchairsSale } from './category.ts';

export const fantasticaPowerSmart = electricWheelchairsSale.fixed({
  code: 'fantastica-power-smart',
  status: 'active',
  stock: 0,

  pricingMode: 'fixed',
  basePrice: 1890,

  translations: {
    it: {
      title: 'Vendita Carrozzina Elettrica Pieghevole Fantastica Power Smart Mia',
      slug: 'vendita-carrozzina-elettrica-pieghevole-fantastica-mia-medical',
      shortDescription: 'Carrozzina elettrica fantastica Per uso interno ed esterno. Disponibilità terminata, guardare le categorie Occasione usato oppure nel noleggio. Guarda nei noleggi: Noleggio carrozzine elettriche Guarda negli usati: Noleggio carrozzine elettriche',
      metaTitle: 'Vendita carrozzina elettrica pieghevole FANTASTICA Mia Medical',
      metaDescription: 'Vendita carrozzina elettrica pieghevole FANTASTICA. Uso facile per interni ed esterni. Anche per spazi piccoli. Chiama al 3926509237 o prenota online!',
      description: [
        '<p><strong>Disponibilità TERMINATA!</strong> Ti consigliamo di guardare i nostri usati in occasione cliccando <a href="/catalogo-noleggio/">qui</a>!</p>',
        '<p>Carrozzina elettrica fantastica, per uso interno ed esterno, di dimensioni ridotte, per ingombri piccoli . Maneggevole, con chiusura a libretto. Joystick posizionabile a sinistra o destra. La batteria è estraibile facilmente. Il peso della carrozzina senza la batteria è di 16kg soltanto !!! </p>',
        '<p>Disponibilità di misure più grande, e portata fino a 150kg.</p>',
      ].join(''),
    },
    en: {
      title: 'Fantastica Power Smart folding electric wheelchair, for sale',
      slug: 'vendita-carrozzina-elettrica-pieghevole-fantastica-mia-medical',
      shortDescription: 'Fantastic electric wheelchair For indoor and outdoor use. Availability ended, check the used bargain or rental categories. Look in the rentals: Electric wheelchair hire Look in used cars: Electric wheelchair hire',
      metaTitle: 'FANTASTICA folding electric wheelchair for sale | Mia Medical',
      metaDescription: 'FANTASTICA folding electric wheelchair for sale. Easy indoors and out, and it fits small spaces. Call +39 392 650 9237',
      description: [
        '<p><strong>Availability ENDED!</strong> We recommend you take a look at our used items on special offer by clicking <a href="/en/rental-catalog/">here</a>!</p>',
        '<p>Fantastic electric wheelchair, for indoor and outdoor use, compact size, takes up little space. Easy to manoeuvre, with folding mechanism. Joystick can be positioned on the left or right. The battery is easily removable. The weight of the wheelchair without the battery is only 16 kg! </p>',
        '<p>Larger sizes available, with a load capacity of up to 150 kg.</p>',
      ].join(''),
    },
  },

  specs: {
    propulsion: 'electric',
    'indoor-outdoor': 'both',
    'max-load': 130,
    weight: { min: 32, max: 32 },
    'max-speed': 10,
    'battery-range': { min: 20, max: 20 },
    'seat-width': { min: 43, max: 43 },
    foldable: true,
  },

  media: {
    thumbnail: 'fantastica-power-smart-1.jpg',
    gallery: [
      'fantastica-power-smart-2.jpg',
      'fantastica-power-smart-3.jpg',
    ],
  },
  terms: [generalTerms],
});
