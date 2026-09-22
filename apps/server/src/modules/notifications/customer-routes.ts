import { NOTIFICATION_CATEGORIES, PaginationSchema } from '@mia/validators';
import { Hono } from 'hono';
import type { Context } from 'hono';
import { streamSSE } from 'hono/streaming';
import * as v from 'valibot';

import { currentCustomer, requireCustomer } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { validate } from '../../shared/http/validate.ts';
import * as hub from './hub.ts';
import * as repo from './repo.ts';

/**
 * The customer's own feed — the same four routes the back office has, behind
 * `requireCustomer` instead of `requireAuth`.
 *
 * It is a near-copy of `admin-routes.ts` rather than a shared factory, and that
 * is deliberate. The two audiences agree today by coincidence, not by contract:
 * the operator feed has a category rail and a permission model behind which
 * events reach whom, and this one answers to a person who owns every row it can
 * see. Folding them into one parameterised router would make the next
 * divergence — a customer-only filter, a different page size, a preference
 * check — arrive as a conditional inside a shared function, which is where a
 * feed starts showing one audience the other's rows. Two short files that read
 * independently are cheaper than one clever one.
 *
 * What IS shared is everything underneath: `repo.ts` and `hub.ts` are
 * recipient-generic and needed no change to serve this.
 */

const MarkReadSchema = v.object({
  ids: v.pipe(v.array(v.pipe(v.string(), v.uuid())), v.minLength(1), v.maxLength(200)),
});

/**
 * Same two controls the operator feed takes. The customer area ships no rail
 * today, but the query is the API's shape rather than one screen's, and the app
 * in `docs/plan/PLAN_app_push_notifications.html` reads the same endpoint.
 */
const FeedQuerySchema = v.object({
  ...PaginationSchema.entries,
  category: v.optional(v.picklist(NOTIFICATION_CATEGORIES)),
  unread: v.optional(v.picklist(['true', 'false'])),
});

/** The one place this file says who is asking. */
function recipientOf(c: Context<AppEnv>) {
  return { audience: 'customer', id: currentCustomer(c).id } as const;
}

export const notificationCustomerRoutes = new Hono<AppEnv>()
  /** --------------------------------------------------------------------------
  GET /api/customer/notifications (customer)
  Paged feed of the customer's own notifications, with unread counts.
  -------------------------------------------------------------------------- **/
  .get('/', requireCustomer, validate('query', FeedQuerySchema), async (c) => {
    const { page, perPage, category, unread } = c.req.valid('query');
    const feed = await repo.findFeed(c.get('db'), recipientOf(c), page, perPage, {
      category,
      unreadOnly: unread === 'true',
    });

    return c.json({
      data: feed.rows,
      meta: {
        page,
        perPage,
        total: feed.total,
        unread: feed.unread,
        counts: feed.counts,
      },
    });
  })

  /** --------------------------------------------------------------------------
  GET /api/customer/notifications/stream (customer)
  Server-sent events; each frame is a hint that the feed changed.
  -------------------------------------------------------------------------- **/
  /**
   * The live channel.
   *
   * `EventSource` with `withCredentials` sends the customer session cookie
   * through the same CORS allowlist the storefront's other calls use, and
   * `hono/csrf` only guards non-GET — so nothing in `app.ts` changes to make
   * this work beyond mounting the router.
   */
  .get('/stream', requireCustomer, (c) => {
    const recipient = recipientOf(c);

    /* Nginx buffers proxied responses by default, which would hold each frame
       until a buffer filled. A response header rather than a vhost edit, so dev
       and prod behave the same. */
    c.header('X-Accel-Buffering', 'no');

    return streamSSE(c, async (stream) => {
      const unsubscribe = hub.subscribe(recipient, stream);

      /* `streamSSE` closes the response when this callback resolves, so the
         promise IS the connection. */
      await new Promise<void>((resolve) => {
        stream.onAbort(() => {
          unsubscribe();
          resolve();
        });

        /* First frame immediately: it flushes the headers so the browser fires
           `onopen` rather than waiting on the first real event, and it is the
           client's cue to fetch the snapshot. */
        void stream.writeSSE({ event: 'ready', data: JSON.stringify({}) });
      });
    });
  })

  /* Both mark-read routes answer with the recomputed counts rather than a bare
     number, so the bell in the shell and the list under it are one piece of
     state and cannot drift apart. */
  /** --------------------------------------------------------------------------
  POST /api/customer/notifications/read (customer)
  Marks the given notifications read and returns the recomputed counts.
  -------------------------------------------------------------------------- **/
  .post('/read', requireCustomer, validate('json', MarkReadSchema), async (c) => {
    const recipient = recipientOf(c);
    const marked = await repo.markRead(c.get('db'), recipient, c.req.valid('json').ids);
    const counts = await repo.countByCategory(c.get('db'), recipient);

    return c.json({ data: { marked, unread: counts.all.unread, counts } });
  })

  /** --------------------------------------------------------------------------
  POST /api/customer/notifications/read-all (customer)
  Marks every notification read and returns the recomputed counts.
  -------------------------------------------------------------------------- **/
  .post('/read-all', requireCustomer, async (c) => {
    const recipient = recipientOf(c);
    const marked = await repo.markAllRead(c.get('db'), recipient);
    const counts = await repo.countByCategory(c.get('db'), recipient);

    return c.json({ data: { marked, unread: counts.all.unread, counts } });
  });
