import { sql } from '@mia/db';
import { Hono } from 'hono';

import type { AppEnv } from '../../shared/http/context.ts';

export const healthRoutes = new Hono<AppEnv>()
  /** --------------------------------------------------------------------------
  GET /health/live (public)
  Liveness probe; 200 for as long as the process is up.
  -------------------------------------------------------------------------- **/
  .get('/live', (c) => c.json({ status: 'ok' }))
  /** --------------------------------------------------------------------------
  GET /health/ready (public)
  Readiness probe; 503 when the database is unreachable.
  -------------------------------------------------------------------------- **/
  .get('/ready', async (c) => {
    try {
      await c.get('db').execute(sql`select 1`);
      return c.json({ status: 'ok', database: 'up' });
    } catch (error) {
      console.error('readiness check failed', error);
      return c.json({ status: 'degraded', database: 'down' }, 503);
    }
  });
