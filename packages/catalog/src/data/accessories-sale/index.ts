/**
 * Vendita Accessori Per Anziani e Disabili, assembled — one line per product file.
 */

import { accessoriesSale } from './category.ts';
import { pressureReliefCushion } from './pressure-relief-cushion.ts';
import { delfinToiletRiser } from './delfin-toilet-riser.ts';
import { paddedCommodeChair } from './padded-commode-chair.ts';

export default accessoriesSale.withProducts([
  pressureReliefCushion,
  delfinToiletRiser,
  paddedCommodeChair,
]);
