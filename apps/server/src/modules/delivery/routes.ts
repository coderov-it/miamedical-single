import { P } from '@mia/permissions';
import {
  CreateZoneSchema,
  QuoteSchema,
  UpdateZoneSchema,
  ZoneIdParamSchema,
} from '@mia/validators';
import { Hono } from 'hono';

import { requirePermission } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { validate } from '../../shared/http/validate.ts';
import * as service from './service.ts';

/**
 * The quote endpoint is public and unauthenticated: it is asked before a customer
 * has an account, and the only thing it discloses is the shop's own price list.
 *
 * POST rather than GET because it is the checkout asking a question about a
 * specific address, and an address is not something to leave in a URL, a proxy log
 * or a referrer header.
 */
export const deliveryPublicRoutes = new Hono<AppEnv>().post(
  '/quote',
  validate('json', QuoteSchema),
  async (c) => {
    const quote = await service.resolveQuote(c.get('db'), c.req.valid('json'));
    return c.json({ data: quote });
  },
);

export const deliveryZoneAdminRoutes = new Hono<AppEnv>()
  /** The whole tree, nested. Small enough that there is nothing to paginate. */
  .get('/', requirePermission(P.DELIVERY_ZONE_READ), async (c) => {
    return c.json({ data: await service.getTree(c.get('db')) });
  })

  .post(
    '/',
    requirePermission(P.DELIVERY_ZONE_CREATE),
    validate('json', CreateZoneSchema),
    async (c) => {
      const zone = await service.createZone(c.get('db'), c.req.valid('json'));
      return c.json({ data: zone }, 201);
    },
  )

  .patch(
    '/:id',
    requirePermission(P.DELIVERY_ZONE_UPDATE),
    validate('param', ZoneIdParamSchema),
    validate('json', UpdateZoneSchema),
    async (c) => {
      const zone = await service.updateZone(
        c.get('db'),
        c.req.valid('param').id,
        c.req.valid('json'),
      );
      return c.json({ data: zone });
    },
  )

  /** Takes the subtree with it — the client warns, the foreign key does it. */
  .delete(
    '/:id',
    requirePermission(P.DELIVERY_ZONE_DELETE),
    validate('param', ZoneIdParamSchema),
    async (c) => {
      await service.deleteZone(c.get('db'), c.req.valid('param').id);
      return c.json({ data: { deleted: true } });
    },
  );
