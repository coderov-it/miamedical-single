import type { Database } from '@mia/db';
import { desc, eq } from '@mia/db';
import type { LanguageCode } from '@mia/db/schema';
import { termsDocumentTranslations, termsDocuments } from '@mia/db/schema';
import { P } from '@mia/permissions';
import {
  CreateTermsSchema,
  LocaleOnlyQuerySchema,
  TermsIdParamSchema,
  TermsSlugParamSchema,
  TermsStatusChangeSchema,
  UpdateTermsSchema,
  type CreateTermsInput,
  type UpdateTermsInput,
} from '@mia/validators';
import { Hono } from 'hono';

import { requirePermission } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { conflict, notFound } from '../../shared/http/errors.ts';
import { validate } from '../../shared/http/validate.ts';
import { pickTranslation } from '../products/i18n.ts';

/**
 * Terms & conditions documents. Small enough to stay flat: the repo layer is
 * the query calls below, mapping is inline, and the only policy is the
 * draft → published → archived flow (publishing bumps `version`).
 */

type TermsAggregate = typeof termsDocuments.$inferSelect & {
  translations: (typeof termsDocumentTranslations.$inferSelect)[];
};

async function findById(db: Database, id: string): Promise<TermsAggregate> {
  const row = await db.query.termsDocuments.findFirst({
    where: eq(termsDocuments.id, id),
    with: { translations: true },
  });
  if (!row) throw notFound('Terms document');
  return row;
}

async function upsertTranslations(
  db: Database,
  termsId: string,
  translations: CreateTermsInput['translations'] | undefined,
): Promise<void> {
  for (const lang of ['it', 'en'] as LanguageCode[]) {
    const t = translations?.[lang];
    if (!t) continue;
    await db
      .insert(termsDocumentTranslations)
      .values({ termsId, languageCode: lang, title: t.title, body: t.body, slug: t.slug })
      .onConflictDoUpdate({
        target: [termsDocumentTranslations.termsId, termsDocumentTranslations.languageCode],
        set: { title: t.title, body: t.body, slug: t.slug },
      });
  }
}

function toAdminDto(row: TermsAggregate) {
  const translations: Partial<
    Record<LanguageCode, { title: string; body: string; slug: string }>
  > = {};
  for (const t of row.translations) {
    translations[t.languageCode] = { title: t.title, body: t.body, slug: t.slug };
  }
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    version: row.version,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    translations,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const termsPublicRoutes = new Hono<AppEnv>().get(
  '/:slug',
  validate('param', TermsSlugParamSchema),
  validate('query', LocaleOnlyQuerySchema),
  async (c) => {
    const { slug } = c.req.valid('param');
    const { locale } = c.req.valid('query');
    const db = c.get('db');

    const hit = await db.query.termsDocumentTranslations.findFirst({
      where: eq(termsDocumentTranslations.slug, slug),
      columns: { termsId: true },
    });
    if (!hit) throw notFound('Terms document');

    const row = await db.query.termsDocuments.findFirst({
      where: eq(termsDocuments.id, hit.termsId),
      with: { translations: true },
    });
    if (!row || row.status !== 'published') throw notFound('Terms document');

    const translation = pickTranslation(row.translations, locale);
    if (!translation) throw notFound('Terms document');

    return c.json({
      data: {
        id: row.id,
        code: row.code,
        version: row.version,
        publishedAt: row.publishedAt?.toISOString() ?? null,
        locale,
        slug: translation.slug,
        title: translation.title,
        body: translation.body,
      },
    });
  },
);

export const termsAdminRoutes = new Hono<AppEnv>()
  .get('/', requirePermission(P.TERMS_READ), async (c) => {
    const rows = await c.get('db').query.termsDocuments.findMany({
      orderBy: desc(termsDocuments.updatedAt),
      with: { translations: true },
    });
    return c.json({ data: rows.map(toAdminDto) });
  })

  .post('/', requirePermission(P.TERMS_CREATE), validate('json', CreateTermsSchema), async (c) => {
    const db = c.get('db');
    const input: CreateTermsInput = c.req.valid('json');

    const existing = await db.query.termsDocuments.findFirst({
      where: eq(termsDocuments.code, input.code),
      columns: { id: true },
    });
    if (existing) throw conflict(`A terms document with code "${input.code}" already exists.`);

    const [created] = await db
      .insert(termsDocuments)
      .values({ code: input.code })
      .returning({ id: termsDocuments.id });
    if (!created) throw new Error('Terms insert returned no row.');
    await upsertTranslations(db, created.id, input.translations);

    return c.json({ data: toAdminDto(await findById(db, created.id)) }, 201);
  })

  .get(
    '/:id',
    requirePermission(P.TERMS_READ),
    validate('param', TermsIdParamSchema),
    async (c) => {
      return c.json({ data: toAdminDto(await findById(c.get('db'), c.req.valid('param').id)) });
    },
  )

  .patch(
    '/:id',
    requirePermission(P.TERMS_UPDATE),
    validate('param', TermsIdParamSchema),
    validate('json', UpdateTermsSchema),
    async (c) => {
      const db = c.get('db');
      const { id } = c.req.valid('param');
      const input: UpdateTermsInput = c.req.valid('json');
      await findById(db, id);

      if (input.code !== undefined) {
        const existing = await db.query.termsDocuments.findFirst({
          where: eq(termsDocuments.code, input.code),
          columns: { id: true },
        });
        if (existing && existing.id !== id) {
          throw conflict(`A terms document with code "${input.code}" already exists.`);
        }
        await db.update(termsDocuments).set({ code: input.code }).where(eq(termsDocuments.id, id));
      } else {
        await db.update(termsDocuments).set({ updatedAt: new Date() }).where(eq(termsDocuments.id, id));
      }
      await upsertTranslations(db, id, input.translations);

      return c.json({ data: toAdminDto(await findById(db, id)) });
    },
  )

  .post(
    '/:id/status',
    requirePermission(P.TERMS_PUBLISH),
    validate('param', TermsIdParamSchema),
    validate('json', TermsStatusChangeSchema),
    async (c) => {
      const db = c.get('db');
      const { id } = c.req.valid('param');
      const { status } = c.req.valid('json');
      const row = await findById(db, id);

      // Publishing a new revision bumps the version; other moves do not.
      const bump = status === 'published' && row.status !== 'published';
      await db
        .update(termsDocuments)
        .set({
          status,
          ...(bump ? { version: row.version + 1, publishedAt: new Date() } : {}),
        })
        .where(eq(termsDocuments.id, id));

      return c.json({ data: toAdminDto(await findById(db, id)) });
    },
  )

  .delete(
    '/:id',
    requirePermission(P.TERMS_DELETE),
    validate('param', TermsIdParamSchema),
    async (c) => {
      const db = c.get('db');
      const { id } = c.req.valid('param');
      await findById(db, id);
      // `product_terms.terms_id` is ON DELETE RESTRICT — linked documents refuse.
      try {
        await db.delete(termsDocuments).where(eq(termsDocuments.id, id));
      } catch (error) {
        if ((error as { code?: string })?.code === '23503') {
          throw conflict('This document is linked to products. Unlink it first.');
        }
        throw error;
      }
      return c.json({ data: { deleted: true } });
    },
  );
