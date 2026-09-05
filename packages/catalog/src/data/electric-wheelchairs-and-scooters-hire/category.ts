/**
 * Carrozzine elettriche e scooter — product_cat 71,
 * `noleggio-e-affitto-carrozzina-elettrica-e-scooter`, 6 products.
 *
 * The shop's own name, which puts two kinds of machine in one category: four
 * mobility scooters and two electric wheelchairs. The category is kept as the
 * site publishes it rather than split, and `propulsion: electric` plus the
 * drive specs are what separate a scooter from a chair inside it.
 *
 * `requiresDeposit` is TRUE, and here it is exactly right: every one of the six
 * pages states a deposit — 300 € on four of them, 400 € on the Maximo scooter
 * and on the Superwheel chair. The schema records only THAT a deposit is
 * taken, not how much; the amounts survive in each product's copy, and
 * docs/catalog/README.md carries the gap.
 */
import { defineCategory } from '../../lib/define.ts';
import { colour, frameMaterial, loadAndWeight } from '../shared/specs.ts';
import {
  brakes,
  foldable,
  foldedSize,
  overallDimensions,
  rearWheels,
  wheelType,
} from '../shared/specs-chassis.ts';
import {
  battery,
  batteryRange,
  controls,
  maxGradient,
  maxSpeed,
  motor,
} from '../shared/specs-drive.ts';
import { indoorOutdoor, propulsion } from '../shared/specs-mobility.ts';
import {
  dismountable,
  elevatingLegrests,
  headrest,
  recliningBackrest,
  removableArmrests,
  seatWidth,
} from '../shared/specs-seating.ts';

export const electricWheelchairsAndScootersHire = defineCategory({
  code: 'electric-wheelchairs-and-scooters-hire',
  position: 1,
  requiresDeposit: true,
  translations: {
    it: {
      name: 'Carrozzine elettriche e scooter',
      slug: 'noleggio-e-affitto-carrozzina-elettrica-e-scooter',
      description:
        'Il servizio di noleggio carrozzine elettriche e scooter elettrici di MIA Medical Italia è pensato per garantire autonomia, sicurezza e comfort a persone con mobilità ridotta che desiderano muoversi liberamente in città come Roma e Firenze, anche solo per pochi giorni. I nostri dispositivi sono ideali sia per residenti sia, soprattutto, per turisti che visitano l’Italia e vogliono vivere l’esperienza di viaggio senza rinunciare alla libertà di movimento.',
      metaTitle: 'Carrozzine elettriche e scooter Archives - Mia Medical Italia',
      metaDescription:
        'Offriamo il noleggio di scooter elettrici e carrozzine elettriche a Roma e Firenze, consegna flessibile, dispositivi certificati e assistenza.',
    },
    en: {
      name: 'Electric wheelchairs and scooters',
      slug: 'noleggio-e-affitto-carrozzina-elettrica-e-scooter',
      description:
        'MIA Medical Italia hires out electric wheelchairs and mobility scooters so that people with reduced mobility can get about Rome and Florence under their own steam — for a few days or for months. The machines suit residents, and they suit visitors to Italy who would rather not give up their freedom of movement to see the place.',
      metaTitle: 'Electric wheelchair and mobility scooter hire | Mia Medical Italia',
      metaDescription:
        'Electric scooter and electric wheelchair hire in Rome and Florence: flexible delivery, certified machines and support throughout.',
    },
  },

  specs: {
    ...propulsion,
    ...indoorOutdoor,
    ...loadAndWeight,

    /** What the battery and the motor buy you. */
    ...maxSpeed,
    ...batteryRange,
    ...maxGradient,
    ...motor,
    ...battery,
    ...controls,

    /** Size, open and folded. */
    ...overallDimensions,
    ...foldedSize,
    ...seatWidth,

    /** Build and running gear. */
    ...frameMaterial,
    ...colour,
    ...wheelType,
    ...rearWheels,
    ...brakes,

    /** Seating and transport. */
    ...recliningBackrest,
    ...headrest,
    ...elevatingLegrests,
    ...removableArmrests,
    ...foldable,
    ...dismountable,
  },
});
