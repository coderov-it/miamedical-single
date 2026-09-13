import { EXTERNAL_APIS } from '../../config/external-apis.ts';
import { type Env, env } from '../../config/env.ts';
import { DeepLTranslationProvider } from './deepl.ts';
import type { TranslationProvider } from './port.ts';
import { StubTranslationProvider } from './stub.ts';

/**
 * The one place a provider is chosen. Feature code imports `translationProvider`
 * and never learns which one it got.
 *
 * `null` is a reachable, intended state: translation is optional, and with no
 * provider the admin hides the action entirely instead of offering a button
 * that fails. `config/env.ts` refuses to boot production on `stub` (placeholder
 * text must never reach a customer) and refuses `deepl` without a key, so
 * "enabled but unconfigured" cannot happen either.
 *
 * A `Record` over the union rather than a ternary or a switch: adding a provider
 * to `TRANSLATION_PROVIDER` without wiring it here is a type error, not a
 * runtime surprise.
 */
const PROVIDERS: Record<Env['TRANSLATION_PROVIDER'], () => TranslationProvider | null> = {
  none: () => null,
  stub: () => new StubTranslationProvider(),
  deepl: () => new DeepLTranslationProvider(deeplKey(), EXTERNAL_APIS.deeplBaseUrl),
};

export const translationProvider: TranslationProvider | null =
  PROVIDERS[env.TRANSLATION_PROVIDER]();

/**
 * Unreachable as written — `config/env.ts` already refuses to boot when the
 * provider is `deepl` and the key is missing. Re-checking here is what lets the
 * constructor take a `string` instead of the caller asserting non-null.
 */
function deeplKey(): string {
  const key = env.DEEPL_API_KEY;
  if (!key) throw new Error('DEEPL_API_KEY is required when TRANSLATION_PROVIDER is "deepl".');
  return key;
}

export type { TranslationProvider } from './port.ts';
