/** HTTP edge only: filter, count in memory, answer 204. Never touches the database. */

import { Hono } from 'hono';

import type { AppEnv } from '../../shared/http/context.ts';
import { rateLimit } from '../../shared/http/rate-limit.ts';
import { UuidSchema } from '@mia/validators';
import * as v from 'valibot';
import { isCountableUserAgent } from './bot.ts';
import { createMiddleware } from 'hono/factory';
import { recordView } from './views.ts';

/** Generous: a clinic behind one NAT address browses a lot of product pages. */
const viewRateLimit = rateLimit({ limit: 600, windowMs: 60 * 60 * 1000 });

/**
 * The storefront is another origin, so `secureHeaders()`'s same-origin resource
 * policy makes Chrome log a blocked response for every beacon. `secureHeaders`
 * writes its headers AFTER the handler, so a handler cannot override it: this
 * runs before it in `app.ts` (outer middleware, so its after-`next()` code runs
 * last) and is mounted on this one route only.
 */
export const beaconResourcePolicy = createMiddleware<AppEnv>(async (c, next) => {
  await next();
  c.res.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
});

export const productViewRoutes = new Hono<AppEnv>()
  /** --------------------------------------------------------------------------
  POST /api/products/:id/view (public)
  Counts one product page view in memory; always 204, bots and unknown ids are ignored.
  -------------------------------------------------------------------------- **/
  .post('/:id/view', viewRateLimit, (c) => {
    const id = c.req.param('id');
    if (v.is(UuidSchema, id) && isCountableUserAgent(c.req.header('user-agent'))) recordView(id);
    return c.body(null, 204);
  });
