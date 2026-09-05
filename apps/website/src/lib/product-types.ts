/**
 * Product types — the static grouping the catalogue's tile strip is built on.
 *
 * A TYPE IS A STATIC SET OF CATEGORIES AND NOTHING ELSE. It has no row in the
 * database, no endpoint and no id: "Muoversi" is the two words on the tile plus
 * the list of category codes below, and selecting it filters the catalogue by
 * those codes. That is the whole mechanism, and it lives here so the merchant's
 * grouping can be re-cut by editing one table.
 *
 * The table, why the guided selector reads from it, and how the two category
 * taxonomies coexist are written up in docs/code/storefront-catalog-types.md.
 * The tiles and pills themselves are built in `product-type-nav.ts`.
 */
import type { Category, ProductSummary } from './catalog.ts';
import type { SiteLocale } from './i18n.ts';
import { t, type StorefrontLabelKey } from './labels.ts';

export const PRODUCT_TYPE_IDS = [
  'move',
  'walk',
  'bed',
  'transfer',
  'therapy',
  'stairs',
  'daily',
  'used',
] as const;

export type ProductTypeId = (typeof PRODUCT_TYPE_IDS)[number];

/** A named subdivision of a type — one pill in the row under the strip. */
export interface ProductGroup {
  id: string;
  categories: readonly string[];
}

export interface ProductType {
  id: ProductTypeId;
  /** Every category the type gathers — the union of its groups when it has any. */
  categories: readonly string[];
  /**
   * Named subdivisions, or none. NEVER EXACTLY ONE: a lone group is the type
   * under a second name, and a pill row holding one pill is furniture. The four
   * flat types below are the ones the merchant does not subdivide.
   */
  groups: readonly ProductGroup[];
}

/**
 * EVERY GROUP NAMES CODES FROM BOTH TAXONOMIES, exactly as the guided selector's
 * rules do. The database still carries the eighteen Italian-coded categories the
 * site launched with, while `packages/catalog` holds thirty-four English-coded
 * ones that nothing has synced yet. A code that names nothing costs nothing —
 * every lookup here keeps only what the API actually returned — so the table
 * answers correctly today and keeps answering correctly after the sync. Drop the
 * Italian half once that has run.
 */
const grouped = (id: ProductTypeId, groups: ProductGroup[]): ProductType => ({
  id,
  groups,
  categories: groups.flatMap((group) => group.categories),
});

const flat = (id: ProductTypeId, categories: string[]): ProductType => ({
  id,
  categories,
  groups: [],
});

export const PRODUCT_TYPES: readonly ProductType[] = [
  grouped('move', [
    { id: 'wheelchairs', categories: ['carrozzine', 'wheelchairs-hire', 'wheelchairs-sale'] },
    {
      id: 'powered-wheelchairs',
      categories: [
        'carrozzine-elettriche-e-scooter',
        'electric-wheelchairs-and-scooters-hire',
        'electric-wheelchairs-sale',
        'mobility-scooters-sale',
      ],
    },
  ]),

  flat('walk', ['deambulatori-e-rollatori', 'walkers-hire', 'walkers-sale']),

  grouped('bed', [
    {
      id: 'hospital-beds',
      categories: ['letti-ortopedici-ospedalieri', 'hospital-beds-hire', 'hospital-beds-sale'],
    },
    {
      id: 'pressure-relief-mattresses',
      categories: [
        'materassi-antidecubito-ad-alto-rischio',
        'pressure-relief-mattresses-hire',
        'pressure-relief-mattresses-sale',
      ],
    },
    { id: 'recliner-armchairs', categories: ['recliner-armchairs-sale'] },
  ]),

  grouped('transfer', [
    {
      id: 'patient-lifts',
      categories: ['sollevatori', 'patient-lifts-hire', 'patient-lifts-sale'],
    },
    {
      id: 'standing-frames',
      categories: ['verticalizzatori', 'standing-frames-hire', 'standing-frames-sale'],
    },
  ]),

  grouped('therapy', [
    {
      id: 'magnetotherapy',
      categories: ['magnetoterapia', 'magnetotherapy-hire', 'magnetotherapy-sale'],
    },
    {
      id: 'cryomagnetotherapy',
      categories: ['criomagnetoterapia', 'cryomagnetotherapy-hire'],
    },
    { id: 'cryotherapy', categories: ['cryoterapia', 'cryotherapy-hire', 'cryotherapy-sale'] },
    { id: 'kinetec', categories: ['kinetec', 'kinetec-hire'] },
    { id: 'tens', categories: ['tens-elettrostimolatore', 'tens-hire', 'tens-sale'] },
    { id: 'ultrasound', categories: ['ultrasuono', 'ultrasound-hire', 'ultrasound-sale'] },
    {
      id: 'pressotherapy',
      categories: ['pressoterapia', 'pressotherapy-hire', 'pressotherapy-sale'],
    },
    { id: 'electromedical', categories: ['elettromedicali', 'electromedical-sale'] },
  ]),

  flat('stairs', ['montascale', 'stairlifts-hire', 'stairlifts-sale']),

  /**
   * `ausili-per-la-mobilita` LANDS HERE, NOT UNDER `move`, whatever its name
   * says. The four products the shop filed in it are a WC riser, a padded
   * commode chair, a pressure-relief cushion and a recliner — daily living, and
   * the new taxonomy splits them into `accessories-sale` and
   * `recliner-armchairs-sale` accordingly. Reading the name instead of the
   * contents is what put a toilet riser under "Muoversi" in the guided selector.
   */
  flat('daily', ['ausili-per-la-mobilita', 'accessories-sale']),

  flat('used', ['occasione-usato', 'used-deals-hire', 'used-deals-sale']),
];

