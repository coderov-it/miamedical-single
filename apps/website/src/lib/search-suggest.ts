/**
 * The home search's suggestion index — categories and products, built once on
 * the server and handed to the browser as JSON.
 *
 * IT IS EMBEDDED, NOT FETCHED. The whole catalogue is ~110 products and the
 * home page already holds every one of them in memory for its rails, so the
 * index costs one pass over data that is already there and ~17 KB on the wire,
 * most of it repeated words that compress well. In exchange a keystroke costs
 * nothing: no endpoint, no debounce, no
 * request in flight when the customer types the sixth letter of "carrozzina",
 * and the list is still there when the connection is not. Past a few thousand
 * products that trade stops paying — move it behind an endpoint then, and the
 * component's contract does not change.
 *
 * The wire carries only what a row RENDERS. The match key is derived in the
 * browser once at mount instead of being shipped: it is the label lowercased
 * with its accents stripped, so sending it duplicates most of the payload to
 * save one pass over ~125 short strings — work measured in microseconds, and
 * done once rather than per keystroke. Dropping it and `kind` took the index
 * from 25.3 KB to 17.1 KB (measured 2026-09-05, 107 products, 18 categories).
 */
import { perUnitLabel } from '@mia/i18n';

import { formatMoney } from './api.ts';
import type { Category, ProductSummary } from './catalog.ts';
import { localeTag, type SiteLocale } from './i18n.ts';
import { t } from './labels.ts';
import { catalogPath, productPath } from './routes.ts';

export interface SuggestItem {
  /** What the row reads. */
  label: string;
  /** Where picking the row goes. */
  href: string;
  /** The row's right-hand column: "Categoria", or the product's price. */
  meta: string;
}

/**
 * A product's figure, worded exactly as the card words it: a rental's marketing
 * rate carries its unit, a sale price stands alone, and a product with neither
 * shows nothing rather than a dash.
 */
function priceMeta(product: ProductSummary, locale: SiteLocale): string {
  const amount = product.pricing.marketingRate ?? product.pricing.fromPrice;
  if (amount === null) return '';

  const money = formatMoney(amount, product.pricing.currency, localeTag(locale));
  if (product.pricing.mode !== 'rental' || product.pricing.marketingRate === null) return money;
  return `${money} ${perUnitLabel(product.pricing.rentalUnit, locale)}`;
}

/**
 * Categories first, then products, each in the order the catalogue already puts
 * them in — the browser filters and truncates, it never re-sorts. An empty
 * category is left out: suggesting a name that leads to an empty listing is
 * worse than not suggesting it.
 */
export function buildSuggestIndex(
  products: ProductSummary[],
  categories: Category[],
  locale: SiteLocale,
): SuggestItem[] {
  const categoryLabel = t('search.suggest.category', undefined, locale);

  const categoryItems: SuggestItem[] = categories
    .filter((category) => category.summary.productCount > 0)
    .map((category) => ({
      label: category.name,
      href: catalogPath({ view: 'all', category: category.code }, locale),
      meta: categoryLabel,
    }));

  const productItems: SuggestItem[] = products.map((product) => ({
    label: product.title,
    href: productPath(product.slug, {}, locale),
    meta: priceMeta(product, locale),
  }));

  return [...categoryItems, ...productItems];
}
