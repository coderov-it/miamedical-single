/**
 * Vendita TENS/Elettrostimolatore, assembled — one product.
 */

import { tensSale } from './category.ts';
import { globusPremium400Sale } from './globus-premium-400-sale.ts';

export default tensSale.withProducts([
  globusPremium400Sale,
]);
