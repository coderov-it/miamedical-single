/** HTTP edge of the customer's private order link. Docs: docs/code/manual-orders.md. */

import {
  DEFAULT_LANGUAGE,
  OrderLinkDetailsSchema,
  OrderLinkPaymentSchema,
  OrderLinkQuerySchema,
  OrderLinkSignSchema,
} from '@mia/validators';
import { Hono } from 'hono';

import type { AppEnv } from '../../shared/http/context.ts';
import { clientIp, rateLimit } from '../../shared/http/rate-limit.ts';
import { validate } from '../../shared/http/validate.ts';
import { saveDetails } from './details.ts';
import { startLinkPayment } from './payment.ts';
import { readSummary } from './read.ts';
import { previewLinkContract, signFromLink } from './sign.ts';

/* The token is the only authorisation, so every call is throttled: reads loosely (the page
   re-reads after each step), writes tighter. Per client address, like the other public routes. */
const readLimit = rateLimit({ limit: 300, windowMs: 60 * 60 * 1000 });
const writeLimit = rateLimit({ limit: 60, windowMs: 60 * 60 * 1000 });

export const orderLinkPublicRoutes = new Hono<AppEnv>()
  /** --------------------------------------------------------------------------
  GET /api/order-links (public, order link token)
  The order summary, the steps the link allows and the details still missing.
  -------------------------------------------------------------------------- **/
  .get('/', readLimit, validate('query', OrderLinkQuerySchema), async (c) => {
    return c.json({ data: await readSummary(c.get('db'), c.req.valid('query').token) });
  })

  /** --------------------------------------------------------------------------
  PUT /api/order-links/details (public, order link token)
  Saves the customer's own details; refused once the contract is signed.
  -------------------------------------------------------------------------- **/
  .put(
    '/details',
    writeLimit,
    validate('query', OrderLinkQuerySchema),
    validate('json', OrderLinkDetailsSchema),
    async (c) => {
      const data = await saveDetails(c.get('db'), c.req.valid('query').token, c.req.valid('json'));
      return c.json({ data });
    },
  )

  /** --------------------------------------------------------------------------
  POST /api/order-links/contract-preview (public, order link token)
  The rental contract as HTML with the order total it states; writes nothing.
  -------------------------------------------------------------------------- **/
  .post('/contract-preview', readLimit, validate('query', OrderLinkQuerySchema), async (c) => {
    return c.json({ data: await previewLinkContract(c.get('db'), c.req.valid('query').token) });
  })

  /** --------------------------------------------------------------------------
  POST /api/order-links/sign (public, order link token)
  Signs the contract (born signed) in one transaction; the receipt email follows.
  -------------------------------------------------------------------------- **/
  .post(
    '/sign',
    writeLimit,
    validate('query', OrderLinkQuerySchema),
    validate('json', OrderLinkSignSchema),
    async (c) => {
      await signFromLink(c.get('db'), c.req.valid('query').token, c.req.valid('json'), {
        ipAddress: clientIp(c),
        userAgent: c.req.header('user-agent') ?? 'unknown',
      });
      return c.json({ data: { signed: true } }, 201);
    },
  )

  /** --------------------------------------------------------------------------
  POST /api/order-links/payment (public, order link token)
  Re-checks readiness under the order lock, then opens the Nexi session.
  -------------------------------------------------------------------------- **/
  .post(
    '/payment',
    writeLimit,
    validate('query', OrderLinkQuerySchema),
    validate('json', OrderLinkPaymentSchema),
    async (c) => {
      const language = c.req.valid('json').language ?? DEFAULT_LANGUAGE;
      const started = await startLinkPayment(c.get('db'), c.req.valid('query').token, language);
      return c.json({ data: started }, 201);
    },
  );
