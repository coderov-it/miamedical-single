/**
 * HTTP edge of the manual-order endpoints, mounted into `orderAdminRoutes`
 * (`/api/admin/orders`) ahead of `/:id` so `/customer-accounts` is never taken for an id.
 * Docs: docs/code/manual-orders.md.
 */

import { P } from '@mia/permissions';
import {
  CustomerAccountSearchSchema,
  LineProductSearchSchema,
  ManualOrderQuoteSchema,
  ManualOrderSchema,
  ManualDiscountSchema,
  RecordPaymentSchema,
  SendOrderLinkSchema,
} from '@mia/validators';
import { Hono } from 'hono';

import { currentUser, requirePermission } from '../../../shared/auth/guards.ts';
import { notFound } from '../../../shared/http/errors.ts';
import type { AppEnv } from '../../../shared/http/context.ts';
import { validate } from '../../../shared/http/validate.ts';
import { issueLink } from '../../order-links/service.ts';
import { toOrderDetail } from '../mapper.ts';
import { OrderIdParamSchema } from '../validators.ts';
import { searchAccounts } from './accounts.ts';
import { createManualOrder } from './create.ts';
import { setDiscount } from './discount.ts';
import { recordPayment } from './payment.ts';
import { getLineProduct, searchLineProducts } from './products.ts';
import { quoteManualOrder } from './quote.ts';

export const manualOrderRoutes = new Hono<AppEnv>()
  /** --------------------------------------------------------------------------
  GET /api/admin/orders/customer-accounts (order:create)
  Customer accounts matching a search, email matches first, with prefill from their latest order.
  -------------------------------------------------------------------------- **/
  .get(
    '/customer-accounts',
    requirePermission(P.ORDER_CREATE),
    validate('query', CustomerAccountSearchSchema),
    async (c) => {
      return c.json({ data: await searchAccounts(c.get('db'), c.req.valid('query').q) });
    },
  )

  /** --------------------------------------------------------------------------
  GET /api/admin/orders/manual/products (order:create)
  One page of sellable products, best sellers first (search, category, sale/rental filters) with image, from-price, stock and the choices a line needs.
  -------------------------------------------------------------------------- **/
  .get(
    '/manual/products',
    requirePermission(P.ORDER_CREATE),
    validate('query', LineProductSearchSchema),
    async (c) => {
      const found = await searchLineProducts(c.get('db'), c.req.valid('query'), c.get('user'));
      return c.json({ data: found.rows, meta: found.meta });
    },
  )

  /** --------------------------------------------------------------------------
  GET /api/admin/orders/manual/products/:id (order:create)
  One sellable product with the packages, add-ons and questions its line asks about.
  -------------------------------------------------------------------------- **/
  .get(
    '/manual/products/:id',
    requirePermission(P.ORDER_CREATE),
    validate('param', OrderIdParamSchema),
    async (c) => {
      const product = await getLineProduct(c.get('db'), c.req.valid('param').id);
      if (!product) throw notFound('Product');
      return c.json({ data: product });
    },
  )

  /** --------------------------------------------------------------------------
  POST /api/admin/orders/manual/quote (order:create)
  Prices the lines of a manual order, with discount and delivery fee; writes nothing.
  -------------------------------------------------------------------------- **/
  .post(
    '/manual/quote',
    requirePermission(P.ORDER_CREATE),
    validate('json', ManualOrderQuoteSchema),
    async (c) => {
      return c.json({ data: await quoteManualOrder(c.get('db'), c.req.valid('json')) });
    },
  )

  /** --------------------------------------------------------------------------
  POST /api/admin/orders/manual (order:create)
  Creates a pending manual order for a customer who phoned or wrote.
  -------------------------------------------------------------------------- **/
  .post(
    '/manual',
    requirePermission(P.ORDER_CREATE),
    validate('json', ManualOrderSchema),
    async (c) => {
      const created = await createManualOrder(c.get('db'), c.req.valid('json'), currentUser(c));
      return c.json({ data: created }, 201);
    },
  )

  /** --------------------------------------------------------------------------
  POST /api/admin/orders/:id/discount (order:create)
  Sets or replaces the discount of a pending manual order; a reason is required.
  -------------------------------------------------------------------------- **/
  .post(
    '/:id/discount',
    requirePermission(P.ORDER_CREATE),
    validate('param', OrderIdParamSchema),
    validate('json', ManualDiscountSchema),
    async (c) => {
      const order = await setDiscount(
        c.get('db'),
        c.req.valid('param').id,
        c.req.valid('json'),
        currentUser(c),
      );
      return c.json({ data: toOrderDetail(order) });
    },
  )

  /** --------------------------------------------------------------------------
  POST /api/admin/orders/:id/link (order:create)
  Mints the private completion link (revoking the previous one); emails it or returns it to copy.
  -------------------------------------------------------------------------- **/
  .post(
    '/:id/link',
    requirePermission(P.ORDER_CREATE),
    validate('param', OrderIdParamSchema),
    validate('json', SendOrderLinkSchema),
    async (c) => {
      const link = await issueLink(
        c.get('db'),
        c.req.valid('param').id,
        c.req.valid('json'),
        currentUser(c),
      );
      return c.json({ data: link });
    },
  )

  /** --------------------------------------------------------------------------
  POST /api/admin/orders/:id/record-payment (order:update)
  Records a payment taken outside the gateway and moves the order to paid.
  -------------------------------------------------------------------------- **/
  .post(
    '/:id/record-payment',
    requirePermission(P.ORDER_UPDATE),
    validate('param', OrderIdParamSchema),
    validate('json', RecordPaymentSchema),
    async (c) => {
      const order = await recordPayment(
        c.get('db'),
        c.req.valid('param').id,
        c.req.valid('json'),
        currentUser(c),
      );
      return c.json({ data: toOrderDetail(order) });
    },
  );
