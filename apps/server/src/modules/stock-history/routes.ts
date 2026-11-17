/** HTTP edge only: validate, delegate to the service. */

import { P } from '@mia/permissions';
import { Hono } from 'hono';

import { requirePermission } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { DayRangeError } from '../../shared/day-range.ts';
import { httpError } from '../../shared/http/errors.ts';
import { validate } from '../../shared/http/validate.ts';
import * as service from './service.ts';
import { StockHistoryParamSchema, StockHistoryQuerySchema } from './validators.ts';

export const stockHistoryAdminRoutes = new Hono<AppEnv>()
  /** --------------------------------------------------------------------------
  GET /api/admin/products/:id/stock-history (product:read)
  A product's closing stock per day and its stock movements over a date range.
  -------------------------------------------------------------------------- **/
  .get(
    '/:id/stock-history',
    requirePermission(P.PRODUCT_READ),
    validate('param', StockHistoryParamSchema),
    validate('query', StockHistoryQuerySchema),
    async (c) => {
      try {
        const data = await service.stockHistory(
          c.get('db'),
          c.req.valid('param').id,
          c.req.valid('query'),
        );
        return c.json({ data });
      } catch (error) {
        if (!(error instanceof DayRangeError)) throw error;
        throw httpError(422, 'Invalid query.', 'validation_failed', {
          fields: { [error.field]: error.message },
        });
      }
    },
  );
