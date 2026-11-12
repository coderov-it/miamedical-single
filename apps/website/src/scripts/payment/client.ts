/**
 * The browser's side of online payment: ask how an attempt went, start another,
 * and go where the answer says. Used by the checkout, the payment result page
 * and the customer area. Flow: docs/code/online-payments.md.
 */
import { documentLocale } from '../locale';

export type PageLanguage = 'it' | 'en' | 'fr' | 'de';

const LANGUAGES: readonly PageLanguage[] = ['it', 'en', 'fr', 'de'];

/** `<html lang="en-GB">` → `en`. The gateway's page speaks the same language. */
export function pageLanguage(): PageLanguage {
  const code = documentLocale().slice(0, 2) as PageLanguage;
  return LANGUAGES.includes(code) ? code : 'it';
}

export interface PaymentStart {
  /** The result page's key. */
  token: string;
  /** The gateway's page, or null when the gateway could not be reached. */
  redirectUrl: string | null;
}

export interface PaymentResult {
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired';
  kind: 'order' | 'renewal';
  orderNumber: string;
  amount: string;
  currency: string;
  canRetry: boolean;
  paymentDueAt: string | null;
}

/** 404: the token names no payment. Anything else is a transient failure. */
export class PaymentLinkError extends Error {}

async function call<T>(apiBase: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    credentials: 'include',
    headers: init.body ? { 'content-type': 'application/json' } : {},
  });
  if (response.status === 404) throw new PaymentLinkError('not found');
  if (!response.ok) throw new Error(`payment request failed (${response.status})`);
  const payload = (await response.json()) as { data: T };
  return payload.data;
}

export function readPayment(apiBase: string, token: string): Promise<PaymentResult> {
  return call(apiBase, `/api/payments/${encodeURIComponent(token)}`);
}

export function retryPayment(apiBase: string, token: string): Promise<PaymentStart> {
  return call(apiBase, `/api/payments/${encodeURIComponent(token)}/retry`, {
    method: 'POST',
    body: JSON.stringify({ language: pageLanguage() }),
  });
}

/** "Pay now" in the account: the order, or its signed renewal. */
export function payOrder(apiBase: string, orderNumber: string): Promise<PaymentStart> {
  return call(apiBase, `/api/customer/payments/orders/${encodeURIComponent(orderNumber)}`, {
    method: 'POST',
    body: JSON.stringify({ language: pageLanguage() }),
  });
}

/** The result page for an attempt, in this page's language. */
export function resultHref(resultPath: string, token: string): string {
  return `${resultPath}?${new URLSearchParams({ token })}`;
}

/**
 * Leaves for the gateway, or — when it could not be reached — for the result
 * page, which says so and offers to try again.
 */
export function goToPayment(start: PaymentStart, resultPath: string): void {
  window.location.assign(start.redirectUrl ?? resultHref(resultPath, start.token));
}
