/** HTTP edge only: validate, delegate to a service, map records to DTOs. */

import { P } from '@mia/permissions';
import { PlaceOrderSchema } from '@mia/validators';
import { Hono } from 'hono';

import { requirePermission } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { clientIp, rateLimit } from '../../shared/http/rate-limit.ts';
import { validate } from '../../shared/http/validate.ts';
import { toPageMeta } from '../products/mapper.ts';
import {
  toCartDetail,
  toCartSummary,
  toOrderDetail,
  toOrderSummary,
  toPlacedOrder,
} from './mapper.ts';
import * as service from './service.ts';
import {
  AdminCartQuerySchema,
  AdminOrderQuerySchema,
  AdminUpdateOrderSchema,
  CartIdParamSchema,
  OrderIdParamSchema,
  OrderStatusTransitionSchema,
  PaymentStatusTransitionSchema,
} from './validators.ts';

/**
 * The one public write in this API, so it is throttled before validation.
 *
 * Generous on purpose: a hotel or a clinic behind one NAT address is exactly the
 * customer this shop wants, and locking them out to stop a script nobody has seen
 * yet would be the wrong trade. Successes count too — unlike the login limiter,
 * where only failures are interesting — because the thing being bounded here is
 * how many rows one address can write.
 */
const placementRateLimit = rateLimit({ limit: 30, windowMs: 60 * 60 * 1000 });

/**
 * Placing an order needs no account: the storefront takes rentals from people who
 * have never signed in, which is why the customer's contact block travels in the
 * body. It carries no money — every amount is rebuilt from the catalogue in
 * `resolve.ts` — so the worst a crafted request can do is order the wrong thing
 * at the right price.
 *
 * 201 with the order number: the storefront reads it back to the customer, and it
 * is the reference the phone call opens with.
 */
export const orderPublicRoutes = new Hono<AppEnv>().post(
  '/',
  placementRateLimit,
  validate('json', PlaceOrderSchema),
  async (c) => {
    /*
      `withCustomerSession` has already run on /api/*, so a signed-in customer is
      simply available here. When one is present the order links to their account
      as `confirmed`; otherwise placement resolves an account from the email and
      marks the link `unverified`.
    */
    const placed = await service.place(c.get('db'), c.req.valid('json'), {
      session: c.get('customer'),
      ipAddress: clientIp(c),
    });
    return c.json({ data: toPlacedOrder(placed) }, 201);
  },
);

export const orderAdminRoutes = new Hono<AppEnv>()
  .get(
    '/',
    requirePermission(P.ORDER_READ),
    validate('query', AdminOrderQuerySchema),
    async (c) => {
      const query = c.req.valid('query');
      const result = await service.list(c.get('db'), query);

      return c.json({
        data: result.rows.map(toOrderSummary),
        meta: toPageMeta(query.page, query.perPage, result.total),
        stats: {
          awaitingCount: result.stats.awaitingCount,
          pageValue: result.stats.pageValue,
          // Single-currency shop today. Reading it off the first row rather than
          // hardcoding means a mixed-currency future surfaces here, not silently.
          currency: result.rows[0]?.currency ?? 'EUR',
        },
      });
    },
  )

  /**
   * Registered before `/:id` so the literal segment is never swallowed by the
   * parameter route.
   */
  .get('/stats', requirePermission(P.ORDER_READ), async (c) => {
    return c.json({ data: await service.windowStats(c.get('db'), 30) });
  })

  .get(
    '/:id',
    requirePermission(P.ORDER_READ),
    validate('param', OrderIdParamSchema),
    async (c) => {
      const order = await service.getById(c.get('db'), c.req.valid('param').id);
      return c.json({ data: toOrderDetail(order) });
    },
  )

  .patch(
    '/:id',
    requirePermission(P.ORDER_UPDATE),
    validate('param', OrderIdParamSchema),
    validate('json', AdminUpdateOrderSchema),
    async (c) => {
      const order = await service.update(c.get('db'), c.req.valid('param').id, c.req.valid('json'));
      return c.json({ data: toOrderDetail(order) });
    },
  )

  /**
   * Every mutation returns the whole refreshed detail, so the client's cache
   * story stays `order = updated` — no second GET, no partial merge, and the
   * newly written timeline entry arrives with the change that caused it.
   */
  .post(
    '/:id/status',
    requirePermission(P.ORDER_UPDATE),
    validate('param', OrderIdParamSchema),
    validate('json', OrderStatusTransitionSchema),
    async (c) => {
      const { to, note } = c.req.valid('json');
      const order = await service.moveStatus(
        c.get('db'),
        c.req.valid('param').id,
        to,
        note ?? null,
        c.get('user'),
      );
      return c.json({ data: toOrderDetail(order) });
    },
  )

  .post(
    '/:id/payment',
    requirePermission(P.ORDER_UPDATE),
    validate('param', OrderIdParamSchema),
    validate('json', PaymentStatusTransitionSchema),
    async (c) => {
      const { to, note } = c.req.valid('json');
      const order = await service.movePaymentStatus(
        c.get('db'),
        c.req.valid('param').id,
        to,
        note ?? null,
        c.get('user'),
      );
      return c.json({ data: toOrderDetail(order) });
    },
  );

/**
 * Carts reuse `ORDER_READ` rather than minting a `CART_*` block: a cart is a
 * pre-order, anyone who may read orders may read them, and the view is
 * read-only so there is nothing to authorise beyond looking.
 */
export const cartAdminRoutes = new Hono<AppEnv>()
  .get('/', requirePermission(P.ORDER_READ), validate('query', AdminCartQuerySchema), async (c) => {
    const query = c.req.valid('query');
    const result = await service.listCarts(c.get('db'), query);
    const now = new Date();

    return c.json({
      data: result.rows.map((row) => toCartSummary(row, now)),
      meta: toPageMeta(query.page, query.perPage, result.total),
    });
  })

  .get('/:id', requirePermission(P.ORDER_READ), validate('param', CartIdParamSchema), async (c) => {
    const cart = await service.getCartById(c.get('db'), c.req.valid('param').id);
    return c.json({ data: toCartDetail(cart) });
  });
