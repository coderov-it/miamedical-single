import { P } from '@mia/permissions';
import {
  CreateOrderDisputeSchema,
  OrderDisputeStatusSchema,
  PaginationSchema,
  UpdateOrderDisputeSchema,
} from '@mia/validators';
import { Hono } from 'hono';
import * as v from 'valibot';

import { currentUser, requirePermission } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { clientIp, rateLimit } from '../../shared/http/rate-limit.ts';
import { validate } from '../../shared/http/validate.ts';
import * as service from './service.ts';

/**
 * Order disputes. Two routers: a public one the emailed link reaches, and an admin
 * one behind the new 1113/1114 permission codes.
 */

/**
 * Tight, and keyed on the caller rather than a token: the token is single-use, so
 * the thing worth limiting is somebody grinding through guesses at other people's.
 */
const reportRateLimit = rateLimit({ limit: 5, windowMs: 60 * 60 * 1000 });

export const orderDisputePublicRoutes = new Hono<AppEnv>().post(
  '/',
  reportRateLimit,
  validate('json', CreateOrderDisputeSchema),
  async (c) => {
    const { id } = await service.create(c.get('db'), c.req.valid('json'), {
      ipAddress: clientIp(c),
      userAgent: c.req.header('user-agent') ?? null,
    });

    /*
      The id is echoed so the page can show a reference, but nothing about the
      order is: whoever holds this link may be the wrong person, and confirming
      what was ordered or by whom would be the leak the report exists to report.
    */
    return c.json({ data: { id, message: 'Grazie, abbiamo ricevuto la tua segnalazione.' } }, 201);
  },
);

const ListQuerySchema = v.object({
  ...PaginationSchema.entries,
  status: v.optional(OrderDisputeStatusSchema),
});

const IdParamSchema = v.object({ id: v.pipe(v.string(), v.uuid()) });

export const orderDisputeAdminRoutes = new Hono<AppEnv>()
  .get(
    '/',
    requirePermission(P.ORDER_DISPUTE_READ),
    validate('query', ListQuerySchema),
    async (c) => {
      const { page, perPage, status } = c.req.valid('query');
      const { rows, total, openCount } = await service.list(c.get('db'), { page, perPage, status });

      return c.json({
        data: rows.map((row) => ({
          id: row.dispute.id,
          orderNumber: row.orderNumber,
          orderEmail: row.orderEmail,
          accountEmail: row.accountEmail,
          reportedPhone: row.dispute.reportedPhone,
          status: row.dispute.status,
          createdAt: row.dispute.createdAt.toISOString(),
        })),
        meta: { page, perPage, total, openCount },
      });
    },
  )

  .get(
    '/:id',
    requirePermission(P.ORDER_DISPUTE_READ),
    validate('param', IdParamSchema),
    async (c) => {
      const row = await service.findById(c.get('db'), c.req.valid('param').id);

      return c.json({
        data: {
          id: row.dispute.id,
          orderNumber: row.orderNumber,
          orderEmail: row.orderEmail,
          orderPhone: row.orderPhone,
          orderTotal: row.orderTotal,
          orderCurrency: row.orderCurrency,
          accountEmail: row.accountEmail,
          reportedPhone: row.dispute.reportedPhone,
          message: row.dispute.message,
          status: row.dispute.status,
          adminNotes: row.dispute.adminNotes,
          resolvedAt: row.dispute.resolvedAt?.toISOString() ?? null,
          createdAt: row.dispute.createdAt.toISOString(),
        },
      });
    },
  )

  .patch(
    '/:id',
    requirePermission(P.ORDER_DISPUTE_UPDATE),
    validate('param', IdParamSchema),
    validate('json', UpdateOrderDisputeSchema),
    async (c) => {
      const row = await service.update(
        c.get('db'),
        c.req.valid('param').id,
        c.req.valid('json'),
        currentUser(c).id,
      );

      return c.json({
        data: {
          id: row.dispute.id,
          status: row.dispute.status,
          adminNotes: row.dispute.adminNotes,
          resolvedAt: row.dispute.resolvedAt?.toISOString() ?? null,
        },
      });
    },
  );
