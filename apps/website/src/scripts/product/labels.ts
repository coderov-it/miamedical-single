/**
 * The words the product page's scripts need at runtime, read from a JSON island
 * the server rendered.
 *
 * WHY AN ISLAND AND NOT AN IMPORT. `~/lib/labels` pulls `@mia/i18n` and the whole
 * storefront catalog; the estimate needs about a dozen strings. The checkout
 * already ships its words this way (`data-checkout-labels`) and this is the same
 * arrangement, which also keeps the project rule intact: no Italian literal
 * survives anywhere in these modules.
 *
 * It is a hard requirement, not a nicety — the estimate rewrites the panel's line
 * items on every keystroke, and a missing word there is a blank row in the price
 * the customer is reading.
 */

/** Every word the page scripts can ask for. Filled by `ProductPage.astro`. */
export interface PdpLabels {
  /** The variant line's caption when no option carries a name of its own. */
  baseRate: string;
  /** The package field's own text while nothing is chosen. */
  choosePackage: string;
  /** The estimate's qualifier while nothing is chosen. Lower case — it follows a figure. */
  choosePackageNote: string;
  /** The estimate's qualifier on a fixed-price product. */
  productPrice: string;
  /** The estimate's qualifier once a package is chosen. `{name}` is the package. */
  packageNote: string;
  /** An add-on that costs nothing, in the amount column. */
  included: string;
  /** An add-on with no name of its own. */
  extra: string;
  /** The quantity multiplier's row label. */
  quantity: string;
  /** The calendar trigger's text before a date is picked. */
  chooseDate: string;
  hourOne: string;
  hourMany: string;
  dayOne: string;
  dayMany: string;
}

const FALLBACK: PdpLabels = {
  baseRate: '',
  choosePackage: '',
  choosePackageNote: '',
  productPrice: '',
  packageNote: '{name}',
  included: '',
  extra: '',
  quantity: '',
  chooseDate: '',
  hourOne: '',
  hourMany: '',
  dayOne: '',
  dayMany: '',
};

/**
 * Reads the island.
 *
 * A missing or malformed island is a build-time bug, and the empty fallback is
 * what keeps it from also being a broken page: the panel renders blank captions
 * beside real figures rather than the word "undefined" beside them.
 */
export function readLabels(): PdpLabels {
  const island = document.querySelector('[data-pdp-labels]');
  if (!island) return FALLBACK;
  try {
    return { ...FALLBACK, ...(JSON.parse(island.textContent || '{}') as Partial<PdpLabels>) };
  } catch {
    return FALLBACK;
  }
}

/** "3 giorni" / "1 ora" — the unit word that agrees with the number before it. */
export function unitWord(labels: PdpLabels, count: number, unit: string): string {
  if (unit === 'hour') return count === 1 ? labels.hourOne : labels.hourMany;
  return count === 1 ? labels.dayOne : labels.dayMany;
}
