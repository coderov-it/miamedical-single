import { P } from '@mia/permissions';
import { TranslateRequestSchema, TranslateResponseSchema } from '@mia/validators';
import { Hono } from 'hono';
import * as v from 'valibot';

import { translationProvider } from '../../infra/translation/index.ts';
import { requirePermission } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { httpError } from '../../shared/http/errors.ts';
import { validate } from '../../shared/http/validate.ts';

/**
 * Automatic translation. Two endpoints and no persistence: this module turns
 * text in one language into another, and the caller decides what to do with it.
 * Nothing here reads or writes a catalogue record — the dialog shows the result
 * for review and the operator saves it through the ordinary product PATCH, so
 * the write path stays the one that already enforces the translation-row rules.
 *
 * Guarded by `product:update` because the product editor is the only caller; a
 * shared `translation:generate` capability is the right home once a second
 * editor wants it. See `docs/code/product-translation.md`.
 */
export const translationAdminRoutes = new Hono<AppEnv>()
  /** Probed once by the admin so it can omit the action instead of disabling it. */
  .get('/', requirePermission(P.PRODUCT_UPDATE), (c) =>
    c.json({
      enabled: translationProvider !== null,
      provider: translationProvider?.name ?? null,
    }),
  )
  .post(
    '/',
    requirePermission(P.PRODUCT_UPDATE),
    validate('json', TranslateRequestSchema),
    async (c) => {
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
    },
  );
