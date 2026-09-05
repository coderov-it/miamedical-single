/**
 * Vendita Letti ortopedici ospedalieri, assembled — one product.
 */

import { hospitalBedsSale } from './category.ts';
import { threeJointElectricBed } from './three-joint-electric-bed.ts';

export default hospitalBedsSale.withProducts([
  threeJointElectricBed,
]);
