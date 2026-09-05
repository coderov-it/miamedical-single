/**
 * Criomagnetoterapia, assembled — one product.
 */

import { cryomagnetotherapyHire } from './category.ts';
import { cryocemp } from './cryocemp.ts';

export default cryomagnetotherapyHire.withProducts([
  cryocemp,
]);
