import { P } from '@mia/permissions';
import {
  CategoryIdParamSchema,
  CreateCategorySchema,
  LocaleOnlyQuerySchema,
  SpecInputSchema,
  UpdateCategorySchema,
} from '@mia/validators';
import { Hono } from 'hono';
import * as v from 'valibot';

import { r2FileUploader } from '../../infra/storage/r2.ts';
import { requirePermission } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { validate } from '../../shared/http/validate.ts';
import { toAdminCategory, toPublicCategory } from './mapper.ts';
import * as service from './service.ts';

const SpecsPutSchema = v.pipe(v.array(SpecInputSchema), v.maxLength(100));

export const categoryPublicRoutes = new Hono<AppEnv>().get(
  '/',
  validate('query', LocaleOnlyQuerySchema),
  async (c) => {
    const { locale } = c.req.valid('query');
    const rows = await service.listAll(c.get('db'), true);
    return c.json({ data: rows.map((row) => toPublicCategory(row, locale)) });
  },
);

export const categoryAdminRoutes = new Hono<AppEnv>()
  .get('/', requirePermission(P.CATEGORY_READ), async (c) => {
    const rows = await service.listAll(c.get('db'), false);
    return c.json({ data: rows.map(toAdminCategory) });
  })

  .post(
    '/',
    requirePermission(P.CATEGORY_CREATE),
    validate('json', CreateCategorySchema),
    async (c) => {
      const category = await service.create(c.get('db'), r2FileUploader, c.req.valid('json'));
      return c.json({ data: toAdminCategory(category) }, 201);
    },
  )

  .get(
    '/:id',
    requirePermission(P.CATEGORY_READ),
    validate('param', CategoryIdParamSchema),
    async (c) => {
      const category = await service.getById(c.get('db'), c.req.valid('param').id);
      return c.json({ data: toAdminCategory(category) });
    },
  )

  .patch(
    '/:id',
    requirePermission(P.CATEGORY_UPDATE),
    validate('param', CategoryIdParamSchema),
    validate('json', UpdateCategorySchema),
    async (c) => {
      const category = await service.update(
        c.get('db'),
        r2FileUploader,
        c.req.valid('param').id,
        c.req.valid('json'),
      );
      return c.json({ data: toAdminCategory(category) });
    },
  )

  .delete(
    '/:id',
    requirePermission(P.CATEGORY_DELETE),
    validate('param', CategoryIdParamSchema),
    async (c) => {
      await service.remove(c.get('db'), r2FileUploader, c.req.valid('param').id);
      return c.json({ data: { deleted: true } });
    },
  )

  .put(
    '/:id/specs',
    requirePermission(P.CATEGORY_UPDATE),
    validate('param', CategoryIdParamSchema),
    validate('json', SpecsPutSchema),
    async (c) => {
      const category = await service.replaceSpecs(
        c.get('db'),
        r2FileUploader,
        c.req.valid('param').id,
        c.req.valid('json'),
      );
      return c.json({ data: toAdminCategory(category) });
    },
  );
