import { P } from '@mia/permissions';
import { PaymentQuerySchema } from '@mia/validators';
import { Hono } from 'hono';
import * as v from 'valibot';

import { requirePermission } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { validate } from '../../shared/http/validate.ts';
import { toPageMeta } from '../products/mapper.ts';
import { toCsv, toPaymentSummary } from './mapper.ts';
import * as service from './service.ts';

const DateOnlySchema = v.pipe(
  v.string(),
  v.trim(),
  v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.'),
);

const ExportQuerySchema = v.object({
  q: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(120))),
  paymentStatus: v.optional(
    v.picklist(['unpaid', 'authorized', 'paid', 'partially_refunded', 'refunded', 'failed']),
  ),
  type: v.optional(v.picklist(['rental', 'fixed'])),
  from: v.optional(DateOnlySchema),
  to: v.optional(DateOnlySchema),
});

export const paymentAdminRoutes = new Hono<AppEnv>()
  .get(
    '/',
    requirePermission(P.PAYMENT_READ),
    validate('query', PaymentQuerySchema),
    async (c) => {
      const query = c.req.valid('query');
      const result = await service.list(c.get('db'), query);
      return c.json({
        data: result.rows.map(toPaymentSummary),
        meta: toPageMeta(query.page, query.perPage, result.total),
        stats: result.stats,
      });
    },
  )
  .get(
    '/export',
    requirePermission(P.PAYMENT_READ),
    validate('query', ExportQuerySchema),
    async (c) => {
      const filters = c.req.valid('query');
      const rows = await service.exportCsv(c.get('db'), filters);
      const csv = toCsv(rows);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="payments-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    },
  );
