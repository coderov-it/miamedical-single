/**
 * Vendita Accessori Per Anziani e Disabili — product_cat 538,
 * `vendita-accessori-per-anziani-e-disabili`, 3 products.
 *
 * The cheapest things the shop sells: a pressure-relief cushion at 35,00 €, a
 * toilet riser at 38,00 € and a padded commode chair at 195,00 €.
 *
 * Two of the three carry attribute tables, and they are the source for every
 * figure. The cushion carries none — its page states only that it comes with or
 * without a central hole.
 */
import { defineCategory } from '../../lib/define.ts';
import { colour, loadAndWeight, upholstery } from '../shared/specs.ts';
import { adjustableHeight, overallDimensions } from '../shared/specs-chassis.ts';
import { dismountable, seatDimensions } from '../shared/specs-seating.ts';

export const accessoriesSale = defineCategory({
  code: 'accessories-sale',
  position: 16,
  translations: {
    it: {
      name: 'Vendita Accessori Per Anziani e Disabili',
      slug: 'vendita-accessori-per-anziani-e-disabili',
      description:
        'La vendita accessori per anziani e disabili di MIA Medical Italia offre soluzioni pratiche e sicure per migliorare comfort, autonomia e sicurezza nella vita quotidiana. Tra i nostri prodotti più richiesti ci sono il rialzo per WC e il cuscino antidecubito in fibra cava siliconata, ideali sia per l’uso domestico che per strutture sanitarie, RSA e case di riposo.',
      metaTitle: 'Vendita Accessori per Anziani e Disabili | Mia Medical',
      metaDescription:
        'Acquista accessori per anziani e disabili: rialzo WC per maggiore autonomia e cuscino antidecubito per comfort e sicurezza. Consegna rapida a domicilio.',
    },
    en: {
      name: 'Sale of Accessories for the Elderly and Disabled',
      slug: 'vendita-accessori-per-anziani-e-disabili',
      description:
        'MIA Medical Italia’s accessories for older and disabled people are the small practical things that make a day easier and safer. The two most asked for are the toilet riser and the siliconised hollow-fibre pressure-relief cushion, which suit a home as well as a care home or nursing home.',
      metaTitle: 'Accessories for older and disabled people | Mia Medical',
      metaDescription:
        'Buy accessories for older and disabled people: a toilet riser for independence and a pressure-relief cushion for comfort and safety. Quick delivery.',
    },
  },

  specs: { ...loadAndWeight, ...overallDimensions, ...adjustableHeight, ...seatDimensions, ...upholstery, ...colour, ...dismountable },
});
