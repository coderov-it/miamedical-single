/**
 * Vendita Verticalizzatori — product_cat 535, `vendita-verticalizzatori`,
 * 1 product.
 *
 * The Albatros 2, sold outright at 2.780,00 €. Its page states two things and
 * no measurements: that it folds in seconds, and that a charge is good for up
 * to 40 lifts.
 */
import { defineCategory } from '../../lib/define.ts';
import { loadAndWeight } from '../shared/specs.ts';
import { foldable } from '../shared/specs-chassis.ts';
import { includesSling, liftsPerCharge } from '../shared/specs-bed.ts';

export const standingFramesSale = defineCategory({
  code: 'standing-frames-sale',
  position: 33,
  translations: {
    it: {
      name: 'Vendita Verticalizzatori',
      slug: 'vendita-verticalizzatori',
      description:
        'L’acquisto di un verticalizzatore elettrico MIA Medical Italia rappresenta la soluzione ideale per assistere persone con ridotta mobilità nel passaggio dalla posizione seduta a quella eretta in totale sicurezza e con minimo sforzo per il caregiver.',
      metaTitle: 'Vendita Verticalizzatori Elettrici | MIA Medical Italia',
      metaDescription:
        'Vendita verticalizzatore elettrico Mia Medical: per anziani e disabili. Sicuro, ergonomico e consegna rapida a Roma e Firenze.',
    },
    en: {
      name: 'Standing hoists for sale',
      slug: 'vendita-verticalizzatori',
      description:
        'Buying an electric standing hoist from MIA Medical Italia is the way to bring someone with reduced mobility from sitting to standing safely, with very little effort from whoever is caring for them.',
      metaTitle: 'Electric standing hoists for sale | MIA Medical Italia',
      metaDescription:
        'Mia Medical electric standing hoists for sale, for older and disabled users. Safe, ergonomic, delivered quickly in Rome and Florence.',
    },
  },

  specs: { ...loadAndWeight, ...includesSling, ...liftsPerCharge, ...foldable },
});
