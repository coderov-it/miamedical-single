import {
  effectivePreferences,
  NotificationPreferencesSchema,
  PushDeviceRegisterSchema,
  PushDeviceUnregisterSchema,
  type NotificationPreferences,
} from '@mia/validators';
import { Hono } from 'hono';

import { currentCustomer, requireCustomer } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { validate } from '../../shared/http/validate.ts';
import * as repo from './repo.ts';

/**
 * The two things the mobile app posts, and the two the preference screen reads
 * and writes.
 *
 * Everything here is behind `requireCustomer`, which is what makes push
 * signed-in-only. That is not a limitation we chose so much as the only safe
 * answer: a device row has to name an account, and the sole proof of which
 * account a handset belongs to is a session. Binding a token to an order number
 * or a typed email would let anyone who learned an order number subscribe to it.
 * The consequence for guest checkouts is worked through in
 * docs/code/push-notifications.md.
 */

export const pushDeviceRoutes = new Hono<AppEnv>()
  /** --------------------------------------------------------------------------
  POST /api/customer/push/devices (customer)
  Registers or refreshes this handset's push token.
  -------------------------------------------------------------------------- **/
  /**
   * Register or refresh. Called on every launch and on every token rotation, so
   * it answers 204 and does no read — the app has nothing to do with a response
   * body, and returning the row would invite it to cache something the OS can
   * invalidate at any moment.
   */
  .post('/devices', requireCustomer, validate('json', PushDeviceRegisterSchema), async (c) => {
    const input = c.req.valid('json');
    await repo.register(c.get('db'), {
      customerAccountId: currentCustomer(c).id,
      token: input.token,
      platform: input.platform,
      language: input.language,
      appVersion: input.appVersion,
    });

    return c.body(null, 204);
  })

  /** --------------------------------------------------------------------------
  DELETE /api/customer/push/devices (customer)
  Unregisters a push token on sign-out.
  -------------------------------------------------------------------------- **/
  /**
   * Unregister, on sign-out and before the session is cleared.
   *
   * The token is in the body rather than the path because a device token in a URL
   * ends up in nginx access logs, and a logged token is one somebody could send a
   * notification to.
   *
   * 204 whether or not a row was deleted. A token that is not this customer's, or
   * is already gone, is the normal shape of a sign-out after a reinstall — not an
   * error, and answering 404 would only teach the app to treat a clean state as a
   * failure.
   */
  .delete('/devices', requireCustomer, validate('json', PushDeviceUnregisterSchema), async (c) => {
    await repo.unregister(c.get('db'), currentCustomer(c).id, c.req.valid('json').token);
    return c.body(null, 204);
  });

export const notificationPreferenceRoutes = new Hono<AppEnv>()
  /** --------------------------------------------------------------------------
  GET /api/customer/notification-preferences (customer)
  The customer's effective notification preferences.
  -------------------------------------------------------------------------- **/
  /**
   * The EFFECTIVE state, not the stored deviations.
   *
   * The screen renders switches and should not have to know the default table to
   * do it — and if it did, our defaults and its defaults would be two things to
   * keep in step across two repositories.
   */
  .get('/', requireCustomer, async (c) => {
    const settings = await repo.settingsFor(c.get('db'), currentCustomer(c).id);
    return c.json({ data: effectivePreferences(settings?.preferences) });
  })

  /** --------------------------------------------------------------------------
  PUT /api/customer/notification-preferences (customer)
  Merges the named categories into the stored preferences.
  -------------------------------------------------------------------------- **/
  /**
   * A partial write: categories the body does not name are left alone, so the
   * screen can send one toggle and two tabs cannot clobber each other's unrelated
   * changes.
   *
   * Merged onto the stored bag rather than replacing it, and answered with the
   * same effective shape the GET returns, so a client never has to reconstruct
   * what it just changed.
   */
  .put('/', requireCustomer, validate('json', NotificationPreferencesSchema), async (c) => {
    const customerId = currentCustomer(c).id;
    const settings = await repo.settingsFor(c.get('db'), customerId);

    const merged: NotificationPreferences = { ...settings?.preferences };
    for (const [category, value] of Object.entries(c.req.valid('json'))) {
      if (value) merged[category as keyof NotificationPreferences] = value;
    }

    const saved = await repo.savePreferences(c.get('db'), customerId, merged);
    return c.json({ data: effectivePreferences(saved) });
  });
