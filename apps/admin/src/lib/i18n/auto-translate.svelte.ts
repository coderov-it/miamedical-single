import type { TranslationCapability } from '@mia/validators';

import { api } from '~/lib/api';
import { unwrapFull } from '~/lib/request';

import type { LanguageCode, TargetLanguageCode } from './languages.ts';
import type { TranslateFieldPayload } from './translation-plan.ts';

/**
 * The admin's client for automatic translation.
 *
 * It never writes — the dialog shows what came back and the operator saves it
 * through the ordinary product PATCH, so the rules about what a translation row
 * may contain stay in one place. And it never assumes a provider exists:
 * `available` starts false and the action is absent until a probe says
 * otherwise, never rendered dead.
 *
 * One request per target language rather than one batch, so the dialog can log
 * each language as it lands. See `docs/code/product-translation.md`.
 */

export interface TranslateParams {
  source: LanguageCode;
  target: TargetLanguageCode;
  fields: TranslateFieldPayload[];
}

/** `{ title: 'Fauteuil…' }` — only the keys the provider answered. */
export type TranslateResult = Record<string, string>;

class AutoTranslate {
  /** Render-time truth. `false` until a probe succeeds; see the class doc. */
  available = $state(false);
  /** Provider name for the log line, e.g. `deepl` or `stub`. */
  provider = $state<string | null>(null);

  #probed = false;

  /**
   * Ask the API once whether translation is configured. Called by an editor on
   * mount; safe to call often, and it retries after a failure rather than
   * caching a transient error as "off for the session".
   */
  async probe(): Promise<void> {
    if (this.#probed) return;

    try {
      const capability = await unwrapFull<TranslationCapability>(
        await api.api.admin.translate.$get(),
      );
      this.available = capability.enabled;
      this.provider = capability.provider;
      this.#probed = true;
    } catch {
      // No session, no `product:update`, or an API without the route: the
      // action stays hidden and nothing is surfaced. There is no such thing as
      // a "failed" feature probe a person needs to know about.
      this.available = false;
      this.provider = null;
    }
  }

  async translate({ source, target, fields }: TranslateParams): Promise<TranslateResult> {
    const body = await unwrapFull<{ translations: TranslateResult }>(
      await api.api.admin.translate.$post({ json: { source, target, fields } }),
    );
    return body.translations;
  }
}

export const autoTranslate = new AutoTranslate();
