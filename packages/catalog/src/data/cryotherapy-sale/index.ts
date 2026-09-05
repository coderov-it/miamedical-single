/**
 * Vendita Crioterapia, assembled — one line per product file.
 */

import { cryotherapySale } from './category.ts';
import { cryopushCompressionSale } from './cryopush-compression-sale.ts';
import { cryopushDynamic } from './cryopush-dynamic.ts';

export default cryotherapySale.withProducts([
  cryopushCompressionSale,
  cryopushDynamic,
]);
