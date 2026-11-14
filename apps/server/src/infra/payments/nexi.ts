import { randomUUID } from 'node:crypto';

import type {
  GatewayLanguage,
  GatewayNotice,
  GatewayOutcome,
  PaymentGateway,
  StartedPayment,
  StartPaymentInput,
} from './port.ts';

/**
 * Nexi XPay, hosted payment page ("HPP"), REST API v1.
 *
 *   start    POST /orders/hpp       → { hostedPage, securityToken }
 *   outcome  GET  /orders/{orderId} → { orderStatus, operations[] }
 *
 * The hosted page lives 15 minutes (Nexi's fixed value). `captureType: IMPLICIT`
 * means the money is taken at once, not reserved for a later capture.
 *
 * Amounts go to Nexi in cents as a string: €30.00 → "3000".
 */

const LANGUAGE: Record<GatewayLanguage, string> = {
  it: 'ita',
  en: 'eng',
  fr: 'fra',
  de: 'deu',
};

const TIMEOUT_MS = 15_000;

/* An operation that moved money, and the results that mean it did. */
const MONEY_OPERATIONS = new Set(['AUTHORIZATION', 'CAPTURE']);
const SUCCESS_RESULTS = new Set(['AUTHORIZED', 'EXECUTED']);
const FAILURE_RESULTS = new Set(['DECLINED', 'DENIED_BY_RISK', 'THREEDS_FAILED', 'FAILED']);

interface NexiOperation {
  operationId?: string;
  operationType?: string;
  operationResult?: string;
  operationAmount?: string;
  operationTime?: string;
  paymentCircuit?: string;
}

interface NexiOrderBody {
  orderStatus?: { capturedAmount?: string; operations?: NexiOperation[] };
  operations?: NexiOperation[];
}

export function toCents(amount: string): string {
  const [whole = '0', fraction = ''] = amount.split('.');
  return String(Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2)));
}

export function fromCents(cents: string): string {
  return (Number(cents) / 100).toFixed(2);
}

/** The outcome Nexi's operation list adds up to. Pure, so it is tested alone. */
export function readOutcome(body: NexiOrderBody): GatewayOutcome {
  const operations = body.operations ?? body.orderStatus?.operations ?? [];
  const paid = operations.find(
    (op) =>
      MONEY_OPERATIONS.has(op.operationType ?? '') && SUCCESS_RESULTS.has(op.operationResult ?? ''),
  );
  if (paid) {
    return {
      status: 'paid',
      result: paid.operationResult ?? null,
      operationId: paid.operationId ?? null,
      circuit: paid.paymentCircuit ?? null,
      amount: paid.operationAmount ? fromCents(paid.operationAmount) : null,
    };
  }

  const last = [...operations]
    .sort((a, b) => (a.operationTime ?? '').localeCompare(b.operationTime ?? ''))
    .at(-1);
  const result = last?.operationResult ?? null;
  const base = {
    result,
    operationId: last?.operationId ?? null,
    circuit: last?.paymentCircuit ?? null,
    amount: null,
  };
  if (result && FAILURE_RESULTS.has(result)) return { status: 'failed', ...base };
  if (result === 'CANCELED') return { status: 'cancelled', ...base };
  return { status: 'pending', ...base };
}

export class NexiPaymentGateway implements PaymentGateway {
  readonly provider = 'nexi';
  private readonly apiKey: string;
  private readonly baseUrl: string;

  /* Plain fields, not parameter properties: `node --test` strips types only. */
  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async start(input: StartPaymentInput): Promise<StartedPayment> {
    const cents = toCents(input.amount);
    const response = await this.call('/orders/hpp', {
      method: 'POST',
      body: JSON.stringify({
        order: {
          orderId: input.reference,
          amount: cents,
          currency: input.currency,
          description: input.description.slice(0, 255),
          customerInfo: { cardHolderEmail: input.email.slice(0, 255) },
        },
        paymentSession: {
          actionType: 'PAY',
          amount: cents,
          captureType: 'IMPLICIT',
          language: LANGUAGE[input.language],
          resultUrl: input.resultUrl,
          cancelUrl: input.cancelUrl,
          notificationUrl: input.notificationUrl,
        },
      }),
    });

    const body = (await response.json().catch(() => ({}))) as {
      hostedPage?: string;
      securityToken?: string;
      errors?: { code?: string; description?: string }[];
    };
    if (!response.ok || !body.hostedPage) {
      const reason = body.errors?.map((e) => `${e.code}: ${e.description}`).join('; ');
      throw new Error(
        `Nexi refused the payment session (${response.status}) ${reason ?? ''}`.trim(),
      );
    }
    return { redirectUrl: body.hostedPage, secret: body.securityToken ?? null };
  }

  async outcome(reference: string): Promise<GatewayOutcome> {
    const response = await this.call(`/orders/${encodeURIComponent(reference)}`, { method: 'GET' });
    /* Never registered at Nexi: the session was not created, nothing was paid. */
    if (response.status === 404) {
      return { status: 'pending', result: null, operationId: null, circuit: null, amount: null };
    }
    if (!response.ok) throw new Error(`Nexi order lookup failed (${response.status}).`);
    return readOutcome((await response.json()) as NexiOrderBody);
  }

  readNotice(body: unknown): GatewayNotice | null {
    if (typeof body !== 'object' || body === null) return null;
    const record = body as { securityToken?: unknown; operation?: { orderId?: unknown } };
    const reference = record.operation?.orderId;
    if (typeof reference !== 'string' || reference === '') return null;
    const secret = typeof record.securityToken === 'string' ? record.securityToken : null;
    return { reference, secret };
  }

  private call(path: string, init: RequestInit): Promise<Response> {
    return fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.apiKey,
        'Correlation-Id': randomUUID(),
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  }
}
