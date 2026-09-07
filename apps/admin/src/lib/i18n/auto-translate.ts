/**
 * The seam for "generate the other languages from Italian".
 *
 * Nothing here calls a translation provider yet. What it fixes now is the
 * shape: every surface that could offer the action asks this module whether it
 * is available, so switching it on is one implementation plus a feature flag —
 * not a hunt through the editors for the right place to put a button.
 *
 * ── Why the UI must never render a dead control ────────────────────────────
 * `available` is read at render time and the affordance is omitted, not
 * disabled. A greyed-out "Translate" teaches an operator that the feature is
 * broken; an absent one teaches nothing, which is correct while it does not
 * exist. (The project rule against disabled controls says the same thing about
 * customer forms, for the same reason.)
 *
 * ── What the implementation has to respect ─────────────────────────────────
 * 1. Source is `SOURCE_LANGUAGE`, always. Translating a translation compounds
 *    error, and the source is the only language guaranteed to exist.
 * 2. It fills EMPTY targets only. An operator's own wording is never
 *    overwritten by a machine, so `translate()` receives the gaps, not the
 *    fields.
 * 3. Rich text arrives as HTML and must come back as HTML with the same tags —
 *    the server sanitises against an allowlist on write, so a provider that
 *    returns Markdown or invents tags produces silent data loss.
 * 4. The result is a DRAFT in the form, never a direct write. The operator
 *    saves it, so a bad translation is discarded by navigating away, and
 *    nothing reaches the storefront that a person did not accept.
 *
 * ── Why it cannot be a background job ─────────────────────────────────────
 * An empty target language is not a defect: the storefront falls back to the
 * source, so a missing French title renders the Italian one. Filling every gap
 * automatically would replace a working fallback with unreviewed text and, worse,
 * make the gap invisible to `gapsIn()` — the record would report itself complete.
 * The operator asking for it is what makes the text accountable to someone.
 */
import type { LanguageCode, TargetLanguageCode } from './languages.ts';

export interface TranslatableField {
  /** Stable key, so the caller can put the answer back where it came from. */
  key: string;
  /** What the field is called, for a provider that uses it as context. */
  label: string;
  /** Source-language text. */
  text: string;
  format: 'text' | 'html';
}

export interface TranslateRequest {
  source: LanguageCode;
  targets: TargetLanguageCode[];
  fields: TranslatableField[];
}

/** `{ fr: { title: 'Fauteuil roulant pliant' } }` — only the languages and keys that came back. */
export type TranslateResult = Partial<Record<TargetLanguageCode, Record<string, string>>>;

export interface AutoTranslate {
  readonly available: boolean;
  translate(request: TranslateRequest): Promise<TranslateResult>;
}

/**
 * Resolved once, not per call — the same rule the server's feature flags follow
 * (`apps/server/src/config/features.ts`), so "on but unconfigured" is
 * unreachable. Today it is off because no provider exists; when one does, this
 * becomes a check on the capability the session already carries.
 */
export const autoTranslate: AutoTranslate = {
  available: false,
  translate() {
    return Promise.reject(
      new Error(
        'Automatic translation is not configured. Check `autoTranslate.available` before offering the action.',
      ),
    );
  },
};
