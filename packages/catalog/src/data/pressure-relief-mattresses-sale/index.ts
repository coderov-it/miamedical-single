/**
 * Vendita Materassi antidecubito ad alto rischio, assembled — one line per product file.
 */

import { pressureReliefMattressesSale } from './category.ts';
import { polyplot90 } from './polyplot-90.ts';
import { easyAirIi } from './easy-air-ii.ts';
import { highRiskMattress } from './high-risk-mattress.ts';
import { hospitalCareXl } from './hospital-care-xl.ts';

export default pressureReliefMattressesSale.withProducts([
  polyplot90,
  easyAirIi,
  highRiskMattress,
  hospitalCareXl,
]);
