/**
 * Vendita Sollevatori, assembled — one line per product file.
 */

import { patientLiftsSale } from './category.ts';
import { goUpHoist } from './go-up-hoist.ts';
import { softBathHoistSale } from './soft-bath-hoist-sale.ts';

export default patientLiftsSale.withProducts([
  goUpHoist,
  softBathHoistSale,
]);
