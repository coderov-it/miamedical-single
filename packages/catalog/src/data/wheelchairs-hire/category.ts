/**
 * Carrozzine — product_cat 68, `affitto-e-noleggio-carrozzina`, 11 products.
 *
 * The name is the site's, unchanged. So is the description, which is the term's
 * own copy including the comparison table it publishes; the English is the
 * site's own, with TranslatePress's currency slips (£ for €) and its rendering
 * of "carrozzine" as "pushchairs" put right.
 *
 * The specs below are the UNION of what the eleven product pages state, merged
 * where two pages name the same fact differently — `Portata massima`, `Peso
 * massimo utilizzatore` and `Peso massimo supportato` are one spec, and so are
 * `braccioli estraibili`, `rimovibili` and `ribaltabili`. Nothing here is a
 * spec the shop does not publish: only ONE of the eleven products carries a
 * WooCommerce attribute table (the reclining chair, 9034), so every other value
 * was read out of the prose on the product's own page.
 *
 * Not every product fills every spec, and that is the honest state of the
 * source — the three combined packages and the two seggioloni publish no
 * measurements at all, and inventing a seat width for them is exactly what this
 * migration exists to stop.
 *
 * `requiresDeposit` is FALSE even though the two seggioloni take a 300 €
 * deposit: the column is a category-wide boolean, the nine chairs and ramps
 * take nothing, and marking the category would put a deposit on all eleven.
 * See docs/catalog/README.md — the deposit needs a per-product amount.
 */
import { defineCategory } from '../../lib/define.ts';
import { colour, frameMaterial, loadAndWeight, upholstery } from '../shared/specs.ts';
import {
  antiTipWheels,
  brakes,
  foldable,
  foldedWidth,
  foldingBackrest,
  frontWheels,
  overallDimensions,
  rearWheels,
  wheelType,
} from '../shared/specs-chassis.ts';
import { ageGroup, propulsion } from '../shared/specs-mobility.ts';
import {
  adjustableSeat,
  adjustmentDrive,
  dismountable,
  elevatingLegrests,
  headrest,
  pressureReliefCushions,
  recliningBackrest,
  removableArmrests,
  removableFootrests,
  seatDimensions,
  tiltInSpace,
} from '../shared/specs-seating.ts';

export const wheelchairsHire = defineCategory({
  code: 'wheelchairs-hire',
  position: 0,
  translations: {
    it: {
      name: 'Carrozzine',
      slug: 'affitto-e-noleggio-carrozzina',
      description:
        'Il noleggio di carrozzine MIA Medical Italia è un servizio professionale pensato per supportare la mobilità di anziani, persone con disabilità o con ridotta capacità di deambulazione, in modo temporaneo o continuativo, senza la necessità di acquistare un ausilio. Offriamo carrozzine certificate, sanificate e pronte all’uso, disponibili a Roma, Firenze e relative province, con ritiro gratuito in sede o consegna a domicilio.',
      metaTitle: 'Carrozzine Archives - Mia Medical Italia',
      metaDescription:
        'offriamo noleggio di carrozzine per anziani e persone con disabilità a Roma, Firenze e province, con forfait flessibili, ritiro gratuito in sede, consegna a domicilio e dispositivi sanificati e certificati',
    },
    en: {
      name: 'Wheelchairs',
      slug: 'affitto-e-noleggio-carrozzina',
      description:
        'Wheelchair hire from MIA Medical Italia is a professional service built to support the mobility of older people, people with disabilities and anyone with reduced mobility, for a short period or an open-ended one, without having to buy an aid. We supply certified wheelchairs, sanitised and ready to use, in Rome, Florence and their provinces, with free collection at our premises or delivery to the door.',
      metaTitle: 'Wheelchair hire | Mia Medical Italia',
      metaDescription:
        'Wheelchair hire for older people and people with disabilities in Rome, Florence and their provinces: flexible packages, free collection on site, home delivery, and sanitised certified equipment.',
    },
  },

  specs: {
    /** What the eleven pages state about who the chair carries and how it moves. */
    ...propulsion,
    ...ageGroup,
    ...loadAndWeight,

    /** Seat and backrest. Only the reclining chair states all four. */
    ...seatDimensions,

    /** Overall size, and the one number a customer measures a boot against. */
    ...overallDimensions,
    ...foldedWidth,

    /** Build. */
    ...frameMaterial,
    ...upholstery,
    ...colour,
    ...wheelType,
    ...rearWheels,
    ...frontWheels,

    /** What folds, what reclines, what tips. */
    ...foldable,
    ...foldingBackrest,
    ...recliningBackrest,
    ...tiltInSpace,
    ...adjustmentDrive,
    ...dismountable,

    /** What comes off, and what holds the person up. */
    ...removableArmrests,
    ...removableFootrests,
    ...elevatingLegrests,
    ...headrest,
    ...adjustableSeat,
    ...pressureReliefCushions,

    /** Safety. */
    ...brakes,
    ...antiTipWheels,
  },
});
