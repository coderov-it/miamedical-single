/**
 * Tens / Elettrostimolatore, assembled — one line per product file.
 */

import { tensHire } from './category.ts';
import { kinetecAndTensOrMagnetotherapy } from './kinetec-and-tens-or-magnetotherapy.ts';
import { tensAndMagnetotherapy } from './tens-and-magnetotherapy.ts';
import { globusPremium400 } from './globus-premium-400.ts';

export default tensHire.withProducts([
  kinetecAndTensOrMagnetotherapy,
  tensAndMagnetotherapy,
  globusPremium400,
]);
