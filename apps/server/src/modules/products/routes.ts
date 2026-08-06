import { Hono } from 'hono';

import { requireRole } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { validate } from '../../shared/http/validate.ts';
import { toPageMeta, toProductDetail, toProductSummary } from './mapper.ts';
import * as service from './service.ts';
import { CreateProductSchema, ProductQuerySchema, ProductSlugParamSchema } from './validators.ts';

/** HTTP edge only: validate, delegate to the service, map records to DTOs. */
export const productRoutes = new Hono<AppEnv>()
  .get('/', validate('query', ProductQuerySchema), async (c) => {
    const query = c.req.valid('query');
    const { rows, total } = await service.list(c.get('db'), query, c.get('user'));

    return c.json({
      data: rows.map(toProductSummary),
      meta: toPageMeta(query.page, query.perPage, total),
    });
  })

  .get('/:slug', validate('param', ProductSlugParamSchema), async (c) => {
    const { slug } = c.req.valid('param');
    const product = await service.getBySlug(c.get('db'), slug, c.get('user'));

    return c.json({ data: toProductDetail(product) });
  })

  .post('/', requireRole('admin', 'staff'), validate('json', CreateProductSchema), async (c) => {
    const product = await service.create(c.get('db'), c.req.valid('json'));

    return c.json({ data: toProductDetail(product) }, 201);
  });
