import * as v from 'valibot';

import { localizedOptionalSchema, localizedSchema, LocaleQuerySchema } from './i18n.ts';

/**
 * The site's own policies — the privacy notice today, the cookie notice and a
 * service-wide terms page when they are written.
 *
 * Deliberately NOT the 1800 terms documents: those are a pool of rental and
 * warranty conditions a *product* links to, listed in the product editor's
 * terms tab. A legal page belongs to the site, lives at a URL fixed in
 * `apps/website/src/lib/routes.ts`, and has exactly one edition — so it has no
 * slug of its own, no draft/published pair and no list.
 *
 * ── Why inline localized columns, not a translations table ─────────────────
 * The project rule (packages/db/src/schema/i18n.ts): translated text goes in a
 * `*_translations` table only when PostgreSQL indexes it — full-text search or
 * a per-locale unique slug. A legal page is neither searched nor addressed by a
 * stored slug, so every field is a `{ it, en, … }` jsonb column and the admin's
 * existing localized field components bind to it directly.
 */

/**
 * Which pages exist. A code is a storefront route key's worth of identity, and
 * adding one is a two-line change here plus a route in the storefront — never
 * an operator typing a new code into a form, which is how you get a page nobody
 * links to.
 */
export const LEGAL_PAGE_CODES = ['privacy-policy'] as const;
export type LegalPageCode = (typeof LEGAL_PAGE_CODES)[number];

export const LegalPageCodeSchema = v.picklist(
  LEGAL_PAGE_CODES,
  `Unknown legal page. Expected one of: ${LEGAL_PAGE_CODES.join(', ')}.`,
);

export const LegalPageCodeParamSchema = v.object({ code: LegalPageCodeSchema });

export const LegalPageQuerySchema = v.object({ locale: LocaleQuerySchema });

/**
 * Field caps, and the two that are search-result geometry rather than taste:
 * a `<title>` is cut around 60 characters in Google's results and a meta
 * description around 160, so the admin's counters warn well before these and
 * these only stop an accident.
 */
export const LEGAL_PAGE_LIMITS = {
  title: 200,
  body: 200_000,
  metaTitle: 120,
  metaDescription: 300,
} as const;

export const UpdateLegalPageSchema = v.strictObject({
  title: localizedSchema(LEGAL_PAGE_LIMITS.title),
  /**
   * Operator-written HTML from the admin's Tiptap editor. The server runs every
   * language through `sanitizeRichText` on write — this only bounds the size.
   */
  body: localizedSchema(LEGAL_PAGE_LIMITS.body),
  metaTitle: v.optional(localizedOptionalSchema(LEGAL_PAGE_LIMITS.metaTitle)),
  metaDescription: v.optional(localizedOptionalSchema(LEGAL_PAGE_LIMITS.metaDescription)),
  /**
   * "In vigore dal" — the date the policy takes effect, which a privacy notice
   * has to state and which is NOT the row's `updated_at`: fixing a typo does
   * not restart the notice period. Null while the operator has not set one.
   */
  effectiveAt: v.optional(v.nullable(v.pipe(v.string(), v.isoTimestamp()))),
});

export type UpdateLegalPageInput = v.InferOutput<typeof UpdateLegalPageSchema>;
