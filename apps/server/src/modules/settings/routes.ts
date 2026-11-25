import { P } from '@mia/permissions';
import { DeliveryFeeSettingsSchema, NotificationRecipientsSchema } from '@mia/validators';
import { Hono } from 'hono';

import { currentUser, requirePermission } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { validate } from '../../shared/http/validate.ts';
import * as service from './service.ts';

/**
 * Platform settings, mounted at /api/admin/settings.
 *
 * Guarded by the 1600 Settings codes, which were defined in the catalog long
 * before anything used them.
 */
export const settingsAdminRoutes = new Hono<AppEnv>()
  /** --------------------------------------------------------------------------
  GET /api/admin/settings/notifications (setting:read)
  The addresses that receive order and dispute notifications.
  -------------------------------------------------------------------------- **/
  .get('/notifications', requirePermission(P.SETTING_READ), async (c) => {
    const data = await service.getNotificationRecipients(c.get('db'));
    return c.json({ data });
  })
  /** --------------------------------------------------------------------------
  PUT /api/admin/settings/notifications (setting:update)
  Replaces the notification recipient list.
  -------------------------------------------------------------------------- **/
  .put(
    '/notifications',
    requirePermission(P.SETTING_UPDATE),
    validate('json', NotificationRecipientsSchema),
    async (c) => {
      const data = await service.setNotificationRecipients(
        c.get('db'),
        c.req.valid('json'),
        currentUser(c).id,
      );
      return c.json({ data });
    },
  )
  /** --------------------------------------------------------------------------
  GET /api/admin/settings/delivery (setting:read)
  The fallback home-delivery fee for products that carry none of their own.
  -------------------------------------------------------------------------- **/
  .get('/delivery', requirePermission(P.SETTING_READ), async (c) => {
    const data = await service.getDeliveryFeeSettings(c.get('db'));
    return c.json({ data });
  })
  /** --------------------------------------------------------------------------
  PUT /api/admin/settings/delivery (setting:update)
  Replaces the fallback home-delivery fee; `null` clears it.
  -------------------------------------------------------------------------- **/
  .put(
    '/delivery',
    requirePermission(P.SETTING_UPDATE),
    validate('json', DeliveryFeeSettingsSchema),
    async (c) => {
      const data = await service.setDeliveryFeeSettings(
        c.get('db'),
        c.req.valid('json'),
        currentUser(c).id,
      );
      return c.json({ data });
    },
  );
