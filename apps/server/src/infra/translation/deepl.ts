import type { TranslateRequestInput } from '@mia/validators';

import type { TranslationProvider } from './port.ts';

/**
 * DeepL. The reason it is the first real provider: its coverage starts from
 * Italian and reaches every language this catalogue is sold in (EN/FR/DE), and
 * its `tag_handling: html` mode translates the text between tags while leaving
 * the markup alone — which is exactly what a rich-text description needs, since
 * the server sanitises against an allowlist on write and Markdown coming back
 * would be stored as literal angle brackets.
 *
 * ── Why the batch is split by format ───────────────────────────────────────
 * `tag_handling` applies to the whole request, and HTML mode HTML-escapes the
 * text it returns. A plain title sent through it comes back as
 * `Vente d&#x27;un fauteuil roulant` — which is what reached the database the
 * first time this ran. So a record that mixes prose and markup becomes two
 * requests: markup with the mode, everything else without it. DeepL's own
 * escaping inside the HTML is correct and stays.
 *
 * The credential is captured in the constructor rather than read here, so a
 * provider instance cannot exist without one (see ../index.ts and the boot guard
 * in `config/env.ts`).
 */
export class DeepLTranslationProvider implements TranslationProvider {
  readonly name = 'deepl';

  constructor(
    private readonly apiKey: string,
    private readonly apiUrl: string,
  ) {}

  async translate({
    source,
    target,
    fields,
  }: TranslateRequestInput): Promise<Record<string, string>> {
    const translations: Record<string, string> = {};

    // Two groups, not one per field: fields of the same format share a request.
    for (const format of ['html', 'text'] as const) {
      const group = fields.filter((field) => field.format === format);
      if (group.length === 0) continue;

      const answered = await this.request(
        group.map((field) => field.text),
        {
          source,
          target,
          html: format === 'html',
        },
      );

      group.forEach((field, index) => {
        const text = answered[index];
        // An absent answer stays absent: the caller reports the gap rather than
        // storing the source text as if it had been translated.
        if (text !== undefined) translations[field.key] = text;
      });
    }

    return translations;
  }

  private async request(
    text: string[],
    { source, target, html }: { source: string; target: string; html: boolean },
  ): Promise<Array<string | undefined>> {
    const response = await fetch(`${this.apiUrl}/v2/translate`, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        // Source may be omitted for auto-detection, but inferring it from the
        // text is how an Italian product gets translated as if it were Spanish.
        source_lang: source.toUpperCase(),
        target_lang: targetCode(target),
        // Only for markup. See the class comment: HTML mode escapes plain text.
        ...(html ? { tag_handling: 'html' } : {}),
        preserve_formatting: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepL responded ${response.status}: ${await response.text()}`);
    }

    const body = (await response.json()) as { translations: { text: string }[] };
    return text.map((_, index) => body.translations[index]?.text);
  }
}

/**
 * DeepL names the English variants (`EN-GB`, `EN-US`) and rejects a bare `EN`
 * as a target; every other registered code is already its code uppercased. The
 * registry's `en` tag is `en-GB`, so this is the one language that needs saying.
 */
function targetCode(code: string): string {
  return code === 'en' ? 'EN-GB' : code.toUpperCase();
}
