/**
 * The two controls the catalogue builds out of `product-types.ts`: the strip of
 * type tiles, and the row of group pills that opens under a selected one.
 *
 * Separate from the taxonomy itself because these are view models — they know
 * about the current surface, the browse context and the message catalogue, none
 * of which the table needs to describe what a type IS.
 */
import type { Category, ProductSummary } from './catalog.ts';
import type { SiteLocale } from './i18n.ts';
import { t } from './labels.ts';
import {
  categorySlugs,
  PRODUCT_TYPES,
  productGroupLabel,
  productTypeImage,
  productTypeLabel,
  selectProducts,
  type ProductGroup,
  type ProductType,
} from './product-types.ts';
import { catalogPath, type BrowseContext, type CatalogView } from './routes.ts';

// --- what the catalogue renders ------------------------------------------------

/**
 * The browse state these builders need. `CatalogQuery` satisfies it structurally,
 * so the page passes its own query straight in — spelled out here rather than
 * imported to keep the taxonomy from depending on the page that shows it.
 */
export interface TypeSelection {
  view: CatalogView;
  type: ProductType | null;
  group: ProductGroup | null;
  context: BrowseContext;
}

export interface ProductTypeTile {
  /** The type's id, or `''` for the leading "everything" tile. */
  id: string;
  label: string;
  imagePath: string | null;
  href: string;
  isActive: boolean;
}

/**
 * The strip: "Tutti", then one tile per type the catalogue can actually answer.
 *
 * A TYPE WITH NOTHING BEHIND IT IS DROPPED, on the same rule the category
 * directory drops an empty category — a tile leading to "nessun prodotto" reads
 * as a broken shop.
 *
 * `surfaceProducts` IS ALREADY NARROWED TO THIS SURFACE, and that is what makes
 * the rule true rather than nearly true: judging emptiness on
 * `summary.productCount` counts both pricing modes, which offered "Igiene e vita
 * quotidiana" on the rental catalogue when every product in it is for sale. It
 * also settles the two-taxonomy table for free — a code naming nothing has no
 * products under it either way.
 *
 * A tile keeps the surface it was tapped on: from the rental catalogue,
 * "Muoversi" means the rental half of Muoversi. It drops the page number and any
 * group, because both belong to the selection it replaces.
 */
export function buildTypeTiles(
  selection: TypeSelection,
  categories: Category[],
  locale: SiteLocale,
  surfaceProducts: ProductSummary[],
): ProductTypeTile[] {
  const { view, type, context } = selection;

  const tiles: ProductTypeTile[] = [
    {
      id: '',
      label: t('catalog.type.all', undefined, locale),
      imagePath: null,
      href: catalogPath({ view, ...context }, locale),
      isActive: type === null,
    },
  ];

  for (const candidate of PRODUCT_TYPES) {
    const slugs = categorySlugs(categories, candidate.categories);
    if (!surfaceProducts.some((product) => slugs.has(product.category.slug))) continue;
    tiles.push({
      id: candidate.id,
      label: productTypeLabel(candidate, locale),
      imagePath: productTypeImage(candidate, categories, surfaceProducts),
      href: catalogPath({ view, type: candidate.id, ...context }, locale),
      isActive: type?.id === candidate.id,
    });
  }

  return tiles;
}

export interface ProductGroupPill {
  label: string;
  href: string;
  isActive: boolean;
  count: number;
}

/**
 * The row under the strip: every group inside the selected type, each with how
 * many products it holds HERE — on this pricing surface, right now.
 *
 * The counts are taken from the products the page has already selected rather
 * than from the category summaries, which is the only way they can be true on
 * the rental and sale catalogues: `summary.productCount` counts both modes, so
 * it would offer "Sollevatori 5" beside a sale listing holding two of them. Same
 * reason an empty group is dropped instead of linked.
 *
 * Returns `[]` for a type the merchant does not subdivide, and for one whose
 * subdivisions have collapsed to a single stocked group — a row of one pill
 * restating the tile above it is furniture, not navigation.
 */
export function buildGroupPills(
  selection: TypeSelection,
  typeProducts: ProductSummary[],
  categories: Category[],
  locale: SiteLocale,
): ProductGroupPill[] {
  const { view, type, group, context } = selection;
  if (!type || type.groups.length === 0) return [];

  const pills: ProductGroupPill[] = [];
  for (const candidate of type.groups) {
    const count = selectProducts(
      typeProducts,
      categorySlugs(categories, candidate.categories),
    ).length;
    if (count === 0) continue;
    pills.push({
      label: productGroupLabel(candidate, locale),
      href: catalogPath({ view, type: type.id, group: candidate.id, ...context }, locale),
      isActive: group?.id === candidate.id,
      count,
    });
  }

  if (pills.length < 2) return [];

  return [
    {
      label: t('catalog.group.all', undefined, locale),
      href: catalogPath({ view, type: type.id, ...context }, locale),
      isActive: group === null,
      count: typeProducts.length,
    },
    ...pills,
  ];
}
