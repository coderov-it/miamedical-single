/** The timeline note of a recorded payment. Pure. */

export type ManualPaymentMethod = 'bank_transfer' | 'cash' | 'card_pos';

export interface RecordPaymentInput {
  method: ManualPaymentMethod;
  reference?: string | null | undefined;
}

const METHOD_LABEL: Record<ManualPaymentMethod, string> = {
  bank_transfer: 'bank transfer',
  cash: 'cash',
  card_pos: 'card POS',
};

export function paymentNote(input: RecordPaymentInput): string {
  const reference = input.reference?.trim();
  return `Payment recorded: ${METHOD_LABEL[input.method]}${reference ? `, ref. ${reference}` : ''}.`;
}