export function findProductType(id: string | null): ProductType | null {
  return PRODUCT_TYPES.find((type) => type.id === id) ?? null;
}

export function findProductGroup(type: ProductType, id: string | null): ProductGroup | null {
  return type.groups.find((group) => group.id === id) ?? null;
}

/** The codes a selection filters by: the group's when one is picked, else the type's. */
export function categoryCodesFor(type: ProductType, group: ProductGroup | null): readonly string[] {
  return group?.categories ?? type.categories;
}

// --- resolving against the live catalogue ------------------------------------

/**
 * Codes to the category SLUGS a product summary carries.
 *
 * A summary names its category by slug and the slug is localized, so codes are
 * translated through the categories the API returned for this same request
 * rather than assumed to be spelled the same. Codes that name nothing drop out,
 * which is what makes the two-taxonomy table above safe.
 */
export function categorySlugs(categories: Category[], codes: readonly string[]): Set<string> {
  const wanted = new Set(codes);
  return new Set(
    categories.filter((category) => wanted.has(category.code)).map((category) => category.slug),
  );
}

/**
 * The picture on a type's tile: the icon of the first of its categories that has
 * one, falling back to a product photo from inside the type.
 *
 * Codes are tried in the order the table lists them, so a type is pictured by
 * the thing it mostly means — mobility by a wheelchair, not by a scooter.
 */
export function productTypeImage(
  type: ProductType,
  categories: Category[],
  products: ProductSummary[],
): string | null {
  const byCode = new Map(categories.map((category) => [category.code, category]));
  for (const code of type.categories) {
    const icon = byCode.get(code)?.icon;
    if (icon) return icon;
  }

  const slugs = categorySlugs(categories, type.categories);
  const found = products.find(
    (product) => slugs.has(product.category.slug) && product.thumbnail !== null,
  );
  return found?.thumbnail?.path ?? null;
}

/**
 * Every product in a set of categories, in the order the catalogue read already
 * put them in.
 *
 * FILTERING PRESERVES ORDER, which is the whole reason a filtered listing can
 * still sort: the summaries on the wire carry no `orderCount` and no
 * `createdAt`, so "i più richiesti" and "più recenti" are not computable here.
 * The caller asks the API for the catalogue already sorted and this only ever
 * removes rows, so the API stays the sort authority and every option in the
 * dropdown keeps working.
 */
export function selectProducts(products: ProductSummary[], slugs: Set<string>): ProductSummary[] {
  return products.filter((product) => slugs.has(product.category.slug));
}

/** The half of the catalogue a surface sells. `undefined` is both halves. */
export function onPricingSurface(
  products: ProductSummary[],
  mode: ProductSummary['pricing']['mode'] | undefined,
): ProductSummary[] {
  if (mode === undefined) return products;
  return products.filter((product) => product.pricing.mode === mode);
}

// --- copy ---------------------------------------------------------------------

/**
 * A type's and a group's names live in the message catalogue keyed by id, not in
 * this table, because they are copy and this table is structure. The casts are
 * the seam between the two: `StorefrontLabelKey` is generated from it.json, so a
 * type added below without its three keys fails the next build rather than
 * rendering a raw id.
 */
export function productTypeLabel(type: ProductType, locale: SiteLocale): string {
  return t(`catalog.type.${type.id}` as StorefrontLabelKey, undefined, locale);
}

export function productTypeLede(type: ProductType, locale: SiteLocale): string {
  return t(`catalog.type.${type.id}.lede` as StorefrontLabelKey, undefined, locale);
}

export function productGroupLabel(group: ProductGroup, locale: SiteLocale): string {
  return t(`catalog.group.${group.id}` as StorefrontLabelKey, undefined, locale);
}
