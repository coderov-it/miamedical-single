import { P } from '@mia/permissions';
import { Hono } from 'hono';

import { r2FileUploader } from '../../infra/media.ts';
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
  /** --------------------------------------------------------------------------
  GET /api/products (public)
  Paged storefront catalogue with its facets, localised.
  -------------------------------------------------------------------------- **/
  .get('/', validate('query', ProductQuerySchema), async (c) => {
    const query = c.req.valid('query');
    const result = await catalogService.list(c.get('db'), query, c.get('user'), 'storefront');

    return c.json({
      data: result.rows.map((row) => toPublicSummary(row, query.locale)),
      meta: toPageMeta(query.page, query.perPage, result.total),
      facets: result.facets,
    });
  })

  /** --------------------------------------------------------------------------
  GET /api/products/:slug (public)
  One active product by slug, localised.
  -------------------------------------------------------------------------- **/
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
  /** --------------------------------------------------------------------------
  GET /api/admin/products (product:read)
  Paged product list, drafts included, newest first.
  -------------------------------------------------------------------------- **/
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
        /* Newest first, ungrouped: an operator who just saved a product looks
           for it at the top of the list, whichever mode it prices in. */
        'admin',
      );

      return c.json({
        data: result.rows.map((row) => toAdminSummary(row, query.locale)),
        meta: toPageMeta(query.page, query.perPage, result.total),
      });
    },
  )

  /** --------------------------------------------------------------------------
  POST /api/admin/products (product:create)
  Creates a product.
  -------------------------------------------------------------------------- **/
  .post(
    '/',
    requirePermission(P.PRODUCT_CREATE),
    validate('json', CreateProductSchema),
    async (c) => {
      const product = await catalogService.create(c.get('db'), c.req.valid('json'));
      return c.json({ data: toAdminDetail(product) }, 201);
    },
  )

  /** --------------------------------------------------------------------------
  GET /api/admin/products/:id (product:read)
  One product with every nested collection, in both languages.
  -------------------------------------------------------------------------- **/
  .get(
    '/:id',
    requirePermission(P.PRODUCT_READ),
    validate('param', ProductIdParamSchema),
    async (c) => {
      const product = await catalogService.getAggregate(c.get('db'), c.req.valid('param').id);
      return c.json({ data: toAdminDetail(product) });
    },
  )

  /** --------------------------------------------------------------------------
  PATCH /api/admin/products/:id (product:update)
  Edits a product; moving it to another category prunes stale spec values.
  -------------------------------------------------------------------------- **/
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

  /** --------------------------------------------------------------------------
  DELETE /api/admin/products/:id (product:delete)
  Deletes a product and the media objects it owns.
  -------------------------------------------------------------------------- **/
  .delete(
    '/:id',
    requirePermission(P.PRODUCT_DELETE),
    validate('param', ProductIdParamSchema),
    async (c) => {
      await catalogService.remove(c.get('db'), r2FileUploader, c.req.valid('param').id);
      return c.json({ data: { deleted: true } });
    },
  )

  /** --------------------------------------------------------------------------
  PUT /api/admin/products/:id/specs (product:update)
  Replaces the product's whole set of spec values.
  -------------------------------------------------------------------------- **/
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

  /** --------------------------------------------------------------------------
  PUT /api/admin/products/:id/addons (product:update)
  Replaces the product's whole set of add-ons.
  -------------------------------------------------------------------------- **/
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

  /** --------------------------------------------------------------------------
  PUT /api/admin/products/:id/faqs (product:update)
  Replaces the product's whole set of FAQs.
  -------------------------------------------------------------------------- **/
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

  /** --------------------------------------------------------------------------
  PUT /api/admin/products/:id/questions (product:update)
  Replaces the product's whole set of configuration questions.
  -------------------------------------------------------------------------- **/
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

  /** --------------------------------------------------------------------------
  PUT /api/admin/products/:id/terms (product:update)
  Replaces the terms documents linked to the product.
  -------------------------------------------------------------------------- **/
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
