/**
 * Vendita Materassi antidecubito ad alto rischio — product_cat 532,
 * `vendita-materassi-antidecubito-ad-alto-rischio`, 4 products.
 *
 * Four mattresses spanning 59,00 € to 2.280,00 € — a preventive foam one, a
 * cheap air one with a compressor, and the two high-risk therapeutic ones.
 * Only the 898,00 € mattress (9030) carries an attribute table; it is the sole
 * source of the dimensions and the weight in this category.
 */
import { defineCategory } from '../../lib/define.ts';
import { loadAndWeight } from '../shared/specs.ts';
import { overallDimensions } from '../shared/specs-chassis.ts';
import { hasCompressor, pressureUlcerStage } from '../shared/specs-bed.ts';

export const pressureReliefMattressesSale = defineCategory({
  code: 'pressure-relief-mattresses-sale',
  position: 25,
  translations: {
    it: {
      name: 'Vendita Materassi antidecubito ad alto rischio',
      slug: 'vendita-materassi-antidecubito-ad-alto-rischio',
      description:
        'La vendita materassi antidecubito ad alto rischio di MIA Medical Italia offre soluzioni professionali per la prevenzione e il trattamento delle piaghe da decubito nei pazienti allettati o con mobilità molto ridotta.',
      metaTitle: 'Vendita Materassi Antidecubito ad Alto Rischio | MIA Medical Italia',
      metaDescription:
        'Vendita materassi antidecubito ad alto rischio per prevenzione e trattamento delle piaghe da decubito. Dispositivi professionali certificati.',
    },
    en: {
      name: 'High-risk pressure-relief mattresses for sale',
      slug: 'vendita-materassi-antidecubito-ad-alto-rischio',
      description:
        'MIA Medical Italia sells high-risk pressure-relief mattresses for preventing and treating pressure sores in patients confined to bed or with very little mobility. Certified professional devices.',
      metaTitle: 'High-risk pressure-relief mattresses for sale | MIA Medical Italia',
      metaDescription:
        'High-risk pressure-relief mattresses for sale, for preventing and treating pressure sores. Certified professional devices.',
    },
  },

  specs: {
    ...loadAndWeight,
    ...pressureUlcerStage,
    ...overallDimensions,
    ...hasCompressor,
  },
});
