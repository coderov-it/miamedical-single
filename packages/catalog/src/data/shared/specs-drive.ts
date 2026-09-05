/**
 * Battery, motor and what they buy you — the specs only the powered products
 * carry: the electric chairs, the mobility scooters and the tracked stairlifts.
 *
 * `battery` and `motor` are text and not numbers on purpose. The catalogue
 * quotes them as the plate does — `2 x 12V 36 Ah / potenziate 2 x 12V 50 Ah`,
 * `2 x 250W` — and a single figure cannot hold "two of these, or two bigger
 * ones if you pay for the upgrade". Speed, range and gradient ARE numbers,
 * because every page states them as one.
 */
import { defineSpec, spec, specGroup } from '../../lib/spec.ts';

export const maxSpeed = defineSpec(
  'max-speed',
  spec.number({
    label: { it: 'Velocità massima', en: 'Top speed' },
    unit: 'km/h',
    isFilterable: true,
    isComparable: true,
  }),
);

/**
 * A range, because the upgrade battery is what the second number is for:
 * "Autonomia: 13 km (standard) – 25 km (batterie potenziate)". A product with
 * one figure writes it as both ends.
 */
export const batteryRange = defineSpec(
  'battery-range',
  spec.range({
    label: { it: 'Autonomia', en: 'Range' },
    unit: 'km',
    isFilterable: true,
    isComparable: true,
  }),
);

export const maxGradient = defineSpec(
  'max-gradient',
  spec.number({
    label: { it: 'Pendenza massima superabile', en: 'Maximum gradient' },
    unit: '°',
    isComparable: true,
  }),
);

export const motor = defineSpec(
  'motor',
  spec.text({ label: { it: 'Motore', en: 'Motor' }, isComparable: true }),
);

export const battery = defineSpec(
  'battery',
  spec.text({ label: { it: 'Batteria', en: 'Battery' }, isComparable: true }),
);

export const controls = defineSpec(
  'controls',
  spec.text({ label: { it: 'Comandi', en: 'Controls' } }),
);

export const turningRadius = defineSpec(
  'turning-radius',
  spec.number({
    label: { it: 'Raggio di sterzata', en: 'Turning radius' },
    unit: 'cm',
    isComparable: true,
  }),
);

export const obstacleHeight = defineSpec(
  'obstacle-height',
  spec.number({
    label: { it: 'Altezza ostacolo superabile', en: 'Obstacle clearance' },
    unit: 'cm',
    isComparable: true,
  }),
);

/** What every powered product states. */
export const driveBasics = specGroup({ ...maxSpeed, ...batteryRange, ...motor, ...battery });
