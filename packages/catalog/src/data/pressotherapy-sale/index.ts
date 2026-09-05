/**
 * Vendita Pressoterapia, assembled — one product.
 */

import { pressotherapySale } from './category.ts';
import { q2200Power } from './q2200-power.ts';

export default pressotherapySale.withProducts([
  q2200Power,
]);
