/**
 * Carrozzine, assembled — one line per product file.
 *
 * The order is the order the shop's own category listing puts them in, newest
 * first, which is what `position` will follow.
 */

import { wheelchairsHire } from './category.ts';
import { slimSelfPropelled } from './slim-self-propelled.ts';
import { slimTransit } from './slim-transit.ts';
import { ramp } from './ramp.ts';
import { recliningWheelchair } from './reclining-wheelchair.ts';
import { tiltingCareChair } from './tilting-care-chair.ts';
import { bariatricWheelchair } from './bariatric-wheelchair.ts';
import { transitFolding } from './transit-folding.ts';
import { selfPropelledFolding } from './self-propelled-folding.ts';
import { pediatricWheelchair } from './pediatric-wheelchair.ts';
import { tiltingCareChairElectric } from './tilting-care-chair-electric.ts';
import { bobbyTransit } from './bobby-transit.ts';

export default wheelchairsHire.withProducts([
  slimSelfPropelled,
  slimTransit,
  ramp,
  recliningWheelchair,
  tiltingCareChair,
  bariatricWheelchair,
  transitFolding,
  selfPropelledFolding,
  pediatricWheelchair,
  tiltingCareChairElectric,
  bobbyTransit,
]);
