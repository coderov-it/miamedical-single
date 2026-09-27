import { P } from '@mia/permissions';
import { TranslateRequestSchema, TranslateResponseSchema } from '@mia/validators';
import { Hono } from 'hono';
import * as v from 'valibot';

import { translationProvider } from '../../infra/translation/index.ts';
import { requireAnyPermission } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { httpError } from '../../shared/http/errors.ts';
import { validate } from '../../shared/http/validate.ts';

/**
 * Automatic translation. Two endpoints and no persistence: this module turns
 * text in one language into another, and the caller decides what to do with it.
 * Nothing here reads or writes a catalogue record — the dialog shows the result
 * for review and the operator saves it through the record's ordinary write
 * path, which already enforces the translation-row rules.
 *
 * Open to anyone who can edit a product or a category; the legal page editor
 * rides on `product:update`. A shared `translation:generate` capability is the
 * right home for all three. See `docs/code/product-translation.md`.
 */
const canTranslate = requireAnyPermission(P.PRODUCT_UPDATE, P.CATEGORY_UPDATE, P.CATEGORY_CREATE);

export const translationAdminRoutes = new Hono<AppEnv>()
  /** --------------------------------------------------------------------------
  GET /api/admin/translate (product:update | category:update | category:create)
  Whether automatic translation is configured, and by which provider.
  -------------------------------------------------------------------------- **/
  /** Probed once by the admin so it can omit the action instead of disabling it. */
  .get('/', canTranslate, (c) =>
    c.json({
      enabled: translationProvider !== null,
      provider: translationProvider?.name ?? null,
    }),
  )
  /** --------------------------------------------------------------------------
  POST /api/admin/translate (product:update | category:update | category:create)
  Translates the given texts and returns them for review; saves nothing.
  -------------------------------------------------------------------------- **/
  .post('/', canTranslate, validate('json', TranslateRequestSchema), async (c) => {
    const provider = translationProvider;
    // Reachable only if the environment changed under a running process; the
    // boot guard in config/env.ts keeps "selected but unconfigured" away.
    if (!provider) {
      throw httpError(
        503,
        'Automatic translation is not configured on this server.',
        'translation_disabled',
      );
    }

    const translations = await provider.translate(c.req.valid('json'));
    // The provider's answer crosses the wire, so it is checked like any other
    // untrusted input: a value that is not `{ key: string }` would otherwise
    // reach the admin as something its review step cannot render.
    return c.json(v.parse(TranslateResponseSchema, { translations }));
  });
