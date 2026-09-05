/**
 * Magnetoterapia, assembled — one line per product file.
 */

import { magnetotherapyHire } from './category.ts';
import { magnetotherapyAndWheelchair } from './magnetotherapy-and-wheelchair.ts';
import { mag2000Itech } from './mag-2000-itech.ts';
import { magnum2500 } from './magnum-2500.ts';
import { magnetocempEliteGlobus } from './magnetocemp-elite-globus.ts';
import { therapist150Plus } from './therapist-150-plus.ts';

export default magnetotherapyHire.withProducts([
  magnetotherapyAndWheelchair,
  mag2000Itech,
  magnum2500,
  magnetocempEliteGlobus,
  therapist150Plus,
]);
