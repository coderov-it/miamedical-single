/**
 * Whether a link of the chosen steps makes sense for this order, pure so it is
 * tested without a database. Every refusal is a 422 whose `fields` names the
 * control to mark. Docs: docs/code/manual-orders.md.
 *
 * ```
 * sale, steps sign_pay                        → 422 steps: nothing to sign
 * rental, contract unsigned, steps pay        → 422 steps: contract signing required for payment
 * codice fiscale missing, details box off     → 422 codiceFiscale: Required.
 * ```
 */

import type { OrderLinkSteps } from '@mia/validators';

import { httpError } from '../../shared/http/errors.ts';
import { type ReadinessOrder, missingCustomerFields } from '../orders/manual/readiness.ts';

export interface LinkOrder extends ReadinessOrder {
  source: 'online' | 'manual';
  status: string;
  hasRental: boolean;
  contractStatus: string | null;
}

const refuse = (message: string, fields: Record<string, string>, status: 409 | 422 = 422) =>
  httpError(status, message, status === 409 ? 'conflict' : 'unprocessable_entity', { fields });

export function assertLinkable(
  order: LinkOrder,
  input: { steps: OrderLinkSteps; includeDetails: boolean },
): void {
  if (order.source !== 'manual')
    throw httpError(409, 'Only a manual order has a link.', 'conflict');
  if (order.status !== 'pending') {
    throw httpError(409, `This order is ${order.status}, so a link cannot be sent.`, 'conflict');
  }
  const signs = input.steps !== 'pay';
  const signed = order.contractStatus === 'signed';
  if (signs && !order.hasRental) {
    const message = 'This order has no contract to sign.';
    throw refuse(message, { steps: message });
  }
  if (input.steps === 'sign' && signed) {
    const message = 'The contract is already signed.';
    throw refuse(message, { steps: message });
  }
  if (input.steps === 'pay' && order.hasRental && !signed) {
    const message = 'Contract signing required for payment.';
    throw refuse(message, { steps: message });
  }
  const missing = missingCustomerFields(order);
  if (!input.includeDetails && missing.length > 0) {
    const fields = Object.fromEntries(missing.map((key) => [key, 'Required.']));
    throw refuse('Complete the customer details, or include the details form in the link.', fields);
  }
}

const STEPS_LABEL: Record<OrderLinkSteps, string> = {
  sign_pay: 'sign and pay',
  sign: 'sign only',
  pay: 'pay only',
};

/** The timeline note of a minted link. */
export function linkNote(input: {
  steps: OrderLinkSteps;
  includeDetails: boolean;
  deliver: 'email' | 'copy';
}): string {
  const how = input.deliver === 'email' ? 'sent by email' : 'copied';
  const details = input.includeDetails ? ', with the details form' : '';
  return `Link ${how} (${STEPS_LABEL[input.steps]}${details}).`;
}
