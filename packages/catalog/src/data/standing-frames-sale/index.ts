/**
 * Vendita Verticalizzatori, assembled — one product.
 */

import { standingFramesSale } from './category.ts';
import { albatros2Sale } from './albatros-2-sale.ts';

export default standingFramesSale.withProducts([
  albatros2Sale,
]);
