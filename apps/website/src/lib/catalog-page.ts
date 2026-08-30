/**
 * What the three catalogue surfaces have to work out before they can render:
 * which browse state the URL is asking for, what the quick pills point at, and
 * what each category tile says under its name.
 *
 * It lives beside the pages rather than in them because none of it is markup,
 * and a page file is a route declaration first — see the file-size and
 * page-file rules in CLAUDE.md.
 */
import { perUnitLabel } from '@mia/i18n';

import { formatMoney } from './api.ts';
import type { Category } from './catalog.ts';
import { localeTag, type SiteLocale } from './i18n.ts';
import { t } from './labels.ts';
import { catalogPath, catalogRoot, type BrowseContext, type CatalogView } from './routes.ts';

export type { CatalogView };

/**
 * The one category promoted into the pill row.
 *
 * Static by decision (owner, 2026-08-30): the row is a fixed piece of
 * navigation, not a leaderboard, and a pill that moved as the catalogue grew
 * would change what the second item means between two visits. Change it here.
 */
export const PINNED_CATEGORY_CODE = 'carrozzine';

/** Which pricing mode a listing asks the API for. `all` asks for neither. */
export const MODE_FOR_VIEW: Record<CatalogView, 'rental' | 'fixed' | undefined> = {
  all: undefined,
  rental: 'rental',
  sale: 'fixed',
};

export type CatalogSort = 'newest' | 'popular' | 'price_asc' | 'price_desc' | 'title';

const SORTS: CatalogSort[] = ['popular', 'newest', 'price_asc', 'price_desc', 'title'];

const SORT_LABEL_KEY: Record<CatalogSort, Parameters<typeof t>[0]> = {
  popular: 'catalog.sort.popular',
  newest: 'catalog.sort.newest',
  price_asc: 'catalog.sort.priceAsc',
  price_desc: 'catalog.sort.priceDesc',
  title: 'catalog.sort.title',
};

export function sortOptions(locale: SiteLocale): { value: CatalogSort; label: string }[] {
  return SORTS.map((value) => ({ value, label: t(SORT_LABEL_KEY[value], undefined, locale) }));
}

export interface CatalogQuery {
  view: CatalogView;
  q: string;
  category: string;
  sort: CatalogSort;
  page: number;
  /** Where and when, carried from the home booking bar. Never a filter. */
  context: BrowseContext;
  /** True once anything narrows the surface — which is what turns the
      all-catalogue from a category directory into a product listing. */
  isNarrowed: boolean;
}

export function readCatalogQuery(url: URL, view: CatalogView): CatalogQuery {
  const params = url.searchParams;
  const q = params.get('q')?.trim() ?? '';
  const category = params.get('category')?.trim() ?? '';
  const requested = params.get('sort') ?? '';
  const sort = SORTS.find((candidate) => candidate === requested) ?? 'popular';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  const context: BrowseContext = {};
  const area = params.get('area')?.trim();
  const from = params.get('from')?.trim();
  if (area) context.area = area;
  if (from) context.from = from;

  return { view, q, category, sort, page, context, isNarrowed: Boolean(q || category) };
}

export interface CatalogPill {
  label: string;
  href: string;
  isActive: boolean;
}

/**
 * The pill row: the whole catalogue, the pinned category, then one pill per
 * pricing mode. Four fixed destinations, identical on all three surfaces, so a
 * customer never has to find their way back to the row they came from.
 *
 * The pinned pill is dropped when that category is not in the catalogue rather
 * than rendered as a link to an empty listing.
 */
export function buildPills(
  query: CatalogQuery,
  categories: Category[],
  locale: SiteLocale,
): CatalogPill[] {
  const { view, category, context } = query;
  const pinned = categories.find((candidate) => candidate.code === PINNED_CATEGORY_CODE);

  const pills: CatalogPill[] = [
    {
      label: t('catalog.pill.all', undefined, locale),
      href: catalogPath({ view: 'all', ...context }, locale),
      isActive: view === 'all' && category === '',
    },
  ];

  if (pinned) {
    pills.push({
      label: pinned.name,
      href: catalogPath({ view: 'all', category: pinned.code, ...context }, locale),
      isActive: category === pinned.code,
    });
  }

  pills.push(
    {
      label: t('catalog.pill.rental', undefined, locale),
      href: catalogPath({ view: 'rental', ...context }, locale),
      isActive: view === 'rental',
    },
    {
      label: t('catalog.pill.sale', undefined, locale),
      href: catalogPath({ view: 'sale', ...context }, locale),
      isActive: view === 'sale',
    },
  );

  return pills;
}

