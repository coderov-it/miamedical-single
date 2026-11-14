/**
 * Outbound payment-gateway port. Feature code (`modules/payments`) depends on
 * `PaymentGateway`; the concrete gateway is chosen once in ./index.ts. A second
 * gateway is a second adapter here — checkout never learns which one it got.
 *
 * Amounts cross this port as decimal strings (`"30.00"`), the way the database
 * stores money. Converting to the gateway's own unit is the adapter's job.
 */

export type GatewayLanguage = 'it' | 'en' | 'fr' | 'de';

export interface StartPaymentInput {
  /** Our id for this attempt, unique per attempt: `MIA2026001042P1`. */
  reference: string;
  amount: string;
  currency: string;
  /** Shown on the gateway's page and in its back office. */
  description: string;
  email: string;
  language: GatewayLanguage;
  /** Where the customer's browser lands after paying, or after giving up. */
  resultUrl: string;
  cancelUrl: string;
  /** Where the gateway posts the outcome, server to server. */
  notificationUrl: string;
}

export interface StartedPayment {
  /** The gateway's hosted page. The customer is sent here. */
  redirectUrl: string;
  /** Echoed back in the gateway's notification; stored to check it against. */
  secret: string | null;
}

/**
 * What the gateway says happened. `pending` means it has nothing final yet —
 * the customer is still on its page, or never got there.
 */
export interface GatewayOutcome {
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  /** The gateway's own word for it, kept for the timeline: `EXECUTED`, `DECLINED`… */
  result: string | null;
  operationId: string | null;
  circuit: string | null;
  /** Decimal amount actually taken, when paid. */
  amount: string | null;
}

/** The two facts a notification must carry before anything else is believed. */
export interface GatewayNotice {
  reference: string;
  secret: string | null;
}

export interface PaymentGateway {
  readonly provider: string;
  start(input: StartPaymentInput): Promise<StartedPayment>;
  /** Asks the gateway directly. The answer the order is settled on — never a notification body. */
  outcome(reference: string): Promise<GatewayOutcome>;
  /** Reads a notification body, or `null` when it is not one. */
  readNotice(body: unknown): GatewayNotice | null;
}
