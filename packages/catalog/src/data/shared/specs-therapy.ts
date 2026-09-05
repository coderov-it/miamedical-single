/**
 * The electromedical devices: magnetotherapy, the Kinetec continuous passive
 * motion machines, cryotherapy, pressotherapy, TENS and ultrasound.
 *
 * Almost everything here is text, and that is not laziness. A treatment device
 * is described by its programme, not by a measurement: a timer runs "1–59
 * minuti / 1–24 ore / uso continuo", a range of motion is "estensione/flessione
 * da -10° a 120°", a pressure range is "0 – 200 mmHg ±20%". Each is one fact
 * the shop states in one line, and splitting it into numbers would invent a
 * precision the page does not claim.
 */
import { defineSpec, spec } from '../../lib/spec.ts';

/**
 * What is in the box. Every magnetotherapy page lists it — solenoids, a
 * therapeutic band, a transformer, the manual — and it is the thing a customer
 * checks before hiring, since a device without its applicator is no use.
 */
export const includedAccessories = defineSpec(
  'included-accessories',
  spec.text({ label: { it: 'Accessori inclusi', en: 'Accessories included' } }),
);

/** A CPM machine's whole purpose: `estensione/flessione da -10° a 120°`. */
export const rangeOfMotion = defineSpec(
  'range-of-motion',
  spec.text({
    label: { it: 'Gamma di movimento', en: 'Range of motion' },
    isComparable: true,
  }),
);

/** Who the frame fits — a CPM machine is sized to the leg it moves. */
export const patientHeight = defineSpec(
  'patient-height',
  spec.range({
    label: { it: 'Altezza paziente supportata', en: 'Patient height' },
    unit: 'cm',
    isComparable: true,
  }),
);

export const treatmentPressure = defineSpec(
  'treatment-pressure',
  spec.text({
    label: { it: 'Pressione di trattamento', en: 'Treatment pressure' },
    isComparable: true,
  }),
);

export const treatmentTemperature = defineSpec(
  'treatment-temperature',
  spec.text({
    label: { it: 'Temperatura', en: 'Temperature' },
    isComparable: true,
  }),
);

/** How many cuffs, sleeves or channels the device drives at once. */
export const channels = defineSpec(
  'channels',
  spec.text({ label: { it: 'Canali e applicatori', en: 'Channels and applicators' } }),
);

export const programmes = defineSpec(
  'programmes',
  spec.text({ label: { it: 'Programmi', en: 'Programmes' }, isComparable: true }),
);
