/**
 * Sending a customer to the payment gateway — for a new order, a renewal, or a
 * second try at either. Walk-through: docs/code/online-payments.md.
 *
 *   order MIA-2026-001042, €30.00, guest
 *   1. attempt written         reference MIA2026001042P1, token Xy3…, pending
 *   2. gateway session         → hosted page URL, secret stored on the attempt
 *   3. answer                  { token, redirectUrl } → the browser goes there
 *
 *   gateway down at step 2     attempt → failed; answer { token, redirectUrl: null }
 *                              → the browser goes to the result page, which offers a retry
 */

import { randomBytes } from 'node:crypto';

import type { Database } from '@mia/db';
import { eq } from '@mia/db';
import { orders, rentalExtensions } from '@mia/db/schema';
import type { LanguageCode } from '@mia/validators';

import { FEATURES } from '../../config/features.ts';
import { paymentGateway } from '../../infra/payments/index.ts';
import { conflict, notFound } from '../../shared/http/errors.ts';
import { paymentResultUrl } from '../notifications/links.ts';
import * as attempts from './attempt-repo.ts';

export interface PaymentStart {
  /** The result page's key. */
  token: string;
  /** The gateway's page, or null when the gateway could not be reached. */
  redirectUrl: string | null;
}

/** An unpaid order the customer may still pay. */
export function isPayable(order: {
  status: string;
  paymentStatus: string;
  paymentDueAt: Date | null;
}): boolean {
  if (order.status !== 'pending' || order.paymentStatus !== 'unpaid') return false;
  return order.paymentDueAt === null || order.paymentDueAt.getTime() > Date.now();
}

async function findOrder(db: Database, orderId: string) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) throw notFound('Order');
  return order;
}

/**
 * The order's own payment. `null` when no gateway is configured (development
 * with `PAYMENT_PROVIDER=none`): the order simply stays unpaid.
 */
export async function startForOrder(
  db: Database,
  orderId: string,
  language: LanguageCode,
): Promise<PaymentStart | null> {
  if (!paymentGateway) return null;
  const order = await findOrder(db, orderId);
  if (!isPayable(order)) {
    throw conflict(`Order ${order.number} can no longer be paid online.`);
  }
  return begin(db, {
    orderId,
    orderNumber: order.number,
    rentalExtensionId: null,
    amount: order.total,
    currency: order.currency,
    email: order.email,
    description: `Order ${order.number}`,
    language,
  });
}

/** A renewal signed in the account, waiting for its money. */
export async function startForExtension(
  db: Database,
  extensionId: string,
  language: LanguageCode,
): Promise<PaymentStart | null> {
  if (!paymentGateway) return null;
  const extension = await db.query.rentalExtensions.findFirst({
    where: eq(rentalExtensions.id, extensionId),
  });
  if (!extension) throw notFound('Extension');
  if (extension.status !== 'renew_pending') {
    throw conflict('This renewal is no longer waiting for payment.');
  }
  const order = await findOrder(db, extension.orderId);
  return begin(db, {
    orderId: order.id,
    orderNumber: order.number,
    rentalExtensionId: extension.id,
    amount: extension.amount,
    currency: extension.currency,
    email: order.email,
    description: `Order ${order.number}, renewal +${extension.days} days`,
    language,
  });
}

interface BeginInput {
  orderId: string;
  orderNumber: string;
  rentalExtensionId: string | null;
  amount: string;
  currency: string;
  email: string;
  description: string;
  language: LanguageCode;
}

async function begin(db: Database, input: BeginInput): Promise<PaymentStart> {
  const gateway = paymentGateway;
  const feature = FEATURES.payments;
  if (!gateway || !feature) throw conflict('Online payment is not available.');

  const sequence = (await attempts.countForOrder(db, input.orderId)) + 1;
  /* Nexi asks for at most 18 characters: MIA-2026-001042 → MIA2026001042P1. */
  const reference = `${input.orderNumber.replaceAll('-', '')}P${sequence}`;
  const token = randomBytes(24).toString('base64url');

  const attempt = await attempts.insert(db, {
    orderId: input.orderId,
    rentalExtensionId: input.rentalExtensionId,
    provider: gateway.provider,
    providerReference: reference,
    accessToken: token,
    amount: input.amount,
    currency: input.currency,
  });

  const resultUrl = paymentResultUrl(token, input.language);
  try {
    const started = await gateway.start({
      reference,
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      email: input.email,
      language: input.language,
      resultUrl,
      cancelUrl: resultUrl,
      notificationUrl: `${feature.apiOrigin}/api/webhooks/payments/${gateway.provider}`,
    });
    await attempts.setSecret(db, attempt.id, started.secret);
    return { token, redirectUrl: started.redirectUrl };
  } catch (error) {
    console.error(`[payments] ${reference} could not be started:`, error);
    await attempts.finish(db, attempt.id, 'failed', {
      result: 'START_FAILED',
      operationId: null,
      circuit: null,
    });
    return { token, redirectUrl: null };
  }
}
