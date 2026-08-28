/**
 * The product editor's tab set.
 *
 * One list, exported, because three things need to agree on it: the tab strip,
 * the `?tab=` parser, and the unsaved-changes guard's "you have changes in X"
 * message. Three hand-maintained copies is how a tab ends up unreachable.
 */

export const PRODUCT_TABS = [
  { key: 'basics', label: 'Basics' },
  /**
   * The long description has its own tab because it is the one field edited in
   * a rich-text surface: it needs a toolbar and room to write, and both fight
   * a column of single-line fields.
   */
  { key: 'description', label: 'Description' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'specs', label: 'Specs' },
  { key: 'media', label: 'Media' },
  { key: 'addons', label: 'Addons' },
  { key: 'faqs', label: 'FAQs' },
  { key: 'questions', label: 'Questions' },
  { key: 'terms', label: 'Terms' },
] as const;

export type ProductTabKey = (typeof PRODUCT_TABS)[number]['key'];

export const DEFAULT_TAB: ProductTabKey = 'basics';

/** Anything unrecognised falls back rather than rendering an empty editor. */
export function parseTab(value: string | null): ProductTabKey {
  return PRODUCT_TABS.some((tab) => tab.key === value) ? (value as ProductTabKey) : DEFAULT_TAB;
}

export function tabLabel(key: string): string {
  return PRODUCT_TABS.find((tab) => tab.key === key)?.label ?? key;
}
