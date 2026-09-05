/**
 * Sollevatori, assembled — one line per product file.
 */

import { patientLiftsHire } from './category.ts';
import { boomHoist } from './boom-hoist.ts';
import { seatedHoist } from './seated-hoist.ts';
import { softBathHoist } from './soft-bath-hoist.ts';

export default patientLiftsHire.withProducts([
  boomHoist,
  seatedHoist,
  softBathHoist,
]);
