/**
 * Vendita Carrozzine, assembled — one line per product file.
 */

import { wheelchairsSale } from './category.ts';
import { foldingConvertible } from './folding-convertible.ts';
import { bobbyEvo } from './bobby-evo.ts';
import { slimSelfPropelledSale } from './slim-self-propelled-sale.ts';
import { slimTransitSale } from './slim-transit-sale.ts';
import { selfPropelledFoldingSale } from './self-propelled-folding-sale.ts';
import { recliningWheelchairSale } from './reclining-wheelchair-sale.ts';
import { bariatricWheelchairSale } from './bariatric-wheelchair-sale.ts';

export default wheelchairsSale.withProducts([
  foldingConvertible,
  bobbyEvo,
  slimSelfPropelledSale,
  slimTransitSale,
  selfPropelledFoldingSale,
  recliningWheelchairSale,
  bariatricWheelchairSale,
]);
