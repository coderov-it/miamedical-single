/** HTTP edge only: validate, delegate to the service, map the order to its DTO. */

import { P } from '@mia/permissions';
import { Hono } from 'hono';

import { requirePermission } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { validate } from '../../shared/http/validate.ts';
import { toOrderDetail } from '../orders/mapper.ts';
import { OrderIdParamSchema } from '../orders/validators.ts';
import * as service from './service.ts';
import { RecordRefundSchema } from './validators.ts';

export const orderRefundAdminRoutes = new Hono<AppEnv>()
  /** --------------------------------------------------------------------------
  POST /api/admin/orders/:id/refunds (order:refund)
  Records money given back on an order; the order's totals and payment status follow.
  -------------------------------------------------------------------------- **/
  .post(
    '/:id/refunds',
    requirePermission(P.ORDER_REFUND),
    validate('param', OrderIdParamSchema),
    validate('json', RecordRefundSchema),
    async (c) => {
      const order = await service.recordRefund(
        c.get('db'),
        c.req.valid('param').id,
        c.req.valid('json'),
        c.get('user'),
      );
      return c.json({ data: toOrderDetail(order) }, 201);
    },
  );
