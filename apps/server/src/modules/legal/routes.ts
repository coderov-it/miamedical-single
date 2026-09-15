import { eq } from '@mia/db';
import type { LanguageCode, Localized } from '@mia/db/schema';
import { LANGUAGE_CODES, legalPages, pickLocalized, SOURCE_LANGUAGE } from '@mia/db/schema';
import { P } from '@mia/permissions';
import type { LegalPageCode, LocalizedOptional, UpdateLegalPageInput } from '@mia/validators';
import {
  LegalPageCodeParamSchema,
  LegalPageQuerySchema,
  sanitizeRichText,
  UpdateLegalPageSchema,
} from '@mia/validators';
import { Hono } from 'hono';

import { currentUser, requirePermission } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { httpError, notFound } from '../../shared/http/errors.ts';
import { validate } from '../../shared/http/validate.ts';

/**
 * The site's own policies — the privacy notice today. One row per page, keyed
 * by the storefront route it renders at.
 *
 * Flat like `modules/settings` and `modules/terms`: one table, one row per code,
 * and the only policy worth a name is the two rules below. Storage and the
 * split from product terms are argued in `packages/db/src/schema/legal.ts`;
 * the storefront half is in `docs/code/legal-pages.md`.
 *
 *   1. **HTML is sanitised here, per language.** The admin's Tiptap editor
 *      constrains what it can produce, but the API accepts a PUT from any
 *      client holding a token and the storefront renders this column with
 *      `set:html` — so `sanitizeRichText` is what actually decides.
 *   2. **An empty target language is absent, never blank.** The storefront
 *      falls back to the source language when a key is missing; a stored `''`
 *      would render as a real, empty translation instead.
 */

type LocalizedText = Localized;
/** What the validator hands over: every language optional, source included. */
type LocalizedInput = LocalizedOptional;

/** Drop blank languages, keep the source. `null` when nothing is left. */
function compact(value: LocalizedInput | null | undefined): LocalizedText | null {
  if (!value) return null;
  const out: Record<string, string> = {};
  for (const lang of LANGUAGE_CODES) {
    const text = value[lang]?.trim();
    if (text) out[lang] = text;
  }
  return out[SOURCE_LANGUAGE] ? (out as LocalizedText) : null;
}

/** Same, through the HTML allowlist — rule 1 above. */
function compactRichText(value: LocalizedInput): LocalizedText | null {
  const out: Record<string, string> = {};
  for (const lang of LANGUAGE_CODES) {
    const clean = sanitizeRichText(value[lang]);
    if (clean) out[lang] = clean;
  }
  return out[SOURCE_LANGUAGE] ? (out as LocalizedText) : null;
}

/**
 * The languages this page is genuinely readable in: both the title and the body
 * written, not a title with the Italian text under it.
 *
 * The storefront spends this on `hreflang` and on the sitemap, which is why it
 * is computed here rather than guessed there — advertising `/fr/` for a page
 * that renders Italian asks Google to index the same text twice.
 */
function availableLocales(row: typeof legalPages.$inferSelect): LanguageCode[] {
  return LANGUAGE_CODES.filter((lang) =>
    Boolean(row.title[lang]?.trim() && row.body[lang]?.trim()),
  );
}

export const legalPublicRoutes = new Hono<AppEnv>().get(
  '/:code',
  validate('param', LegalPageCodeParamSchema),
  validate('query', LegalPageQuerySchema),
  async (c) => {
    const { code } = c.req.valid('param');
    const { locale } = c.req.valid('query');

    const row = await c.get('db').query.legalPages.findFirst({
      where: eq(legalPages.code, code),
    });
    if (!row) throw notFound('Legal page');

    const locales = availableLocales(row);
    /* Which language the TEXT is in, which is not the requested locale when the
       page has not been translated yet. The storefront puts it on `lang=` so a
       screen reader does not read Italian with French pronunciation rules. */
    const contentLocale = locales.includes(locale) ? locale : SOURCE_LANGUAGE;

    return c.json({
      data: {
        code: row.code,
        locale,
        contentLocale,
        availableLocales: locales,
        title: pickLocalized(row.title, contentLocale),
        body: pickLocalized(row.body, contentLocale),
        metaTitle: row.metaTitle?.[contentLocale] ?? null,
        metaDescription: row.metaDescription?.[contentLocale] ?? null,
        effectiveAt: row.effectiveAt?.toISOString() ?? null,
        updatedAt: row.updatedAt.toISOString(),
      },
    });
  },
);

/** The editor's view: every language at once, plus the two dates it shows. */
function toAdminDto(row: typeof legalPages.$inferSelect) {
  return {
    code: row.code,
    exists: true,
    title: row.title,
    body: row.body,
    metaTitle: row.metaTitle ?? null,
    metaDescription: row.metaDescription ?? null,
    effectiveAt: row.effectiveAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
    availableLocales: availableLocales(row),
  };
}

/**
 * A page that has never been written is not an error — it is the editor's first
 * visit. `exists: false` with empty fields is what the form binds to, so there
 * is no "create" flow to get wrong and no way to end up with two rows.
 */
function emptyDto(code: LegalPageCode): ReturnType<typeof toAdminDto> {
  return {
    code,
    exists: false,
    title: { [SOURCE_LANGUAGE]: '' } as LocalizedText,
    body: { [SOURCE_LANGUAGE]: '' } as LocalizedText,
    metaTitle: null,
    metaDescription: null,
    effectiveAt: null,
    updatedAt: new Date(0).toISOString(),
    availableLocales: [],
  };
}

export const legalAdminRoutes = new Hono<AppEnv>()
  .get(
    '/:code',
    requirePermission(P.LEGAL_PAGE_READ),
    validate('param', LegalPageCodeParamSchema),
    async (c) => {
      const { code } = c.req.valid('param');
      const row = await c.get('db').query.legalPages.findFirst({
        where: eq(legalPages.code, code),
      });
      return c.json({ data: row ? toAdminDto(row) : emptyDto(code) });
    },
  )

  .put(
    '/:code',
    requirePermission(P.LEGAL_PAGE_UPDATE),
    validate('param', LegalPageCodeParamSchema),
    validate('json', UpdateLegalPageSchema),
    async (c) => {
      const { code } = c.req.valid('param');
      const input: UpdateLegalPageInput = c.req.valid('json');
      const db = c.get('db');

      const title = compact(input.title);
      if (!title) throw httpError(422, 'A title in Italian is required.', 'invalid_title');

      const body = compactRichText(input.body);
      if (!body) {
        /* Either nothing was written, or everything written was markup the
           allowlist drops. Both leave the page with no Italian text, and a page
           with no Italian text has no fallback for any other language. */
        throw httpError(422, 'The Italian text of the page is required.', 'invalid_body');
      }

      const values = {
        title,
        body,
        metaTitle: compact(input.metaTitle),
        metaDescription: compact(input.metaDescription),
        effectiveAt: input.effectiveAt ? new Date(input.effectiveAt) : null,
        updatedByAdminUserId: currentUser(c).id,
        updatedAt: new Date(),
      };

      const [saved] = await db
        .insert(legalPages)
        .values({ code, ...values })
        .onConflictDoUpdate({ target: legalPages.code, set: values })
        .returning();

      return c.json({ data: toAdminDto(saved!) });
    },
  );