export interface CategoryTile {
  key: string;
  code: string;
  name: string;
  /** Object-storage path, resolved through `mediaUrl` by the component. */
  imagePath: string | null;
  /** "da 0,78 € al giorno", or "6 prodotti" when the category prices nothing. */
  detail: string;
  /** A price reads as an offer and a count as inventory — they take different
      ink, and only the model knows which one `detail` turned out to be. */
  isPriced: boolean;
  /** Active products inside. What the caller sorts and truncates a grid by. */
  productCount: number;
  href: string;
}

/**
 * The line under a tile's name: what the cheapest thing inside costs.
 *
 * The figure is the server's — a rental's promo rate when the back office typed
 * one, otherwise its cheapest package — so a tile and the cheapest card inside
 * that category always agree. A category whose products carry no figure at all
 * falls back to its count, because "da —" tells a customer nothing.
 */
function tileDetail(
  summary: Category['summary'],
  locale: SiteLocale,
): { detail: string; isPriced: boolean } {
  const { fromPrice, currency, pricingMode, rentalUnit, productCount } = summary;

  if (fromPrice === null || currency === null) {
    return {
      detail: t(
        productCount === 1 ? 'catalog.tile.count.one' : 'catalog.tile.count.many',
        { count: productCount },
        locale,
      ),
      isPriced: false,
    };
  }

  const money = formatMoney(fromPrice, currency, localeTag(locale));
  if (pricingMode !== 'rental') {
    return { detail: t('catalog.tile.from', { price: money }, locale), isPriced: true };
  }
  return {
    detail: t(
      'catalog.tile.fromRate',
      { price: money, unit: perUnitLabel(rentalUnit, locale) },
      locale,
    ),
    isPriced: true,
  };
}

/**
 * Category tiles for the directory.
 *
 * A category has an icon but no imagery of its own, so one without an icon
 * borrows a product thumbnail — that fallback is the caller's, since only it
 * knows which products it fetched. Empty categories are dropped rather than
 * rendered as a dead tile: a grid of them reads as a broken shop.
 */
export function buildCategoryTiles(
  categories: Category[],
  options: { locale: SiteLocale; context?: BrowseContext; imageFallback?: Map<string, string> } = {
    locale: 'it',
  },
): CategoryTile[] {
  const { locale, context = {}, imageFallback } = options;

  return categories
    .filter((category) => category.summary.productCount > 0)
    .map((category) => ({
      key: category.id,
      code: category.code,
      name: category.name,
      imagePath: category.icon ?? imageFallback?.get(category.slug) ?? null,
      ...tileDetail(category.summary, locale),
      productCount: category.summary.productCount,
      href: catalogPath({ view: 'all', category: category.code, ...context }, locale),
    }));
}

/**
 * Options for the "all categories" select. No locale argument: the API already
 * resolved every name for the request's language.
 */
export function categoryOptions(categories: Category[]): { value: string; label: string }[] {
  return categories
    .filter((category) => category.summary.productCount > 0)
    .map((category) => ({ value: category.code, label: category.name }));
}

export interface CatalogCopy {
  heading: string;
  lede: string;
  /** The canonical URL for this surface, always bare of browse state. */
  canonical: string;
}

const HEADING_KEY: Record<CatalogView, Parameters<typeof t>[0]> = {
  all: 'catalog.title',
  rental: 'catalog.title.rental',
  sale: 'catalog.title.sale',
};

export function catalogCopy(
  view: CatalogView,
  activeCategoryName: string | null,
  locale: SiteLocale,
): CatalogCopy {
  return {
    heading: activeCategoryName ?? t(HEADING_KEY[view], undefined, locale),
    lede: t('catalog.lede', undefined, locale),
    canonical: catalogRoot(view, locale),
  };
}
