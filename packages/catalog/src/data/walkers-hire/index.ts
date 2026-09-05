/**
 * Deambulatori e Rollatori, assembled — one line per product file.
 */

import { walkersHire } from './category.ts';
import { forearmSupportWalker } from './forearm-support-walker.ts';
import { ultralightAluminiumWalker } from './ultralight-aluminium-walker.ts';
import { underarmWalker } from './underarm-walker.ts';
import { aluminiumRollator } from './aluminium-rollator.ts';
import { walkerAndWheelchair } from './walker-and-wheelchair.ts';
import { rollatorWithSeat } from './rollator-with-seat.ts';

export default walkersHire.withProducts([
  forearmSupportWalker,
  ultralightAluminiumWalker,
  underarmWalker,
  aluminiumRollator,
  walkerAndWheelchair,
  rollatorWithSeat,
]);
