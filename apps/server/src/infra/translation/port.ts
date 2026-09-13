import type { TranslateRequestInput } from '@mia/validators';

/**
 * Outbound translation port. Feature code depends on `TranslationProvider`; the
 * concrete provider (`DeepLTranslationProvider`, `StubTranslationProvider`) is
 * chosen once in ./index.ts and imported as a singleton.
 *
 * Never feature policy — which record is worth translating, from which language
 * and into which others are decisions for the caller (the admin's translate
 * dialog), not for a provider. A provider receives one source language, one
 * target and the text, and answers with text.
 *
 * `name` is for the log line the dialog prints and the boot summary, so an
 * operator can tell which engine produced a translation without reading config.
 */
export interface TranslationProvider {
  readonly name: string;
  /**
   * One language at a time, keyed by the caller's field keys. Rejects when the
   * provider could not answer at all; an individual field it declined to
   * translate is simply absent from the result rather than filled with the
   * source text — a silent copy is worse than a visible gap, because the gap
   * still falls back and the copy pretends to be translated.
   */
  translate(request: TranslateRequestInput): Promise<Record<string, string>>;
}
