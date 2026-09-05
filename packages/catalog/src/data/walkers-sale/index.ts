/**
 * Vendita deambulatori e rollatori, assembled — one line per product file.
 */

import { walkersSale } from './category.ts';
import { aluminiumRollatorSale } from './aluminium-rollator-sale.ts';
import { underarmWalkerSale } from './underarm-walker-sale.ts';
import { forearmSupportWalkerSale } from './forearm-support-walker-sale.ts';
import { rollatorMini } from './rollator-mini.ts';
import { rollatorWithSeatSale } from './rollator-with-seat-sale.ts';
import { ultralightAluminiumWalkerSale } from './ultralight-aluminium-walker-sale.ts';

export default walkersSale.withProducts([
  aluminiumRollatorSale,
  underarmWalkerSale,
  forearmSupportWalkerSale,
  rollatorMini,
  rollatorWithSeatSale,
  ultralightAluminiumWalkerSale,
]);
