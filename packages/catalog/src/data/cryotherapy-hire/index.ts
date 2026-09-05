/**
 * Cryoterapia, assembled — one line per product file.
 */

import { cryotherapyHire } from './category.ts';
import { cryopushCompression } from './cryopush-compression.ts';
import { cryopushCompressionAlt } from './cryopush-compression-alt.ts';
import { cryoCuff } from './cryo-cuff.ts';

export default cryotherapyHire.withProducts([
  cryopushCompression,
  cryopushCompressionAlt,
  cryoCuff,
]);
