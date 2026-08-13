import type { ContractVariant } from '@mia/validators';

const DEPOSIT_AMOUNT = '300.00';

export interface VariantResult {
  variant: ContractVariant;
  language: 'it' | 'en';
  requiresDeposit: boolean;
  depositAmount: string | null;
}

export function resolveVariant(
  customerType: 'private' | 'company' | 'tourist',
  hasDepositProduct: boolean,
): VariantResult {
  const isTourist = customerType === 'tourist';
  const language = isTourist ? 'en' : 'it';

  if (hasDepositProduct) {
    return {
      variant: isTourist ? 'scooter_tourist' : 'scooter_italian',
      language,
      requiresDeposit: true,
      depositAmount: DEPOSIT_AMOUNT,
    };
  }

  return {
    variant: isTourist ? 'carrozzina_tourist' : 'carrozzina_italian',
    language,
    requiresDeposit: false,
    depositAmount: null,
  };
}
