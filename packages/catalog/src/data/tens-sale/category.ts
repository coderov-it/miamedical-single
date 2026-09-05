/**
 * Vendita TENS/Elettrostimolatore — product_cat 542,
 * `vendita-tens-elettrostimolatore`, 1 product.
 *
 * ⚠️ The category description says "Acquista subito a partire da € 249" while its
 * one product is priced at 379,00 €. Carried as written; noted in
 * docs/catalog/README.md.
 */
import { defineCategory } from '../../lib/define.ts';
import { powerSupply, treatmentTimer, warranty, weight, colour } from '../shared/specs.ts';
import { overallDimensions } from '../shared/specs-chassis.ts';
import { includedAccessories, channels, programmes, treatmentPressure, treatmentTemperature } from '../shared/specs-therapy.ts';

export const tensSale = defineCategory({
  code: 'tens-sale',
  position: 31,
  translations: {
    it: {
      name: 'Vendita TENS/Elettrostimolatore',
      slug: 'vendita-tens-elettrostimolatore',
      description:
        'Vendita TENS elettrostimolatore professionale. Acquista subito a partire da € 249.',
      metaTitle: 'Vendita Elettrostimolatore TENS Professionale | Mia Medical Italia',
      metaDescription:
        'Acquista elettrostimolatori TENS professionali GLOBUS Premium 400. Spedizione rapida in tutta Italia e supporto dedicato all\'uso.',
    },
    en: {
      name: 'Sale TENS/Electrostimulator',
      slug: 'vendita-tens-elettrostimolatore',
      description:
        'Professional TENS stimulators for sale, from €249.',
      metaTitle: 'Professional TENS stimulators for sale | Mia Medical Italia',
      metaDescription:
        'Buy GLOBUS Premium 400 professional TENS stimulators. Fast shipping across Italy and dedicated support on how to use them.',
    },
  },

  specs: { ...includedAccessories, ...channels, ...programmes, ...treatmentPressure, ...treatmentTemperature, ...treatmentTimer, ...powerSupply, ...overallDimensions, ...weight, ...warranty, ...colour },
});
