/** HTTP edge only: validate, delegate to the service. */

import { P } from '@mia/permissions';
import { Hono } from 'hono';

import { requirePermission } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { DayRangeError } from '../../shared/day-range.ts';
import { httpError } from '../../shared/http/errors.ts';
import { validate } from '../../shared/http/validate.ts';
import * as service from './service.ts';
import { viewsReport } from './views-service.ts';
import { SalesQuerySchema } from './validators.ts';

/** A bad range is the caller's mistake: 422 on the offending field. */
function asValidationError(error: unknown): never {
  if (!(error instanceof DayRangeError)) throw error;
  throw httpError(422, 'Invalid query.', 'validation_failed', {
    fields: { [error.field]: error.message },
  });
}

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
        return asValidationError(error);
      }
    },
  )

  /** --------------------------------------------------------------------------
  GET /api/admin/analytics/views (order:read)
  Product page views over a date range, bucketed, with the previous period and the most viewed products.
  -------------------------------------------------------------------------- **/
  .get(
    '/views',
    requirePermission(P.ORDER_READ),
    validate('query', SalesQuerySchema),
    async (c) => {
      try {
        return c.json({ data: await viewsReport(c.get('db'), c.req.valid('query')) });
      } catch (error) {
        return asValidationError(error);
      }
    },
  );
