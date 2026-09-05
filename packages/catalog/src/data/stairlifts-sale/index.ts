/**
 * Vendita Montascale, assembled — one line per product file.
 */

import { stairliftsSale } from './category.ts';
import { easystepTrackChair } from './easystep-track-chair.ts';
import { easystepWheelchairClimber } from './easystep-wheelchair-climber.ts';

export default stairliftsSale.withProducts([
  easystepTrackChair,
  easystepWheelchairClimber,
]);
