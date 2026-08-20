import type { Database } from '@mia/db';
import { and, count, desc, eq, inArray, lte, sql } from '@mia/db';
import type { LanguageCode } from '@mia/db/schema';
import {
  blogCategories,
  blogPostCategories,
  blogPostTranslations,
  blogPosts,
} from '@mia/db/schema';
import { P } from '@mia/permissions';
import {
  BlogCategoryIdParamSchema,
  BlogPostIdParamSchema,
  BlogPostQuerySchema,
  BlogPostSlugParamSchema,
  BlogPostStatusChangeSchema,
  CreateBlogCategorySchema,
  CreateBlogPostSchema,
  PublicBlogQuerySchema,
  UpdateBlogCategorySchema,
  UpdateBlogPostSchema,
  type BlogPostStatus,
  type CreateBlogPostInput,
  type UpdateBlogPostInput,
} from '@mia/validators';
import { Hono } from 'hono';

import { requirePermission } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { conflict, notFound } from '../../shared/http/errors.ts';
import { validate } from '../../shared/http/validate.ts';
import { pickTranslation } from '../products/i18n.ts';
import { toPageMeta } from '../products/mapper.ts';

type PostAggregate = typeof blogPosts.$inferSelect & {
  translations: (typeof blogPostTranslations.$inferSelect)[];
  postCategories: (typeof blogPostCategories.$inferSelect)[];
};

async function findPostById(db: Database, id: string): Promise<PostAggregate> {
  const row = await db.query.blogPosts.findFirst({
    where: eq(blogPosts.id, id),
    with: { translations: true, postCategories: true },
  });
  if (!row) throw notFound('Blog post');
  return row;
}

async function upsertTranslations(
  db: Database,
  postId: string,
  translations: CreateBlogPostInput['translations'] | undefined,
): Promise<void> {
  for (const lang of ['it', 'en'] as LanguageCode[]) {
    const t = translations?.[lang];
    if (!t) continue;
    await db
      .insert(blogPostTranslations)
      .values({
        postId,
        languageCode: lang,
        title: t.title,
        slug: t.slug,
        body: t.body,
        excerpt: t.excerpt ?? null,
        metaTitle: t.metaTitle ?? null,
        metaDescription: t.metaDescription ?? null,
      })
      .onConflictDoUpdate({
        target: [blogPostTranslations.postId, blogPostTranslations.languageCode],
        set: {
          title: t.title,
          slug: t.slug,
          body: t.body,
          excerpt: t.excerpt ?? null,
          metaTitle: t.metaTitle ?? null,
          metaDescription: t.metaDescription ?? null,
        },
      });
  }
}

async function syncCategories(db: Database, postId: string, categoryIds: string[]): Promise<void> {
  await db.delete(blogPostCategories).where(eq(blogPostCategories.postId, postId));
  if (categoryIds.length > 0) {
    await db
      .insert(blogPostCategories)
      .values(categoryIds.map((categoryId) => ({ postId, categoryId })));
  }
}

interface TranslationDto {
  title: string;
  slug: string;
  body: string;
  excerpt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
}

function toAdminPostDto(row: PostAggregate) {
  const translations: Partial<Record<LanguageCode, TranslationDto>> = {};
  for (const t of row.translations) {
    translations[t.languageCode] = {
      title: t.title,
      slug: t.slug,
      body: t.body,
      excerpt: t.excerpt,
      metaTitle: t.metaTitle,
      metaDescription: t.metaDescription,
    };
  }
  return {
    id: row.id,
    status: row.status,
    featuredImage: row.featuredImage,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    categoryIds: row.postCategories.map((pc) => pc.categoryId),
    translations,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toCategoryDto(row: typeof blogCategories.$inferSelect) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    slug: row.slug,
    position: row.position,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  };
}

// --- Admin routes ---

