/**
 * What an order link may do, decided from plain values so it is tested without a
 * database. Docs: docs/code/manual-orders.md (Phase 3).
 *
 * ```
 * token revoked, or a newer link minted        → 410 reason revoked
 * token past expires_at                        → 410 reason expired
 * order paid already                           → 410 reason paid
 * order cancelled / any other non-pending      → 410 reason closed
 * steps 'sign', customer presses Pay           → 403 this link does not include payment
 * rental unsigned, steps 'pay', presses Pay    → 409 "Sign the contract first." (shown at the pay step)
 * ```
 */

import type { OrderLinkSteps } from '@mia/validators';

import { forbidden, httpError } from '../../shared/http/errors.ts';
import { missingCustomerFields, type ReadinessOrder } from '../orders/manual/readiness.ts';

export type LinkRefusal = 'revoked' | 'expired' | 'paid' | 'closed';

/** Why the link no longer works, or null while it does. Revocation outranks expiry. */
export function linkRefusal(
  token: { revokedAt: Date | null; expiresAt: Date },
  order: { status: string; paymentStatus: string },
  now: Date,
): LinkRefusal | null {
  if (token.revokedAt) return 'revoked';
  if (token.expiresAt <= now) return 'expired';
  if (order.status === 'pending') return null;
  return order.paymentStatus === 'paid' ? 'paid' : 'closed';
}

const GONE_MESSAGE: Record<LinkRefusal, string> = {
  revoked: 'This link was replaced by a newer one.',
  expired: 'This link has expired.',
  paid: 'This order is already paid.',
  closed: 'This order can no longer be completed.',
};

export function goneError(reason: LinkRefusal) {
  return httpError(410, GONE_MESSAGE[reason], 'gone', { reason });
}

/** The steps a token allows the page to show. */
export interface AllowedSteps {
  details: boolean;
  sign: boolean;
  pay: boolean;
}

export function allowedSteps(input: {
  steps: OrderLinkSteps;
  includeDetails: boolean;
  hasRental: boolean;
}): AllowedSteps {
  return {
    details: input.includeDetails,
    sign: input.steps !== 'pay' && input.hasRental,
    pay: input.steps !== 'sign',
  };
}

export function assertCanSign(input: { allowed: AllowedSteps; contractSigned: boolean }): void {
  if (!input.allowed.sign) throw forbidden('This link does not include signing.');
  if (input.contractSigned) {
    throw httpError(409, 'The contract is already signed.', 'conflict');
  }
}

/** The contract states the customer, so it is signed only once the details are complete. */
export function assertDetailsComplete(order: ReadinessOrder): void {
  const missing = missingCustomerFields(order);
  if (missing.length === 0) return;
  const fields = Object.fromEntries(missing.map((key) => [key, 'Required.']));
  throw httpError(409, 'Complete your details first.', 'conflict', { fields });
}

/** Payment needs a link that includes it, and a signed contract on a rental. */
export function assertCanPay(input: {
  allowed: AllowedSteps;
  hasRental: boolean;
  contractSigned: boolean;
}): void {
  if (!input.allowed.pay) throw forbidden('This link does not include payment.');
  if (input.hasRental && !input.contractSigned) {
    throw httpError(409, 'Sign the contract first.', 'conflict', { step: 'sign' });
  }
}

/** The contract's price must be the one the customer read when they signed. */
export function assertSameTotal(expected: string, actual: string): void {
  if (Number(expected) === Number(actual)) return;
  throw httpError(
    409,
    'The order changed. Reload the page and read the contract again.',
    'conflict',
  );
}
