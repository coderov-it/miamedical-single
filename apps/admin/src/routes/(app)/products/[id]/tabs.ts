/**
 * The product editor's tab set.
 *
 * One list, exported, because three things need to agree on it: the tab strip,
 * the `?tab=` parser, and the unsaved-changes guard's "you have changes in X"
 * message. Three hand-maintained copies is how a tab ends up unreachable.
 */

import { type MessageKey, t } from '~/lib/ui-text';

export const PRODUCT_TABS = [
  { key: 'basics', labelKey: 'products.tabBasics' },
  /**
   * The long description has its own tab because it is the one field edited in
   * a rich-text surface: it needs a toolbar and room to write, and both fight
   * a column of single-line fields.
   */
  { key: 'description', labelKey: 'products.tabDescription' },
  { key: 'pricing', labelKey: 'products.tabPricing' },
  { key: 'specs', labelKey: 'products.tabSpecs' },
  { key: 'media', labelKey: 'products.tabMedia' },
  { key: 'addons', labelKey: 'products.tabAddons' },
  { key: 'faqs', labelKey: 'products.tabFaqs' },
  { key: 'questions', labelKey: 'products.tabQuestions' },
  { key: 'terms', labelKey: 'products.tabTerms' },
  { key: 'stock', labelKey: 'stock.tabTitle' },
] as const satisfies ReadonlyArray<{ key: string; labelKey: MessageKey }>;

export type ProductTabKey = (typeof PRODUCT_TABS)[number]['key'];

export const DEFAULT_TAB: ProductTabKey = 'basics';

/** Anything unrecognised falls back rather than rendering an empty editor. */
export function parseTab(value: string | null): ProductTabKey {
  return PRODUCT_TABS.some((tab) => tab.key === value) ? (value as ProductTabKey) : DEFAULT_TAB;
}

/** Translated at call time — the strip and the unsaved-changes guard both call it from markup. */
export function tabLabel(key: string): string {
  const tab = PRODUCT_TABS.find((entry) => entry.key === key);
  return tab ? t(tab.labelKey) : key;
}
