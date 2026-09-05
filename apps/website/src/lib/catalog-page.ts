/**
 * What the three catalogue surfaces have to work out before they can render:
 * which browse state the URL is asking for, what the quick pills point at, and
 * what each category tile says under its name.
 *
 * It lives beside the pages rather than in them because none of it is markup,
 * and a page file is a route declaration first — see the file-size and
 * page-file rules in CLAUDE.md.
 */
import { unitLabel } from '@mia/i18n';

import { formatMoney } from './api.ts';
import type { Category } from './catalog.ts';
import { localeTag, type SiteLocale } from './i18n.ts';
import { t } from './labels.ts';
import {
  findProductGroup,
  findProductType,
  productGroupLabel,
  productTypeLabel,
  productTypeLede,
  type ProductGroup,
  type ProductType,
} from './product-types.ts';
import { catalogPath, catalogRoot, type BrowseContext, type CatalogView } from './routes.ts';

export type { CatalogView };

/** Which pricing mode a listing asks the API for. `all` asks for neither. */
export const MODE_FOR_VIEW: Record<CatalogView, 'rental' | 'fixed' | undefined> = {
  all: undefined,
  rental: 'rental',
  sale: 'fixed',
};

export type CatalogSort = 'newest' | 'popular' | 'price_asc' | 'price_desc' | 'title';

/** How the results are drawn. The reference's own two, and its default. */
export type CatalogLayout = 'grid' | 'list';

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
  /** The selected product type, and the group inside it. See lib/product-types.ts. */
  type: ProductType | null;
  group: ProductGroup | null;
  sort: CatalogSort;
  /** "Solo disponibili" — hide what the shop cannot hand over today. */
  inStock: boolean;
  /** Cards in a grid, or one product per row. */
  layout: CatalogLayout;
  page: number;
  /** Where and when, carried from the home booking bar. Never a filter. */
  context: BrowseContext;
  /** True once anything narrows the surface — which is what turns the
      all-catalogue from a category directory into a product listing. */
  isNarrowed: boolean;
}

/**
 * ONE NARROWING AT A TIME, decided here rather than by whichever component
 * reads the URL last.
 *
 * A typed query beats a type: search is answered by Postgres over the whole
 * catalogue, and there is no honest way to run it inside a set of categories
 * without reimplementing the stemming in the browser. A type beats a lone
 * category: the strip is on screen and the category dropdown is not, so the
 * control the customer can see is the one that wins. And a group is read only
 * when its type is, since it names nothing on its own.
 *
 * A parameter that loses is dropped from the model, not merely ignored, so no
 * caller downstream can revive it and disagree with the page.
 */
export function readCatalogQuery(url: URL, view: CatalogView): CatalogQuery {
  const params = url.searchParams;
  const q = params.get('q')?.trim() ?? '';
  const type = q ? null : findProductType(params.get('type')?.trim() ?? null);
  const group = type ? findProductGroup(type, params.get('group')?.trim() ?? null) : null;
  const category = q || type ? '' : (params.get('category')?.trim() ?? '');
  const requested = params.get('sort') ?? '';
  const sort = SORTS.find((candidate) => candidate === requested) ?? 'popular';
  const inStock = params.get('stock') === '1';
  const layout: CatalogLayout = params.get('layout') === 'list' ? 'list' : 'grid';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  const context: BrowseContext = {};
  const area = params.get('area')?.trim();
  const from = params.get('from')?.trim();
  const carriedFor = params.get('for')?.trim();
  if (area) context.area = area;
  if (from) context.from = from;
  if (carriedFor) context.for = carriedFor;

  return {
    view,
    q,
    category,
    type,
    group,
    sort,
    inStock,
    layout,
    page,
    context,
    isNarrowed: Boolean(q || category || type || inStock),
  };
}

export interface CatalogPill {
  label: string;
  href: string;
  isActive: boolean;
}

/**
 * The segmented control beside the title: how the shop offers the thing, in the
 * reference site's own four terms (miamedicalitalia.it, measured 2026-09-05) —
 * everything, hire, buy, second-hand.
 *
 * "USATO" IS NOT A FOURTH PRICING MODE. Second-hand stock is a set of
 * categories, not a way of paying, so that segment points at the `used` product
 * type on the whole-catalogue surface. The reference draws the same conclusion
 * from the other end: its own `?tipo=usato` and `?bisogno=usato` return the same
 * six products. Which is also why the segment is only lit when nothing else is:
 * "Noleggio" and "Usato" together would be a promise the catalogue cannot keep.
 *
 * The pinned category pill that used to sit in this row is gone: the type strip
 * under it is the way into a category now, and "Carrozzine" was one category out
 * of eighteen claiming a permanent seat beside three mode filters.
 */
export function buildPills(query: CatalogQuery, locale: SiteLocale): CatalogPill[] {
  const { view, type, context } = query;
  /* "Usato" is the only type that also answers this question, so it is the only
     one that can take the light off "Tutti". Every other type leaves the
     segment saying what it said before — a four-way control with nothing lit
     reads as broken, which is exactly how it looked. */
  const used = type?.id === 'used';

  return [
    {
      label: t('catalog.pill.all', undefined, locale),
      href: catalogPath({ view: 'all', ...context }, locale),
      isActive: view === 'all' && !used,
    },
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
    {
      label: t('catalog.pill.used', undefined, locale),
      href: catalogPath({ view: 'all', type: 'used', ...context }, locale),
      isActive: view === 'all' && used,
    },
  ];
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
  if (pricingMode !== 'rental' || rentalUnit === null) {
    return { detail: t('catalog.tile.from', { price: money }, locale), isPriced: true };
  }
  /* "da 1,11 €/giorno" — the compact rate the cards and the reference tiles
     both print, not the sentence form ("al giorno") a body of text would use. */
  return {
    detail: t(
      'catalog.tile.fromRate',
      { price: money, unit: unitLabel(rentalUnit, locale, 'one') },
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

// --- page copy ----------------------------------------------------------------

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

/**
 * What the masthead says.
 *
 * The page is titled by the narrowest thing the customer has chosen — a group,
 * then its type, then a category, then the surface itself — because that is the
 * name they just tapped and expect to see confirmed. The lede follows the TYPE
 * rather than the group, so the strip's promise ("Carrozzine manuali, elettriche
 * e scooter") stays put while the pills below move around inside it.
 */
export function catalogCopy(
  query: CatalogQuery,
  activeCategoryName: string | null,
  locale: SiteLocale,
): CatalogCopy {
  const { view, type, group } = query;

  if (type) {
    return {
      heading: group ? productGroupLabel(group, locale) : productTypeLabel(type, locale),
      lede: productTypeLede(type, locale),
      canonical: catalogRoot(view, locale),
    };
  }

  return {
    heading: activeCategoryName ?? t(HEADING_KEY[view], undefined, locale),
    lede: t('catalog.lede', undefined, locale),
    canonical: catalogRoot(view, locale),
  };
}