export const blogAdminRoutes = new Hono<AppEnv>()
  .get('/', requirePermission(P.BLOG_READ), validate('query', BlogPostQuerySchema), async (c) => {
    const db = c.get('db');
    const { page, perPage, status, category, q, locale } = c.req.valid('query');

    const clauses = [];
    if (status) clauses.push(eq(blogPosts.status, status));
    if (category) {
      const cat = await db.query.blogCategories.findFirst({
        where: eq(blogCategories.code, category),
        columns: { id: true },
      });
      if (cat) {
        clauses.push(
          sql`${blogPosts.id} IN (
              SELECT ${blogPostCategories.postId}
              FROM ${blogPostCategories}
              WHERE ${blogPostCategories.categoryId} = ${cat.id}
            )`,
        );
      }
    }
    if (q) {
      const term = `%${q}%`;
      clauses.push(
        sql`${blogPosts.id} IN (
            SELECT ${blogPostTranslations.postId}
            FROM ${blogPostTranslations}
            WHERE ${blogPostTranslations.title} ILIKE ${term}
          )`,
      );
    }

    const where = clauses.length > 0 ? and(...clauses) : undefined;

    const [rows, totals] = await Promise.all([
      db.query.blogPosts.findMany({
        where,
        orderBy: desc(blogPosts.updatedAt),
        limit: perPage,
        offset: (page - 1) * perPage,
        with: { translations: true, postCategories: true },
      }),
      db.select({ value: count() }).from(blogPosts).where(where),
    ]);

    const total = totals[0]?.value ?? 0;
    return c.json({ data: rows.map(toAdminPostDto), meta: toPageMeta(page, perPage, total) });
  })

  .post(
    '/',
    requirePermission(P.BLOG_CREATE),
    validate('json', CreateBlogPostSchema),
    async (c) => {
      const db = c.get('db');
      const input: CreateBlogPostInput = c.req.valid('json');

      const [created] = await db
        .insert(blogPosts)
        .values({ featuredImage: input.featuredImage ?? null })
        .returning({ id: blogPosts.id });
      if (!created) throw new Error('Blog post insert returned no row.');

      await upsertTranslations(db, created.id, input.translations);
      if (input.categoryIds && input.categoryIds.length > 0) {
        await syncCategories(db, created.id, input.categoryIds);
      }

      return c.json({ data: toAdminPostDto(await findPostById(db, created.id)) }, 201);
    },
  )

  .get(
    '/:id',
    requirePermission(P.BLOG_READ),
    validate('param', BlogPostIdParamSchema),
    async (c) => {
      return c.json({
        data: toAdminPostDto(await findPostById(c.get('db'), c.req.valid('param').id)),
      });
    },
  )

  .patch(
    '/:id',
    requirePermission(P.BLOG_UPDATE),
    validate('param', BlogPostIdParamSchema),
    validate('json', UpdateBlogPostSchema),
    async (c) => {
      const db = c.get('db');
      const { id } = c.req.valid('param');
      const input: UpdateBlogPostInput = c.req.valid('json');
      await findPostById(db, id);

      const set: Record<string, unknown> = {};
      if (input.featuredImage !== undefined) set.featuredImage = input.featuredImage;
      if (input.publishedAt !== undefined) {
        set.publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
      }
      if (Object.keys(set).length > 0) {
        await db.update(blogPosts).set(set).where(eq(blogPosts.id, id));
      } else {
        await db.update(blogPosts).set({ updatedAt: new Date() }).where(eq(blogPosts.id, id));
      }

      await upsertTranslations(db, id, input.translations);
      if (input.categoryIds !== undefined) {
        await syncCategories(db, id, input.categoryIds);
      }

      return c.json({ data: toAdminPostDto(await findPostById(db, id)) });
    },
  )

  .post(
    '/:id/status',
    requirePermission(P.BLOG_PUBLISH),
    validate('param', BlogPostIdParamSchema),
    validate('json', BlogPostStatusChangeSchema),
    async (c) => {
      const db = c.get('db');
      const { id } = c.req.valid('param');
      const { status } = c.req.valid('json');
      await findPostById(db, id);

      const patch: Record<string, unknown> = { status };
      if (status === 'published') {
        const current = await db.query.blogPosts.findFirst({
          where: eq(blogPosts.id, id),
          columns: { publishedAt: true },
        });
        if (!current?.publishedAt) patch.publishedAt = new Date();
      }

      await db.update(blogPosts).set(patch).where(eq(blogPosts.id, id));
      return c.json({ data: toAdminPostDto(await findPostById(db, id)) });
    },
  )

  .delete(
    '/:id',
    requirePermission(P.BLOG_DELETE),
    validate('param', BlogPostIdParamSchema),
    async (c) => {
      const db = c.get('db');
      const { id } = c.req.valid('param');
      await findPostById(db, id);
      await db.delete(blogPosts).where(eq(blogPosts.id, id));
      return c.json({ data: { deleted: true } });
    },
  )

  // --- Blog categories ---

  .get('/categories', requirePermission(P.BLOG_CATEGORY_READ), async (c) => {
    const rows = await c.get('db').query.blogCategories.findMany({
      orderBy: blogCategories.position,
    });
    return c.json({ data: rows.map(toCategoryDto) });
  })

  .post(
    '/categories',
    requirePermission(P.BLOG_CATEGORY_MANAGE),
    validate('json', CreateBlogCategorySchema),
    async (c) => {
      const db = c.get('db');
      const input = c.req.valid('json');

      const existing = await db.query.blogCategories.findFirst({
        where: eq(blogCategories.code, input.code),
        columns: { id: true },
      });
      if (existing) throw conflict(`A blog category with code "${input.code}" already exists.`);

      const [created] = await db
        .insert(blogCategories)
        .values({
          code: input.code,
          name: input.name,
          slug: input.slug,
          position: input.position ?? 0,
        })
        .returning();
      if (!created) throw new Error('Blog category insert returned no row.');

      return c.json({ data: toCategoryDto(created) }, 201);
    },
  )

  .patch(
    '/categories/:id',
    requirePermission(P.BLOG_CATEGORY_MANAGE),
    validate('param', BlogCategoryIdParamSchema),
    validate('json', UpdateBlogCategorySchema),
    async (c) => {
      const db = c.get('db');
      const { id } = c.req.valid('param');
      const input = c.req.valid('json');

      const row = await db.query.blogCategories.findFirst({
        where: eq(blogCategories.id, id),
      });
      if (!row) throw notFound('Blog category');

      if (input.code !== undefined) {
        const dup = await db.query.blogCategories.findFirst({
          where: eq(blogCategories.code, input.code),
          columns: { id: true },
        });
        if (dup && dup.id !== id) {
          throw conflict(`A blog category with code "${input.code}" already exists.`);
        }
      }

      await db.update(blogCategories).set(input).where(eq(blogCategories.id, id));
      const updated = await db.query.blogCategories.findFirst({
        where: eq(blogCategories.id, id),
      });
      if (!updated) throw notFound('Blog category');

      return c.json({ data: toCategoryDto(updated) });
    },
  )

  .delete(
    '/categories/:id',
    requirePermission(P.BLOG_CATEGORY_MANAGE),
    validate('param', BlogCategoryIdParamSchema),
    async (c) => {
      const db = c.get('db');
      const { id } = c.req.valid('param');

      const row = await db.query.blogCategories.findFirst({
        where: eq(blogCategories.id, id),
        columns: { id: true },
      });
      if (!row) throw notFound('Blog category');

      try {
        await db.delete(blogCategories).where(eq(blogCategories.id, id));
      } catch (error) {
        if ((error as { code?: string })?.code === '23503') {
          throw conflict('This category has blog posts. Remove them first.');
        }
        throw error;
      }
      return c.json({ data: { deleted: true } });
    },
  );

