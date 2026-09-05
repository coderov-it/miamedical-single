/**
 * Vendita carrozzine elettriche — product_cat 591,
 * `vendita-carrozzineelettriche`, 5 products.
 *
 * The slug has no separator between the two words. It is the site's, and it is an
 * SEO commitment, so it is kept exactly as published.
 *
 * The carbon Nuvola (15677) has the fullest specification block of any product in
 * the catalogue — twelve figures, including the only obstacle clearance and one of
 * only two turning radii.
 *
 * ⚠️ The Fantastica Power Smart (8801) is out of stock: its own page says
 * "Disponibilità terminata, guardare le categorie Occasione usato oppure nel
 * noleggio". `stock: 0` records that. It is also the product whose attribute table
 * carries a `COSTO` row holding rental prices — "7 GG 70€ - 15 GG 130€ - 30 GG
 * 240€ - 45 GG - 350€" — on a page that sells outright. Those are NOT packages
 * here: the product is `pricingMode: 'fixed'` because that is what the site sells
 * it as. Recorded in docs/catalog/README.md.
 */
import { defineCategory } from '../../lib/define.ts';
import { colour, condition, frameMaterial, loadAndWeight } from '../shared/specs.ts';
import { brakes, foldable, foldedSize, overallDimensions, rearWheels, wheelType } from '../shared/specs-chassis.ts';
import { battery, batteryRange, controls, maxGradient, maxSpeed, motor, obstacleHeight, turningRadius } from '../shared/specs-drive.ts';
import { indoorOutdoor, propulsion } from '../shared/specs-mobility.ts';
import { elevatingLegrests, headrest, recliningBackrest, removableArmrests, seatHeight, seatWidth } from '../shared/specs-seating.ts';

export const electricWheelchairsSale = defineCategory({
  code: 'electric-wheelchairs-sale',
  position: 19,
  translations: {
    it: {
      name: 'Vendita carrozzine elettriche',
      slug: 'vendita-carrozzineelettriche',
      description:
        'Il servizio di vendita e noleggio di carrozzine elettriche di MIA Medical Italia offre soluzioni pratiche, sicure e confortevoli. È pensato per persone con mobilità ridotta.',
      metaTitle: 'Vendita Carrozzine Elettriche – MIA Medical Italia',
      metaDescription:
        'Scopri la vendita di carrozzine elettriche MIA Medical Italia. Modelli affidabili e confortevoli per migliorare l’autonomia e la mobilità.',
    },
    en: {
      name: 'Electric wheelchairs for sale',
      slug: 'vendita-carrozzineelettriche',
      description:
        'MIA Medical Italia’s electric wheelchairs, to buy or to hire, are practical, safe and comfortable — made for people with reduced mobility.',
      metaTitle: 'Electric wheelchairs for sale – MIA Medical Italia',
      metaDescription:
        'Electric wheelchairs for sale from MIA Medical Italia. Dependable, comfortable models that give back independence and mobility.',
    },
  },

  specs: { ...propulsion, ...indoorOutdoor, ...loadAndWeight, ...maxSpeed, ...batteryRange, ...maxGradient, ...obstacleHeight, ...turningRadius, ...motor, ...battery, ...controls, ...overallDimensions, ...foldedSize, ...seatWidth, ...seatHeight, ...frameMaterial, ...colour, ...wheelType, ...rearWheels, ...brakes, ...recliningBackrest, ...headrest, ...elevatingLegrests, ...removableArmrests, ...foldable, ...condition },
});
