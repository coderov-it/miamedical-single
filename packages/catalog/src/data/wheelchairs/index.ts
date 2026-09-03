/**
 * The category, assembled. One line per product file.
 *
 * This is the only place that has to change when a product is added: write the
 * file, import it, list it. A product not listed here is simply not in the
 * catalogue — which is also how a half-written one stays out of a sync run
 * without being deleted.
 */
import { wheelchairs } from './category.ts';
import { bariatricWheelchair } from './bariatric-wheelchair.ts';
import { kinetecWheelchairBundle } from './kinetec-wheelchair-bundle.ts';
import { magnetotherapyWheelchairBundle } from './magnetotherapy-wheelchair-bundle.ts';
import { pediatricWheelchair } from './pediatric-wheelchair.ts';
import { recliningWheelchair } from './reclining-wheelchair.ts';
import { selfPropelledFolding } from './self-propelled-folding.ts';
import { slimSelfPropelled } from './slim-self-propelled.ts';
import { slimTransit } from './slim-transit.ts';
import { superwheelElectric } from './superwheel-electric.ts';
import { tiltingChairElectric } from './tilting-chair-electric.ts';
import { tiltingChairManual } from './tilting-chair-manual.ts';
import { transitFolding } from './transit-folding.ts';
import { walkerWheelchairBundle } from './walker-wheelchair-bundle.ts';
import { wheelchairRamp } from './wheelchair-ramp.ts';
import { wheelchairRampShort } from './wheelchair-ramp-short.ts';

export default wheelchairs.withProducts([
  slimSelfPropelled,
  slimTransit,
  wheelchairRamp,
  recliningWheelchair,
  tiltingChairManual,
  bariatricWheelchair,
  transitFolding,
  selfPropelledFolding,
  kinetecWheelchairBundle,
  walkerWheelchairBundle,
  magnetotherapyWheelchairBundle,
  pediatricWheelchair,
  wheelchairRampShort,
  tiltingChairElectric,
  superwheelElectric,
]);
