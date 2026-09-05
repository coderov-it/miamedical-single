/**
 * Vendita Scooter Elettrici — product_cat 584, `vendita-scooter-elettrici`,
 * 5 products.
 *
 * Four of the five are the sale twins of scooters the hire category lists, and
 * their pages repeat the same specification blocks, so the figures match. The
 * Kuarz is sold only — and it is the only product in the catalogue whose page
 * gives a turning radius.
 *
 * ⚠️ The Maximo (15650) carries NO product_cat term on the live site at all. It
 * is filed here from its own title; see docs/catalog/source/placement.json.
 */
import { defineCategory } from '../../lib/define.ts';
import { colour, condition, frameMaterial, loadAndWeight } from '../shared/specs.ts';
import { brakes, foldable, foldedSize, overallDimensions, rearWheels, wheelType } from '../shared/specs-chassis.ts';
import { battery, batteryRange, controls, maxGradient, maxSpeed, motor, obstacleHeight, turningRadius } from '../shared/specs-drive.ts';
import { indoorOutdoor, propulsion } from '../shared/specs-mobility.ts';
import { elevatingLegrests, headrest, recliningBackrest, removableArmrests, seatHeight, seatWidth } from '../shared/specs-seating.ts';

export const mobilityScootersSale = defineCategory({
  code: 'mobility-scooters-sale',
  position: 29,
  translations: {
    it: {
      name: 'Vendita Scooter Elettrici',
      slug: 'vendita-scooter-elettrici',
      description:
        'Il servizio di vendita scooter elettrici di MIA Medical Italia è pensato per garantire autonomia, sicurezza e comfort a persone con mobilità ridotta che desiderano muoversi liberamente nella vita quotidiana.',
      metaTitle: 'Vendita Scooter Elettrici – MIA Medical Italia',
      metaDescription:
        'Scopri la vendita di scooter elettrici MIA Medical Italia. Modelli affidabili e confortevoli per migliorare l’autonomia e la mobilità.',
    },
    en: {
      name: 'Electric Scooters For Sale',
      slug: 'vendita-scooter-elettrici',
      description:
        'MIA Medical Italia sells mobility scooters so that people with reduced mobility can get about under their own steam, safely and in comfort, in the ordinary course of a day.',
      metaTitle: 'Mobility scooters for sale – MIA Medical Italia',
      metaDescription:
        'Mobility scooters for sale from MIA Medical Italia. Dependable, comfortable machines that give back independence and mobility.',
    },
  },

  specs: { ...propulsion, ...indoorOutdoor, ...loadAndWeight, ...maxSpeed, ...batteryRange, ...maxGradient, ...obstacleHeight, ...turningRadius, ...motor, ...battery, ...controls, ...overallDimensions, ...foldedSize, ...seatWidth, ...seatHeight, ...frameMaterial, ...colour, ...wheelType, ...rearWheels, ...brakes, ...recliningBackrest, ...headrest, ...elevatingLegrests, ...removableArmrests, ...foldable, ...condition },
});
