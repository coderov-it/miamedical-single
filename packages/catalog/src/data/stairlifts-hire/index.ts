/**
 * Montascale, assembled — one line per product file.
 */

import { stairliftsHire } from './category.ts';
import { easystepMotorisedChair } from './easystep-motorised-chair.ts';
import { trackStairliftT09 } from './track-stairlift-t09.ts';
import { wheeledStairliftT10 } from './wheeled-stairlift-t10.ts';
import { shortRamp } from './short-ramp.ts';
import { easystepWheelchairStairlift } from './easystep-wheelchair-stairlift.ts';

export default stairliftsHire.withProducts([
  easystepMotorisedChair,
  trackStairliftT09,
  wheeledStairliftT10,
  shortRamp,
  easystepWheelchairStairlift,
]);
