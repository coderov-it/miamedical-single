import { P } from '@mia/permissions';
import { RenewRentalSchema, RentalQuerySchema, UuidSchema } from '@mia/validators';
import { Hono } from 'hono';
import * as v from 'valibot';

import { currentUser, requirePermission } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { validate } from '../../shared/http/validate.ts';
import { toPageMeta } from '../products/mapper.ts';
import { toRentalSummary } from './mapper.ts';
import * as service from './service.ts';

const IdParam = v.object({ id: UuidSchema });

export const rentalAdminRoutes = new Hono<AppEnv>()
  .get(
    '/',
    requirePermission(P.RENTAL_READ),
    validate('query', RentalQuerySchema),
    async (c) => {
      const query = c.req.valid('query');
      const result = await service.list(c.get('db'), query);
      return c.json({
        data: result.rows.map(toRentalSummary),
        meta: toPageMeta(query.page, query.perPage, result.total),
      });
    },
  )
  .post(
    '/:id/reminder',
    requirePermission(P.RENTAL_UPDATE),
    validate('param', IdParam),
    async (c) => {
      await service.sendReminder(c.get('db'), c.req.valid('param').id);
      return c.json({ data: { success: true } });
    },
  )
  .post(
    '/:id/contract',
    requirePermission(P.RENTAL_UPDATE),
    validate('param', IdParam),
    async (c) => {
      await service.resendContract(c.get('db'), c.req.valid('param').id);
      return c.json({ data: { success: true } });
    },
  )
  .post(
    '/:id/renew',
    requirePermission(P.RENTAL_UPDATE),
    validate('param', IdParam),
    validate('json', RenewRentalSchema),
    async (c) => {
      const user = currentUser(c);
      await service.renew(c.get('db'), c.req.valid('param').id, c.req.valid('json'), user);
      return c.json({ data: { success: true } });
    },
  )
  .post(
    '/:id/finish',
    requirePermission(P.RENTAL_UPDATE),
    validate('param', IdParam),
    async (c) => {
      const user = currentUser(c);
      await service.finish(c.get('db'), c.req.valid('param').id, user);
      return c.json({ data: { success: true } });
    },
  );
