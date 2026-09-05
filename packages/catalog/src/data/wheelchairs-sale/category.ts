/**
 * Vendita Carrozzine — product_cat 539, `vendita-carrozzine`, 7 products.
 *
 * The shop's own name, kept as it stands. The taxonomy here is FLAT and
 * mirrors the site's leaf terms, so the hire chairs and the sale chairs are two
 * categories and not one: "Carrozzine" (68) and "Vendita Carrozzine" (539) are
 * what the site publishes, and every product below is `pricingMode: 'fixed'`.
 *
 * Six of the seven are the same chairs `wheelchairs-hire` lists, sold outright
 * instead of hired — the SLIM pair, the folding self-propelled, the reclining,
 * the bariatric and the Bobby (as the EVO). They are separate products because
 * the site publishes them as separate products, with their own pages, their own
 * slugs and their own Yoast meta.
 *
 * The spec set is the same shared vocabulary the hire category draws on,
 * narrowed to what these seven pages actually state: no folded width and no
 * seat height, because the sale pages do not print them. One page — the
 * convertible chair (9051) — does carry a full WooCommerce attribute table,
 * which is where the seat depth and the overall dimensions come from.
 */
import { defineCategory } from '../../lib/define.ts';
import { frameMaterial, loadAndWeight, upholstery } from '../shared/specs.ts';
import {
  antiTipWheels,
  brakes,
  foldable,
  foldingBackrest,
  frontWheels,
  overallDimensions,
  rearWheels,
  wheelType,
} from '../shared/specs-chassis.ts';
import { propulsion } from '../shared/specs-mobility.ts';
import {
  elevatingLegrests,
  headrest,
  recliningBackrest,
  removableArmrests,
  removableFootrests,
  seatDepth,
  seatWidth,
} from '../shared/specs-seating.ts';

export const wheelchairsSale = defineCategory({
  code: 'wheelchairs-sale',
  position: 18,
  translations: {
    it: {
      name: 'Vendita Carrozzine',
      slug: 'vendita-carrozzine',
      description:
        'La vendita di carrozzine pieghevoli MIA Medical Italia offre una soluzione sicura e affidabile per garantire la mobilità di anziani e persone con disabilità, direttamente a domicilio. Il nostro modello carrozzina pieghevole è certificato, sanificato e pronto all’uso, ideale per uso domestico, strutture sanitarie o viaggi.',
      metaTitle: 'Vendita carrozzine per anziani e disabili – MIA Medical Italia',
      metaDescription:
        'Acquista la carrozzina pieghevole MIA Medical Italia, sicura e certificata, ideale per anziani e persone con disabilità. Consegna rapida a domicilio',
    },
    en: {
      name: 'Wheelchairs for sale',
      slug: 'vendita-carrozzine',
      description:
        'Buying a folding wheelchair from MIA Medical Italia is a safe, dependable way to keep an older person or someone with a disability mobile, delivered to the door. Every chair is certified, sanitised and ready to use — at home, in a care setting or travelling.',
      metaTitle: 'Wheelchairs for sale for older and disabled people – MIA Medical Italia',
      metaDescription:
        'Buy a MIA Medical Italia folding wheelchair: safe, certified, and made for older people and people with disabilities. Fast home delivery.',
    },
  },

  specs: {
    ...propulsion,
    ...loadAndWeight,
    ...seatWidth,
    ...seatDepth,
    ...overallDimensions,
    ...frameMaterial,
    ...upholstery,
    ...wheelType,
    ...rearWheels,
    ...frontWheels,
    ...foldable,
    ...foldingBackrest,
    ...recliningBackrest,
    ...removableArmrests,
    ...removableFootrests,
    ...elevatingLegrests,
    ...headrest,
    ...brakes,
    ...antiTipWheels,
  },
});
