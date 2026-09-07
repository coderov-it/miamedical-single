/**
 * Text → HTML, and the formatters every part of the page shares.
 *
 * Everything a data file wrote passes through `escape` on its way to the page.
 * The two exceptions are a product `description` and a terms `body`, which ARE
 * HTML — seeing them rendered instead of read as a one-line string literal is
 * the reason this preview exists. Those go through `richText`, which is the
 * identity function and named so the call site says out loud that raw markup
 * is intended there and nowhere else.
 *
 * # Two languages, one DOM
 *
 * `localized()` emits BOTH languages, each tagged `data-lang`, and the toggle
 * in the corner flips one CSS rule on `<html>`. Nothing is re-rendered and no
 * text is fetched, so switching is instant and — the point — the English side
 * is really in the file rather than assembled at click time, which is what lets
 * a missing translation be visible at all.
 *
 * A value with no `en` still emits an English span, holding the Italian and
 * marked `untranslated`. That mirrors the database, where Italian is the only
 * language guaranteed to exist: the storefront falls back to it, so the preview
 * shows the fallback rather than an empty space.
 *
 * Numbers are formatted `it-IT` because they are read by the shop: `1.234,56 €`
 * and `39,5`, never `1234.56`. The value formatted is always the one the data
 * file wrote — nothing here rounds, and nothing here is written back.
 */
import type { Localized } from '../../lib/types.ts';
import { LANGUAGE_CODES, languageOf, SOURCE_LANGUAGE } from '@mia/validators/language';

const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escape = (text: string): string =>
  text.replaceAll(/[&<>"']/g, (character) => ENTITIES[character] ?? character);

/** Authored markup, passed through on purpose. The only unescaped path. */
export const richText = (html: string): string => html;

const EURO = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
const DECIMAL = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 4 });

export const money = (amount: number): string => EURO.format(amount);
export const decimal = (value: number): string => DECIMAL.format(value);

/** Both languages, `data-lang` tagged. `tag` is the element to wrap each in. */
export function localized(value: Localized, tag = 'span'): string {
  const source = languageOf(SOURCE_LANGUAGE).label;
  return LANGUAGE_CODES.map((code) => {
    const text = value[code];
    if (code === SOURCE_LANGUAGE || (text !== undefined && text !== '')) {
      return `<${tag} data-lang="${code}">${escape(text ?? value[SOURCE_LANGUAGE])}</${tag}>`;
    }
    const label = languageOf(code).label;
    return `<${tag} data-lang="${code}" class="untranslated" title="No ${label} written — showing ${source}">${escape(value[SOURCE_LANGUAGE])}</${tag}>`;
  }).join('');
}

/**
 * The same for authored markup — a `description`, a terms `body`.
 *
 * Takes the whole localized value rather than a `(it, en)` pair: a positional
 * pair is one parameter per language, which is exactly what made the third
 * language a change to every caller.
 */
export function localizedRich(value: Localized): string {
  const source = languageOf(SOURCE_LANGUAGE).label;
  return LANGUAGE_CODES.map((code) => {
    const text = value[code];
    if (code === SOURCE_LANGUAGE || (text !== undefined && text !== '')) {
      return `<div class="rich" data-lang="${code}">${richText(text ?? value[SOURCE_LANGUAGE])}</div>`;
    }
    const label = languageOf(code).label;
    return `<div class="rich untranslated" data-lang="${code}">${richText(value[SOURCE_LANGUAGE])}<p class="untranslated-note">No ${label} written — showing ${source}.</p></div>`;
  }).join('');
}

/** Source language only, for a `title=` attribute or a `document.title`. */
export const plain = (value: Localized): string => value[SOURCE_LANGUAGE];

export const code = (text: string): string => `<code>${escape(text)}</code>`;

/** A `label / value` row inside a `.fields` list. Skipped when there is no value. */
export function field(label: string, value: string | undefined): string {
  if (!value) return '';
  return `<div class="field"><span class="field-label">${escape(label)}</span><div class="field-value">${value}</div></div>`;
}

/** One numbered section of a product page. Rendered only when it has content. */
export function section(id: string, heading: string, body: string, note = ''): string {
  if (!body.trim()) return '';
  return `<section class="panel" id="panel-${escape(id)}">
    <header class="panel-head"><h2>${escape(heading)}</h2>${note ? `<span class="panel-note">${escape(note)}</span>` : ''}</header>
    ${body}
  </section>`;
}

export const rows = (parts: readonly string[]): string => parts.filter(Boolean).join('');