// --- Public routes ---

export const blogPublicRoutes = new Hono<AppEnv>()
  .get('/', validate('query', PublicBlogQuerySchema), async (c) => {
    const db = c.get('db');
    const { page, perPage, locale, category } = c.req.valid('query');
    const now = new Date();

    const clauses = [
      eq(blogPosts.status, 'published' as BlogPostStatus),
      lte(blogPosts.publishedAt, now),
    ];
    if (category) {
      const cat = await db.query.blogCategories.findFirst({
        where: eq(blogCategories.slug, category),
        columns: { id: true },
      });
      if (cat) {
        clauses.push(
          sql`${blogPosts.id} IN (
            SELECT ${blogPostCategories.postId}
            FROM ${blogPostCategories}
            WHERE ${blogPostCategories.categoryId} = ${cat.id}
          )`,
        );
      }
    }

    const where = and(...clauses);

    const [rows, totals] = await Promise.all([
      db.query.blogPosts.findMany({
        where,
        orderBy: desc(blogPosts.publishedAt),
        limit: perPage,
        offset: (page - 1) * perPage,
        with: { translations: true, postCategories: { with: { category: true } } },
      }),
      db.select({ value: count() }).from(blogPosts).where(where),
    ]);

    const total = totals[0]?.value ?? 0;

    const data = rows.map((row) => {
      const t = pickTranslation(row.translations, locale);
      return {
        id: row.id,
        title: t?.title ?? '',
        slug: t?.slug ?? '',
        excerpt: t?.excerpt ?? null,
        featuredImage: row.featuredImage,
        publishedAt: row.publishedAt?.toISOString() ?? null,
        categories: row.postCategories.map((pc) => ({
          slug: pc.category.slug,
          name: pc.category.name,
        })),
      };
    });

    return c.json({ data, meta: toPageMeta(page, perPage, total) });
  })

  .get(
    '/:slug',
    validate('param', BlogPostSlugParamSchema),
    validate('query', PublicBlogQuerySchema),
    async (c) => {
      const db = c.get('db');
      const { slug } = c.req.valid('param');
      const { locale } = c.req.valid('query');

      const hit = await db.query.blogPostTranslations.findFirst({
        where: eq(blogPostTranslations.slug, slug),
        columns: { postId: true },
      });
      if (!hit) throw notFound('Blog post');

      const row = await db.query.blogPosts.findFirst({
        where: eq(blogPosts.id, hit.postId),
        with: {
          translations: true,
          postCategories: { with: { category: true } },
        },
      });
      if (!row || row.status !== 'published') throw notFound('Blog post');
      if (row.publishedAt && row.publishedAt > new Date()) throw notFound('Blog post');

      const t = pickTranslation(row.translations, locale);
      if (!t) throw notFound('Blog post');

      return c.json({
        data: {
          id: row.id,
          title: t.title,
          slug: t.slug,
          body: t.body,
          excerpt: t.excerpt,
          metaTitle: t.metaTitle,
          metaDescription: t.metaDescription,
          featuredImage: row.featuredImage,
          publishedAt: row.publishedAt?.toISOString() ?? null,
          categories: row.postCategories.map((pc) => ({
            slug: pc.category.slug,
            name: pc.category.name,
          })),
        },
      });
    },
  )

  .get('/categories', async (c) => {
    const rows = await c.get('db').query.blogCategories.findMany({
      where: eq(blogCategories.isActive, true),
      orderBy: blogCategories.position,
    });
    return c.json({
      data: rows.map((r) => ({ slug: r.slug, name: r.name })),
    });
  });
