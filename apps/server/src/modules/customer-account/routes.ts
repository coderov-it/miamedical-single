import { PaginationSchema, UpdateCustomerProfileSchema } from '@mia/validators';
import { Hono } from 'hono';
import * as v from 'valibot';

import { currentCustomer, requireCustomer } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { notFound } from '../../shared/http/errors.ts';
import { validate } from '../../shared/http/validate.ts';
import { toCustomer } from '../customer-auth/mapper.ts';
import * as customerAuthRepo from '../customer-auth/repo.ts';
import { toCustomerOrderDetail, toCustomerOrderSummary } from './mapper.ts';
import * as orderLinks from './order-links.ts';
import * as repo from './repo.ts';

/**
 * A customer's own account, mounted at /api/customer. Everything behind
 * `requireCustomer`.
 *
 * There is no permission dimension: the only rule is "your own rows", which every
 * query enforces in its WHERE clause. An order number that is not theirs 404s
 * rather than 403s — per the rule in AGENTS.md, a hidden resource must not confirm
 * its own existence.
 */

const OrderNumberParamSchema = v.object({
  number: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(40)),
});

export const customerAccountRoutes = new Hono<AppEnv>()
  .get('/orders', requireCustomer, validate('query', PaginationSchema), async (c) => {
    const { page, perPage } = c.req.valid('query');
    const { rows, total } = await repo.listOrders(
      c.get('db'),
      currentCustomer(c).id,
      page,
      perPage,
    );

    return c.json({
      data: rows.map(toCustomerOrderSummary),
      meta: { page, perPage, total },
    });
  })

  .get('/orders/:number', requireCustomer, validate('param', OrderNumberParamSchema), async (c) => {
    const order = await repo.findOrderByNumber(
      c.get('db'),
      currentCustomer(c).id,
      c.req.valid('param').number,
    );
    if (!order) throw notFound('Order');

    return c.json({ data: toCustomerOrderDetail(order) });
  })

  /** "Yes, this was me." Idempotent — confirming twice is not an error. */
  .post(
    '/orders/:number/confirm',
    requireCustomer,
    validate('param', OrderNumberParamSchema),
    async (c) => {
      const db = c.get('db');
      const customerId = currentCustomer(c).id;
      const orderId = await repo.findOrderIdByNumber(db, customerId, c.req.valid('param').number);
      if (!orderId) throw notFound('Order');

      await orderLinks.confirmLink(db, orderId, customerId);

      return c.json({ data: { ok: true } });
    },
  )

  /**
   * "This is not my order." Unlinks it and leaves the order itself alone.
   *
   * The order does not disappear from the shop — it is a real order somebody
   * placed. What goes away is the claim that it belongs to this account, which is
   * also why it stops appearing in this list.
   */
  .post(
    '/orders/:number/reject',
    requireCustomer,
    validate('param', OrderNumberParamSchema),
    async (c) => {
      const db = c.get('db');
      const customerId = currentCustomer(c).id;
      const orderId = await repo.findOrderIdByNumber(db, customerId, c.req.valid('param').number);
      if (!orderId) throw notFound('Order');

      await orderLinks.rejectLink(db, orderId, customerId);

      return c.json({ data: { ok: true } });
    },
  )

  /**
   * Name and phone only. Email is absent from the schema, not merely ignored:
   * accepting a new address without re-verifying it would hand over every future
   * magic link to whoever typed it.
   */
  .patch('/profile', requireCustomer, validate('json', UpdateCustomerProfileSchema), async (c) => {
    const db = c.get('db');
    const customerId = currentCustomer(c).id;

    await customerAuthRepo.updateProfile(db, customerId, c.req.valid('json'));

    const row = await customerAuthRepo.findById(db, customerId);
    if (!row) throw notFound('Account');

    return c.json({ data: toCustomer(row) });
  });
