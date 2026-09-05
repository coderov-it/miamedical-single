/**
 * Tens / Elettrostimolatore — product_cat 275,
 * `noleggio-tens-elettrostimolatore-a-domicilio`, 3 products.
 *
 * The shop's own name, slash and all.
 *
 * ⚠️ Two of the three products (9455 and 12417) are the only ones in the whole
 * catalogue with a SECOND variation axis: WooCommerce makes buying an electrode
 * pack part of choosing a package, so a 10-day hire listed at 110 € actually
 * charges 118 € or 123 €. The packages here hold the hire price the label states
 * and the electrode packs are add-ons carrying the 8 € and 13 € difference, so
 * the total matches the site exactly. See `shared/addons.ts`.
 */
import { defineCategory } from '../../lib/define.ts';
import { powerSupply, treatmentTimer, warranty, weight, colour } from '../shared/specs.ts';
import { overallDimensions } from '../shared/specs-chassis.ts';
import { includedAccessories, channels, programmes, treatmentPressure, treatmentTemperature } from '../shared/specs-therapy.ts';

export const tensHire = defineCategory({
  code: 'tens-hire',
  position: 13,
  translations: {
    it: {
      name: 'Tens / Elettrostimolatore',
      slug: 'noleggio-tens-elettrostimolatore-a-domicilio',
      description:
        'Noleggio TENS elettrostimolatore professionale a domicilio, a partire da 3,50 € al giorno. Consegne rapide e prezzi convenienti.',
      metaTitle: 'Tens / Elettrostimolatore - Mia Medical Italia',
      metaDescription:
        'Affitto e noleggio della Tens elettrostimolatore a domicilio. Consegne rapide, prezzi molto convenienti. Chiamaci ora 3926509237 o prenota online.',
    },
    en: {
      name: 'Tens / Electrostimulator',
      slug: 'noleggio-tens-elettrostimolatore-a-domicilio',
      description:
        'Professional TENS stimulator hire for use at home, from €3.50 a day. Quick delivery at a fair price.',
      metaTitle: 'TENS stimulator hire | Mia Medical Italia',
      metaDescription:
        'TENS stimulator hire and rental for use at home. Quick delivery, very good prices. Call +39 392 650 9237 or book online.',
    },
  },

  specs: { ...includedAccessories, ...channels, ...programmes, ...treatmentPressure, ...treatmentTemperature, ...treatmentTimer, ...powerSupply, ...overallDimensions, ...weight, ...warranty, ...colour },
});
