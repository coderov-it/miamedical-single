import { Hono } from 'hono';

import type { AppEnv } from '../../shared/http/context.ts';
import * as service from './service.ts';

/** Public platform settings, mounted at /api/settings. */
export const settingsPublicRoutes = new Hono<AppEnv>()
  /** --------------------------------------------------------------------------
  GET /api/settings/delivery (public)
  The fallback home-delivery fee the storefront shows for products without their own.
  -------------------------------------------------------------------------- **/
  .get('/delivery', async (c) => {
    const { fallback } = await service.getDeliveryFeeSettings(c.get('db'));
    return c.json({ data: { fallbackFee: fallback } });
  });
