/**
 * Occasione Usato in Vendita, assembled — one line per product file.
 */

import { usedDealsSale } from './category.ts';
import { usedFantastica1 } from './used-fantastica-1.ts';
import { usedFantastica2 } from './used-fantastica-2.ts';
import { usedFantastica3 } from './used-fantastica-3.ts';
import { usedTommy1 } from './used-tommy-1.ts';
import { usedTommy2 } from './used-tommy-2.ts';
import { usedTommy3 } from './used-tommy-3.ts';

export default usedDealsSale.withProducts([
  usedFantastica1,
  usedFantastica2,
  usedFantastica3,
  usedTommy1,
  usedTommy2,
  usedTommy3,
]);
