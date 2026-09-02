/**
 * Intake questions asked at order time, shared by the products that need them.
 *
 * Unlike an add-on, a question MAY be required — "which floor?" has to be
 * answered before a delivery can be planned. It constrains a choice, not a
 * purchase.
 */
import type { AnyQuestion } from '../../lib/types.ts';

export const floor: AnyQuestion = {
  key: 'floor',
  prompt: { it: 'A che piano abita?', en: 'Which floor do you live on?' },
  helpText: { it: 'Serve a sapere se portare il montascale.' },
  questionValueType: 'number',
  isRequired: true,
  minValue: 0,
  maxValue: 30,
};

export const hasLift: AnyQuestion = {
  key: 'hasLift',
  prompt: { it: "C'è l'ascensore?", en: 'Is there a lift?' },
  questionValueType: 'single_select',
  isRequired: true,
  options: { yes: { it: 'Sì', en: 'Yes' }, no: { it: 'No', en: 'No' } },
};

/** Every home delivery needs both. */
export const deliveryAccess: readonly AnyQuestion[] = [floor, hasLift];
