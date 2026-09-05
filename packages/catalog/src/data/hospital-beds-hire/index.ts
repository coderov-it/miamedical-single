/**
 * Letti ortopedici ospedalieri, assembled — one line per product file.
 */

import { hospitalBedsHire } from './category.ts';
import { electricBed90 } from './electric-bed-90.ts';
import { electricBed120 } from './electric-bed-120.ts';
import { bariatricElectricBed } from './bariatric-electric-bed.ts';
import { walkerWheelchairAndBed } from './walker-wheelchair-and-bed.ts';

export default hospitalBedsHire.withProducts([
  electricBed90,
  electricBed120,
  bariatricElectricBed,
  walkerWheelchairAndBed,
]);
