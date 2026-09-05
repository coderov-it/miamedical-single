/**
 * Materassi antidecubito ad alto rischio, assembled — one line per product file.
 */

import { pressureReliefMattressesHire } from './category.ts';
import { highCure90 } from './high-cure-90.ts';
import { hospitalCareXl120 } from './hospital-care-xl-120.ts';

export default pressureReliefMattressesHire.withProducts([
  highCure90,
  hospitalCareXl120,
]);
