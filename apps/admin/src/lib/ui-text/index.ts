/**
 * `t()` and `tn()` — interface copy in the operator's chosen language.
 *
 * Both read `uiLang.current`, so a call inside markup re-renders when the
 * topbar switches language. Call them at render time, never at module level:
 * a constant computed once is frozen in whatever language loaded first. A
 * module-level structure (the nav) stores keys, and the component calls `t()`.
 *
 *   t('common.save')                          → "Salva"
 *   t('orders.title', { code: 'MM-102' })     → "Ordine MM-102"
 *   tn('orders.items', 3)                     → "3 articoli"   (orders.items.one / .other)
 *
 * See docs/code/admin-ui-text.md.
 */
import { languageOf } from '~/lib/i18n/languages';
import { uiLang } from '~/lib/ui-lang.svelte';

import { MESSAGES, type MessageKey, type PluralKey, REFERENCE_LANGUAGE } from './catalogue.ts';

export type { MessageKey, PluralKey };

type Params = Record<string, string | number>;

function interpolate(template: string, params: Params): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in params ? String(params[name]) : whole,
  );
}

/** A gap — absent OR empty — falls back to English, then to the key itself. */
function lookup(key: string): string | undefined {
  const requested = MESSAGES[uiLang.current]?.[key];
  if (requested) return requested;
  return MESSAGES[REFERENCE_LANGUAGE]?.[key];
}

/**
 * For catalogues keyed by DATA rather than code — `permissions.order:read`,
 * where the key comes from a package at runtime and so cannot be a
 * `MessageKey`. `undefined` when absent; the caller supplies the fallback, and a
 * test pins the catalogue to the data so the fallback is never reached.
 */
export function tOptional(key: string, params?: Params): string | undefined {
  const template = lookup(key);
  if (template === undefined) return undefined;
  return params ? interpolate(template, params) : template;
}

export function t(key: MessageKey, params?: Params): string {
  const template = lookup(key) ?? key;
  return params ? interpolate(template, params) : template;
}

const pluralRules = new Map<string, Intl.PluralRules>();

function pluralCategory(count: number): Intl.LDMLPluralRule {
  const tag = languageOf(uiLang.current).tag;
  let rules = pluralRules.get(tag);
  if (!rules) {
    rules = new Intl.PluralRules(tag);
    pluralRules.set(tag, rules);
  }
  return rules.select(count);
}

/**
 * Counted copy. Picks `<key>.<category>` by the language's plural rules, then
 * `<key>.other`. `{count}` is always available to the template.
 */
export function tn(key: PluralKey, count: number, params?: Params): string {
  const template =
    lookup(`${key}.${pluralCategory(count)}`) ?? lookup(`${key}.other`) ?? `${key}.other`;
  return interpolate(template, { count, ...params });
}
