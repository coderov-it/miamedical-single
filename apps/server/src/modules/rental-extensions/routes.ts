import { P } from '@mia/permissions';
import {
  AdminRequestExtensionSchema,
  CancelExtensionSchema,
  LocaleOnlyQuerySchema,
  PlaceExtensionSchema,
  RecordExtensionPaymentSchema,
  RequestExtensionSchema,
  UuidSchema,
} from '@mia/validators';
import { Hono } from 'hono';
import * as v from 'valibot';

import {
  currentCustomer,
  currentUser,
  requireCustomer,
  requirePermission,
} from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { notFound } from '../../shared/http/errors.ts';
import { clientIp } from '../../shared/http/rate-limit.ts';
import { validate } from '../../shared/http/validate.ts';
import * as customerRepo from '../customer-account/repo.ts';
import * as renewal from './renewal.ts';
import * as service from './service.ts';

const IdParam = v.object({ id: UuidSchema });
const OrderIdParam = v.object({ orderId: UuidSchema });
const OrderNumberParam = v.object({
  number: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(40)),
});

export const rentalExtensionAdminRoutes = new Hono<AppEnv>()
  /** --------------------------------------------------------------------------
  GET /api/admin/rental-extensions/by-order/:orderId (rental:read)
  The order's extension options, open extension and history.
  -------------------------------------------------------------------------- **/
  .get(
    '/by-order/:orderId',
    requirePermission(P.RENTAL_READ),
    validate('param', OrderIdParam),
    validate('query', LocaleOnlyQuerySchema),
    async (c) => {
      const { orderId } = c.req.valid('param');
      const { locale } = c.req.valid('query');
      return c.json({ data: await service.getOverview(c.get('db'), orderId, locale) });
    },
  )
  /** --------------------------------------------------------------------------
  POST /api/admin/rental-extensions/by-order/:orderId (rental:update)
  Opens an extension for the customer, optionally at an agreed amount.
  -------------------------------------------------------------------------- **/
  .post(
    '/by-order/:orderId',
    requirePermission(P.RENTAL_UPDATE),
    validate('param', OrderIdParam),
    validate('json', AdminRequestExtensionSchema),
    async (c) => {
      const actor = { kind: 'admin' as const, id: currentUser(c).id };
      const { orderId } = c.req.valid('param');
      const data = await service.request(c.get('db'), orderId, c.req.valid('json'), actor);
      return c.json({ data }, 201);
    },
  )
  /** --------------------------------------------------------------------------
  POST /api/admin/rental-extensions/:id/payment (rental:update)
  Records the extension as paid and sends its renewal contract.
  -------------------------------------------------------------------------- **/
  .post(
    '/:id/payment',
    requirePermission(P.RENTAL_UPDATE),
    validate('param', IdParam),
    validate('json', RecordExtensionPaymentSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const data = await service.recordPayment(
        c.get('db'),
        id,
        c.req.valid('json'),
        currentUser(c),
      );
      return c.json({ data });
    },
  )
  /** --------------------------------------------------------------------------
  POST /api/admin/rental-extensions/:id/contract (rental:update)
  Issues a fresh renewal contract for a paid extension whose contract was voided.
  -------------------------------------------------------------------------- **/
  .post(
    '/:id/contract',
    requirePermission(P.RENTAL_UPDATE),
    validate('param', IdParam),
    async (c) => {
      const { id } = c.req.valid('param');
      return c.json({ data: await service.issueContract(c.get('db'), id, currentUser(c)) });
    },
  )
  /** --------------------------------------------------------------------------
  POST /api/admin/rental-extensions/:id/cancel (rental:update)
  Cancels an open extension and voids its unsigned contract.
  -------------------------------------------------------------------------- **/
  .post(
    '/:id/cancel',
    requirePermission(P.RENTAL_UPDATE),
    validate('param', IdParam),
    validate('json', CancelExtensionSchema),
    async (c) => {
      const actor = { kind: 'admin' as const, id: currentUser(c).id };
      const { id } = c.req.valid('param');
      const { reason } = c.req.valid('json');
      return c.json({ data: await service.cancel(c.get('db'), id, reason, actor) });
    },
  );

/** The customer's side: their own orders only — someone else's number 404s. */
export const rentalExtensionCustomerRoutes = new Hono<AppEnv>()
  /** --------------------------------------------------------------------------
  GET /api/customer/rental-extensions/:number (customer)
  What the customer can extend their order by, and any extension in progress.
  -------------------------------------------------------------------------- **/
  .get(
    '/:number',
    requireCustomer,
    validate('param', OrderNumberParam),
    validate('query', LocaleOnlyQuerySchema),
    async (c) => {
      const db = c.get('db');
      const { number } = c.req.valid('param');
      const orderId = await customerRepo.findOrderIdByNumber(db, currentCustomer(c).id, number);
      if (!orderId) throw notFound('Order');
      return c.json({ data: await service.getOverview(db, orderId, c.req.valid('query').locale) });
    },
  )
  /** --------------------------------------------------------------------------
  POST /api/customer/rental-extensions/:number/contract-preview (customer)
  The renewal contract the modal would sign for that length, as HTML; writes nothing.
  -------------------------------------------------------------------------- **/
  .post(
    '/:number/contract-preview',
    requireCustomer,
    validate('param', OrderNumberParam),
    validate('json', RequestExtensionSchema),
    async (c) => {
      const db = c.get('db');
      const { number } = c.req.valid('param');
      const orderId = await customerRepo.findOrderIdByNumber(db, currentCustomer(c).id, number);
      if (!orderId) throw notFound('Order');
      return c.json({ data: await renewal.previewRenewal(db, orderId, c.req.valid('json').days) });
    },
  )
  /** --------------------------------------------------------------------------
  POST /api/customer/rental-extensions/:number (customer)
  Renews with the contract signed in the modal; it waits for payment as renew_pending.
  -------------------------------------------------------------------------- **/
  .post(
    '/:number',
    requireCustomer,
    validate('param', OrderNumberParam),
    validate('json', PlaceExtensionSchema),
    async (c) => {
      const db = c.get('db');
      const customerId = currentCustomer(c).id;
      const { number } = c.req.valid('param');
      const orderId = await customerRepo.findOrderIdByNumber(db, customerId, number);
      if (!orderId) throw notFound('Order');
      const data = await renewal.placeRenewal(db, orderId, c.req.valid('json'), customerId, {
        ipAddress: clientIp(c),
        userAgent: c.req.header('user-agent') ?? null,
      });
      return c.json({ data }, 201);
    },
  )
  /** --------------------------------------------------------------------------
  POST /api/customer/rental-extensions/:number/cancel (customer)
  Withdraws the customer's own extension before it is paid; voids its signed contract.
  -------------------------------------------------------------------------- **/
  .post('/:number/cancel', requireCustomer, validate('param', OrderNumberParam), async (c) => {
    const db = c.get('db');
    const customerId = currentCustomer(c).id;
    const { number } = c.req.valid('param');
    const orderId = await customerRepo.findOrderIdByNumber(db, customerId, number);
    if (!orderId) throw notFound('Order');
    const overview = await service.getOverview(db, orderId, 'it');
    if (!overview.open) throw notFound('Open extension');
    const actor = { kind: 'customer' as const, id: customerId };
    const data = await service.cancel(db, overview.open.id, 'Withdrawn by the customer.', actor);
    return c.json({ data });
  });
