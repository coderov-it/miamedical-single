import { formatMoney } from '~/lib/format';
import type { StatusMeta } from '~/lib/orders/status';
import type { OrderDetail } from '~/lib/orders/types';
import { type MessageKey, t } from '~/lib/ui-text';

/**
 * What the admin derives about a manual order from the detail the server sends.
 * The server stays the judge (it refuses with a 422/409); this only keeps the
 * dialogs from offering what would be refused. Docs: docs/code/manual-orders.md.
 */

export type LinkSteps = 'sign_pay' | 'sign' | 'pay';

export const STAGE_LABELS: Record<'awaiting_signature' | 'awaiting_payment', MessageKey> = {
  awaiting_signature: 'newOrder.stageSignature',
  awaiting_payment: 'newOrder.stagePayment',
};

const hasRental = (order: OrderDetail) =>
  order.items.some((item) => item.configuration?.pricingMode === 'rental');

/** A pending manual order the agent can still act on. */
export const isOpenManual = (order: OrderDetail): boolean =>
  order.source === 'manual' && order.status === 'pending';

/** Why a link of these steps cannot work for this order, or null when it can. */
export function linkProblem(order: OrderDetail, steps: LinkSteps): MessageKey | null {
  const rental = hasRental(order);
  const signed = rental && order.manualStage !== 'awaiting_signature';
  if (steps !== 'pay' && !rental) return 'newOrder.errorNothingToSign';
  if (steps === 'sign' && signed) return 'newOrder.errorAlreadySigned';
  if (steps === 'pay' && rental && !signed) return 'newOrder.errorSignRequired';
  return null;
}

/** Why the discount is locked right now, or null while it can change. */
export function discountLock(order: OrderDetail): MessageKey | null {
  if (hasRental(order) && order.manualStage !== 'awaiting_signature') {
    return 'newOrder.discountLockedSigned';
  }
  return null;
}

/**
 * The discount may still change unless the contract is signed (a rental past
 * "waiting for signature"); an open payment attempt locks it too, which only the
 * server knows and answers with a 409.
 */
export const canEditDiscount = (order: OrderDetail): boolean => isOpenManual(order);

const FIELD_LABELS: Record<string, MessageKey> = {
  firstName: 'newOrder.fieldFirstName',
  lastName: 'newOrder.fieldLastName',
  phone: 'newOrder.fieldPhone',
  customerType: 'newOrder.fieldCustomerType',
  codiceFiscale: 'newOrder.fieldCodiceFiscale',
  partitaIva: 'newOrder.fieldPartitaIva',
};

export const fieldLabelKey = (field: string): MessageKey | undefined => FIELD_LABELS[field];

const blank = (value: string | null) => value === null || value.trim() === '';

/** Mirrors the server's readiness rule (orders/manual/readiness.ts). */
export function missingDetails(order: OrderDetail): string[] {
  const missing: string[] = [];
  if (blank(order.firstName)) missing.push('firstName');
  if (blank(order.lastName)) missing.push('lastName');
  if (blank(order.phone)) missing.push('phone');
  if (order.customerType === null) return [...missing, 'customerType'];
  const needsFiscal = order.customerType === 'private' || order.customerType === 'company';
  if (needsFiscal && blank(order.codiceFiscale)) missing.push('codiceFiscale');
  if (order.customerType === 'company' && blank(order.partitaIva)) missing.push('partitaIva');
  return missing;
}

const STEPS_LABELS: Record<LinkSteps, MessageKey> = {
  sign_pay: 'newOrder.stepsSignPay',
  sign: 'newOrder.stepsSign',
  pay: 'newOrder.stepsPay',
};

/** Timeline entries for the `discount` and `link` fields; call at render time. */
export function manualEventMeta(field: string, value: string): StatusMeta {
  const tone = 'border-border text-foreground';
  if (field === 'link') {
    const key = STEPS_LABELS[value as LinkSteps];
    return { label: key ? t(key) : value, tone, dot: 'bg-sky-500' };
  }
  return { label: formatMoney(value), tone, dot: 'bg-violet-500' };
}
