import { P } from '@mia/permissions';
import { NotificationRecipientsSchema } from '@mia/validators';
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
  );
