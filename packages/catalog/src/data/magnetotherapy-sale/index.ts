/**
 * Vendita Magnetoterapia, assembled — one line per product file.
 */

import { magnetotherapySale } from './category.ts';
import { magnum2500Sale } from './magnum-2500-sale.ts';
import { therapist150PlusSale } from './therapist-150-plus-sale.ts';

export default magnetotherapySale.withProducts([
  magnum2500Sale,
  therapist150PlusSale,
]);
