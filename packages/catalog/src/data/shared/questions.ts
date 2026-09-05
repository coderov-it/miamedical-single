/**
 * Intake questions asked at order time.
 *
 * There is exactly one, and it is the only one the live site asks. Every hire
 * product carries the same WooCommerce field — a required date labelled
 * "A partire dal giorno:" — and no product asks anything else: no floor, no
 * lift, no measurements. Two hire products (the electric standing frames,
 * 8853 and 14603) carry no field at all.
 *
 * Unlike an add-on, a question MAY be required: a hire cannot be planned
 * without a start date. It constrains a choice, not a purchase.
 */
import type { AnyQuestion } from '../../lib/types.ts';

export const startDate: AnyQuestion = {
  key: 'start-date',
  prompt: { it: 'A partire dal giorno:', en: 'Starting from:' },
  questionValueType: 'date',
  isRequired: true,
};

/** What every hire product asks, spread as one: `...hireIntake`. */
export const hireIntake: readonly AnyQuestion[] = [startDate];
