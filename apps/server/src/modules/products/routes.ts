import { P } from '@mia/permissions';
import { Hono } from 'hono';

import { r2FileUploader } from '../../infra/storage/r2.ts';
import { requirePermission } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { validate } from '../../shared/http/validate.ts';
import * as addonsService from './addons/service.ts';
import * as catalogService from './catalog/service.ts';
import * as faqsService from './faqs/service.ts';
import {
  toAdminDetail,
  toAdminSummary,
  toPageMeta,
  toPublicDetail,
  toPublicSummary,
} from './mapper.ts';
import * as questionsService from './questions/service.ts';
import * as specsService from './specs/service.ts';
import * as termsLinksService from './terms-links/service.ts';
import {
  AddonsPutSchema,
  AdminProductQuerySchema,
  CreateProductSchema,
  FaqsPutSchema,
  LocaleOnlyQuerySchema,
  ProductIdParamSchema,
  ProductQuerySchema,
  ProductSlugParamSchema,
  ProductTermsInputSchema,
  QuestionsPutSchema,
  SpecValuesInputSchema,
  UpdateProductSchema,
} from './validators.ts';

/** HTTP edge only: validate, delegate to a service, map records to DTOs. */

/** Public storefront surface — locale-collapsed strings, active rows only. */
export const productPublicRoutes = new Hono<AppEnv>()
  .get('/', validate('query', ProductQuerySchema), async (c) => {
    const query = c.req.valid('query');
    const result = await catalogService.list(c.get('db'), query, c.get('user'));

    return c.json({
      data: result.rows.map((row) => toPublicSummary(row, query.locale)),
      meta: toPageMeta(query.page, query.perPage, result.total),
      facets: result.facets,
    });
  })

  .get(
    '/:slug',
    validate('param', ProductSlugParamSchema),
    validate('query', LocaleOnlyQuerySchema),
    async (c) => {
      const { slug } = c.req.valid('param');
      const { locale } = c.req.valid('query');
      const product = await catalogService.getPublicBySlug(c.get('db'), slug, c.get('user'));

      return c.json({ data: toPublicDetail(product, locale) });
    },
  );

/** Admin surface — raw bilingual shapes, drafts included, permission-guarded.
    List summaries are the one exception: display strings resolve per
    `?locale`, which the admin client appends from its interface language. */
export const productAdminRoutes = new Hono<AppEnv>()
  .get(
    '/',
    requirePermission(P.PRODUCT_READ),
    validate('query', AdminProductQuerySchema),
    async (c) => {
      const query = c.req.valid('query');
      const result = await catalogService.list(
        c.get('db'),
        {
          page: query.page,
          perPage: query.perPage,
          locale: query.locale,
          q: query.q,
          category: query.category,
          mode: undefined,
          status: query.status,
          featured: undefined,
          sort: 'newest',
          specs: undefined,
        },
        c.get('user'),
      );

      return c.json({
        data: result.rows.map((row) => toAdminSummary(row, query.locale)),
        meta: toPageMeta(query.page, query.perPage, result.total),
      });
    },
  )

  .post(
    '/',
    requirePermission(P.PRODUCT_CREATE),
    validate('json', CreateProductSchema),
    async (c) => {
      const product = await catalogService.create(c.get('db'), c.req.valid('json'));
      return c.json({ data: toAdminDetail(product) }, 201);
    },
  )

  .get(
    '/:id',
    requirePermission(P.PRODUCT_READ),
    validate('param', ProductIdParamSchema),
    async (c) => {
      const product = await catalogService.getAggregate(c.get('db'), c.req.valid('param').id);
      return c.json({ data: toAdminDetail(product) });
    },
  )

  .patch(
    '/:id',
    requirePermission(P.PRODUCT_UPDATE),
    validate('param', ProductIdParamSchema),
    validate('json', UpdateProductSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const input = c.req.valid('json');
      let product = await catalogService.update(c.get('db'), r2FileUploader, id, input);
      if (input.categoryId !== undefined) {
        // Spec values from the previous category no longer apply.
        await specsService.pruneForCategory(c.get('db'), id);
        product = await catalogService.getAggregate(c.get('db'), id);
      }
      return c.json({ data: toAdminDetail(product) });
    },
  )

  .delete(
    '/:id',
    requirePermission(P.PRODUCT_DELETE),
    validate('param', ProductIdParamSchema),
    async (c) => {
      await catalogService.remove(c.get('db'), r2FileUploader, c.req.valid('param').id);
      return c.json({ data: { deleted: true } });
    },
  )

  .put(
    '/:id/specs',
    requirePermission(P.PRODUCT_UPDATE),
    validate('param', ProductIdParamSchema),
    validate('json', SpecValuesInputSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      await specsService.replaceSpecValues(c.get('db'), id, c.req.valid('json'));
      const product = await catalogService.getAggregate(c.get('db'), id);
      return c.json({ data: toAdminDetail(product) });
    },
  )

  .put(
    '/:id/addons',
    requirePermission(P.PRODUCT_UPDATE),
    validate('param', ProductIdParamSchema),
    validate('json', AddonsPutSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      await addonsService.replaceAddons(c.get('db'), r2FileUploader, id, c.req.valid('json'));
      const product = await catalogService.getAggregate(c.get('db'), id);
      return c.json({ data: toAdminDetail(product) });
    },
  )

  .put(
    '/:id/faqs',
    requirePermission(P.PRODUCT_UPDATE),
    validate('param', ProductIdParamSchema),
    validate('json', FaqsPutSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      await faqsService.replaceFaqs(c.get('db'), id, c.req.valid('json'));
      const product = await catalogService.getAggregate(c.get('db'), id);
      return c.json({ data: toAdminDetail(product) });
    },
  )

  .put(
    '/:id/questions',
    requirePermission(P.PRODUCT_UPDATE),
    validate('param', ProductIdParamSchema),
    validate('json', QuestionsPutSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      await questionsService.replaceQuestions(c.get('db'), id, c.req.valid('json'));
      const product = await catalogService.getAggregate(c.get('db'), id);
      return c.json({ data: toAdminDetail(product) });
    },
  )

  .put(
    '/:id/terms',
    requirePermission(P.PRODUCT_UPDATE),
    validate('param', ProductIdParamSchema),
    validate('json', ProductTermsInputSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      await termsLinksService.replaceTermsLinks(c.get('db'), id, c.req.valid('json'));
      const product = await catalogService.getAggregate(c.get('db'), id);
      return c.json({ data: toAdminDetail(product) });
    },
  );
