import type { TranslateRequestInput } from '@mia/validators';

import type { TranslationProvider } from './port.ts';

/**
 * Development provider: returns the source text with a language marker in
 * front, and translates nothing.
 *
 * It exists so the admin's translate dialog is exercisable — the confirmation,
 * the per-language log, the protected-language skip rule and the review step
 * are all real work that would otherwise be untestable until somebody bought a
 * DeepL key. What it produces is deliberately WRONG and obviously so: `[fr]`
 * in front of Italian prose cannot be mistaken for a translation, which is what
 * stops placeholder text from being reviewed as if it were a result.
 *
 * `config/env.ts` refuses to boot production on this provider (compare the
 * `console` mail transport), and the boot summary says what it is. Never
 * production: the marker would become customer-visible copy.
 */
export class StubTranslationProvider implements TranslationProvider {
  readonly name = 'stub';

  translate({ target, fields }: TranslateRequestInput): Promise<Record<string, string>> {
    const marker = `[${target}] `;
    const translations: Record<string, string> = {};
    for (const field of fields) translations[field.key] = `${marker}${field.text}`;
    return Promise.resolve(translations);
  }
}
