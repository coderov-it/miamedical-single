import { FEATURES } from '../../config/features.ts';
import { NexiPaymentGateway } from './nexi.ts';
import type { PaymentGateway } from './port.ts';

/**
 * The one place a gateway is chosen. `null` when `PAYMENT_PROVIDER=none`, a
 * development-only state: orders are placed unpaid and nobody is sent anywhere.
 * `config/payment-env.ts` refuses it in production.
 */
export const paymentGateway: PaymentGateway | null = FEATURES.payments
  ? new NexiPaymentGateway(FEATURES.payments.apiKey, FEATURES.payments.baseUrl)
  : null;

export type { GatewayLanguage, PaymentGateway } from './port.ts';
