/**
 * Verticalizzatori, assembled — one line per product file.
 */

import { standingFramesHire } from './category.ts';
import { electricStandingHoist } from './electric-standing-hoist.ts';
import { albatros2 } from './albatros-2.ts';

export default standingFramesHire.withProducts([
  electricStandingHoist,
  albatros2,
]);
