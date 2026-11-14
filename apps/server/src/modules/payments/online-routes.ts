/** Online payment HTTP edge. Walk-through: docs/code/online-payments.md. */

import { DEFAULT_LANGUAGE, PaymentTokenParamSchema, StartPaymentSchema } from '@mia/validators';
import { Hono } from 'hono';
import * as v from 'valibot';

import { currentCustomer, requireCustomer } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { conflict, httpError, notFound } from '../../shared/http/errors.ts';
import { rateLimit } from '../../shared/http/rate-limit.ts';
import { validate } from '../../shared/http/validate.ts';
import * as customerRepo from '../customer-account/repo.ts';
import * as extensionRepo from '../rental-extensions/repo.ts';
import { readResult, retry } from './result.ts';
import { handleNotice } from './settle.ts';
import { isPayable, startForExtension, startForOrder } from './start.ts';

/* A result page polls while the gateway confirms; a retry starts a session. */
const readLimit = rateLimit({ limit: 300, windowMs: 60 * 60 * 1000 });
const startLimit = rateLimit({ limit: 30, windowMs: 60 * 60 * 1000 });

const OrderNumberParamSchema = v.object({
  number: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(40)),
});

export const paymentPublicRoutes = new Hono<AppEnv>()
  /** --------------------------------------------------------------------------
  GET /api/payments/:token (public)
  One payment attempt's outcome for the result page, asking the gateway if still open.
  -------------------------------------------------------------------------- **/
  .get('/:token', readLimit, validate('param', PaymentTokenParamSchema), async (c) => {
    return c.json({ data: await readResult(c.get('db'), c.req.valid('param').token) });
  })

  /** --------------------------------------------------------------------------
  POST /api/payments/:token/retry (public)
  Starts a fresh gateway session for the same order or renewal.
  -------------------------------------------------------------------------- **/
  .post(
    '/:token/retry',
    startLimit,
    validate('param', PaymentTokenParamSchema),
    validate('json', StartPaymentSchema),
    async (c) => {
      const language = c.req.valid('json').language ?? DEFAULT_LANGUAGE;
      const started = await retry(c.get('db'), c.req.valid('param').token, language);
      if (!started) throw conflict('Online payment is not available.');
      return c.json({ data: started }, 201);
    },
  );

export const paymentWebhookRoutes = new Hono<AppEnv>()
  /** --------------------------------------------------------------------------
  POST /api/webhooks/payments/:provider (public)
  The gateway's server-to-server outcome; checked against the stored secret, then settled.
  -------------------------------------------------------------------------- **/
  .post('/:provider', async (c) => {
    const body = await c.req.json().catch(() => null);
    const outcome = await handleNotice(c.get('db'), body);
    if (outcome === 'refused') throw httpError(403, 'Notification refused.', 'forbidden');
    /* 200 for anything we do not know too, so the gateway stops resending it. */
    return c.json({ data: { outcome } });
  });

export const paymentCustomerRoutes = new Hono<AppEnv>()
  /** --------------------------------------------------------------------------
  POST /api/customer/payments/orders/:number (customer)
  "Pay now" in the account: pays the unpaid order, or its signed renewal.
  -------------------------------------------------------------------------- **/
  .post(
    '/orders/:number',
    requireCustomer,
    startLimit,
    validate('param', OrderNumberParamSchema),
    validate('json', StartPaymentSchema),
    async (c) => {
      const db = c.get('db');
      const language = c.req.valid('json').language ?? DEFAULT_LANGUAGE;
      const order = await customerRepo.findOrderByNumber(
        db,
        currentCustomer(c).id,
        c.req.valid('param').number,
      );
      if (!order) throw notFound('Order');

      if (isPayable(order)) {
        const started = await startForOrder(db, order.id, language);
        if (!started) throw conflict('Online payment is not available.');
        return c.json({ data: started }, 201);
      }

      const renewal = (await extensionRepo.findByOrderId(db, order.id)).find(
        (extension) =>
          extension.status === 'renew_pending' && extension.contractStatus === 'signed',
      );
      if (!renewal) throw conflict(`Order ${order.number} has nothing left to pay online.`);
      const started = await startForExtension(db, renewal.id, language);
      if (!started) throw conflict('Online payment is not available.');
      return c.json({ data: started }, 201);
    },
  );
