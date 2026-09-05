/**
 * Vendita Ultrasuono, assembled — one product.
 */

import { ultrasoundSale } from './category.ts';
import { globusMedisound3000Sale } from './globus-medisound-3000-sale.ts';

export default ultrasoundSale.withProducts([
  globusMedisound3000Sale,
]);
