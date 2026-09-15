import { NOTIFICATION_CATEGORIES, PaginationSchema } from '@mia/validators';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import * as v from 'valibot';

import { currentUser, requireAuth } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { validate } from '../../shared/http/validate.ts';
import * as hub from './hub.ts';
import * as repo from './repo.ts';

/**
 * The operator's own feed.
 *
 * Behind `requireAuth` and no permission code, for the same reason
 * `routes.profile` is: these are notifications addressed to *you*, and every
 * read here is already scoped to the signed-in operator by `repo.Recipient`.
 * What an operator is told about is decided when the row is written — see
 * `ADMIN_EVENT_PERMISSION` — not when they come to read it, so a permission
 * here would answer a question that has already been answered.
 */

const MarkReadSchema = v.object({
  ids: v.pipe(v.array(v.pipe(v.string(), v.uuid())), v.minLength(1), v.maxLength(200)),
});

/**
 * The rail's two controls. Both optional — absent means "everything", which is
 * the state the screen opens in.
 *
 * The picklist is built from the registry rather than spelled out, so a new
 * category is filterable the moment it exists.
 */
const FeedQuerySchema = v.object({
  ...PaginationSchema.entries,
  category: v.optional(v.picklist(NOTIFICATION_CATEGORIES)),
  unread: v.optional(v.picklist(['true', 'false'])),
});

export const notificationAdminRoutes = new Hono<AppEnv>()
  .get('/', requireAuth, validate('query', FeedQuerySchema), async (c) => {
    const { page, perPage, category, unread } = c.req.valid('query');
    const recipient = { audience: 'admin', id: currentUser(c).id } as const;
    const feed = await repo.findFeed(c.get('db'), recipient, page, perPage, {
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

  /**
   * The live channel. `EventSource` with `withCredentials` reuses the session
   * cookie through the same CORS allowlist the RPC client uses, and `hono/csrf`
   * only guards non-GET, so nothing in `app.ts` changes to make this work.
   *
   * It carries no notification the feed could not also answer — the frames are a
   * hint that something changed, and the client is free to fetch the snapshot
   * instead. That is what makes a dropped connection a non-event.
   */
  .get('/stream', requireAuth, (c) => {
    const recipient = { audience: 'admin', id: currentUser(c).id } as const;

    /* `docs/nginx/miamedical_prod.conf` leaves `proxy_buffering` on, which would
       otherwise hold each frame until a buffer filled. This is a property of the
       response, so dev and prod behave identically with no vhost edit. */
    c.header('X-Accel-Buffering', 'no');

    return streamSSE(c, async (stream) => {
      const unsubscribe = hub.subscribe(recipient, stream);

      /* Held open until the client goes away. `streamSSE` closes the response
         when this callback resolves, so the promise IS the connection. */
      await new Promise<void>((resolve) => {
        stream.onAbort(() => {
          unsubscribe();
          resolve();
        });

        /* First frame, immediately: it flushes the response headers so the
           browser fires `onopen` rather than waiting on the first real event,
           and it is the client's cue to fetch the snapshot. */
        void stream.writeSSE({ event: 'ready', data: JSON.stringify({}) });
      });
    });
  })

  /* Both mark-read routes answer with the recomputed counts rather than just a
     number. The rail's badges and the bell are the same state, and returning
     half of it would leave the client to guess the other half — which is how a
     bell ends up disagreeing with the list under it. */
  .post('/read', requireAuth, validate('json', MarkReadSchema), async (c) => {
    const recipient = { audience: 'admin', id: currentUser(c).id } as const;
    const marked = await repo.markRead(c.get('db'), recipient, c.req.valid('json').ids);
    const counts = await repo.countByCategory(c.get('db'), recipient);

    return c.json({ data: { marked, unread: counts.all.unread, counts } });
  })

  .post('/read-all', requireAuth, async (c) => {
    const recipient = { audience: 'admin', id: currentUser(c).id } as const;
    const marked = await repo.markAllRead(c.get('db'), recipient);
    const counts = await repo.countByCategory(c.get('db'), recipient);

    return c.json({ data: { marked, unread: counts.all.unread, counts } });
  });
