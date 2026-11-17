/** HTTP edge only: validate, delegate to the service. */

import { P } from '@mia/permissions';
import { Hono } from 'hono';

import { requirePermission } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { DayRangeError } from '../../shared/day-range.ts';
import { httpError } from '../../shared/http/errors.ts';
import { validate } from '../../shared/http/validate.ts';
import * as service from './service.ts';
import { SalesQuerySchema } from './validators.ts';

export const analyticsAdminRoutes = new Hono<AppEnv>()
  /** --------------------------------------------------------------------------
  GET /api/admin/analytics/sales (order:read)
  Revenue, orders and units over a date range, bucketed, with the previous period.
  -------------------------------------------------------------------------- **/
  .get(
    '/sales',
    requirePermission(P.ORDER_READ),
    validate('query', SalesQuerySchema),
    async (c) => {
      try {
        return c.json({ data: await service.salesReport(c.get('db'), c.req.valid('query')) });
      } catch (error) {
        if (!(error instanceof DayRangeError)) throw error;
        throw httpError(422, 'Invalid query.', 'validation_failed', {
          fields: { [error.field]: error.message },
        });
      }
    },
  );
