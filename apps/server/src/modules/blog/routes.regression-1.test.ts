// Regression: SYS-001 — GET /api/blog/categories was answered by GET /:slug ("Blog post not found")
// Found by /qa on 2026-10-04
// Report: ~/.gstack/projects/coderov-it-miamedical-single/qa-reports/run-20261004T080925Z/

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Hono } from 'hono';

import type { AppEnv } from '../../shared/http/context.ts';
import { blogAdminRoutes, blogPublicRoutes } from './routes.ts';

/* Just enough of the query API for the two `/categories` handlers to answer and
   for the `/:slug` lookup to miss. Which handler ran is the whole assertion. */
const db = {
  query: {
    blogCategories: { findMany: async () => [] },
    blogPostTranslations: { findFirst: async () => undefined },
    blogPosts: { findFirst: async () => undefined },
  },
};

function mount(routes: Hono<AppEnv>) {
  return new Hono<AppEnv>()
    .use(async (c, next) => {
      c.set('db', db as never);
      c.set('user', { isSuperuser: true, permissions: [] } as never);
      await next();
    })
    .route('/', routes);
}

describe('blog routes — /categories is not read as a post', () => {
  it('GET /api/blog/categories lists categories', async () => {
    const res = await mount(blogPublicRoutes).request('/categories');
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { data: [] });
  });

  it('GET /api/admin/blog/categories lists categories', async () => {
    const res = await mount(blogAdminRoutes).request('/categories');
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { data: [] });
  });
});
