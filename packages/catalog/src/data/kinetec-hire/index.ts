/**
 * Kinetec, assembled — one line per product file.
 */

import { kinetecHire } from './category.ts';
import { artromotK1 } from './artromot-k1.ts';
import { kinetecAndWheelchair } from './kinetec-and-wheelchair.ts';
import { cpmAdvance } from './cpm-advance.ts';
import { kinetecAndCryotherapy } from './kinetec-and-cryotherapy.ts';

export default kinetecHire.withProducts([
  artromotK1,
  kinetecAndWheelchair,
  cpmAdvance,
  kinetecAndCryotherapy,
]);
