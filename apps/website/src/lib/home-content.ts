/**
 * Editorial copy for the home page, transcribed from the approved blueprint
 * (docs/blueprint/home.html).
 *
 * TEMPORARY — this belongs in the back office as page sections plus a governed
 * reviews source. See the "Known gaps" section of
 * docs/code/storefront-design-system.md.
 */
import { perUnitLabel } from '@mia/i18n';

import { formatMoney } from './api.ts';
import { buildCategoryTiles, type CategoryTile } from './catalog-page.ts';
import type { Category, ProductSummary } from './catalog.ts';
import { localeTag, translate, type SiteLocale } from './i18n.ts';

/**
 * The products shown in the hero showcase (3) and the "I più noleggiati"
 * carousel (8), in a stable order.
 *
 * Editorially featured rentals come first — that flag is the back office's
 * only way to say "show this on the home page". Remaining slots are filled
 * with other rentals so the rail is never half empty on a fresh catalogue.
 */
export function selectHomeFeatured(products: ProductSummary[], limit = 3): ProductSummary[] {
  const rank = (product: ProductSummary) =>
    (product.pricing.mode === 'rental' ? 0 : 2) + (product.isFeatured ? 0 : 1);

  // Rentals first, editorially featured ones ahead of the rest, then sale items
  // to top up — a rail of one card on a young catalogue reads as broken.
  return [...products].sort((a, b) => rank(a) - rank(b)).slice(0, limit);
}

export interface ProductOffer {
  /** "4,90 €" — already formatted for it-IT. */
  money: string;
  /** "al giorno", or null when the figure is a total rather than a rate. */
  unit: string | null;
}

/**
 * The home page's price line: big rate, small unit ("4,90 € al giorno").
 *
 * On a rental the rate is the back office's MARKETING copy; with none typed it
 * falls back to the cheapest package's total, which is a total, not a rate —
 * so it carries no unit. `null` only when the product has no figure at all.
 */
export function productOffer(
  product: ProductSummary,
  locale: SiteLocale = 'it',
): ProductOffer | null {
  const amount = product.pricing.marketingRate ?? product.pricing.fromPrice;
  if (amount === null) return null;
  const isRate = product.pricing.mode === 'rental' && product.pricing.marketingRate !== null;
  return {
    money: formatMoney(amount, product.pricing.currency, localeTag(locale)),
    unit: isRate ? perUnitLabel(product.pricing.rentalUnit, locale) : null,
  };
}

/**
 * Category tiles for the home grid.
 *
 * The shape and the "da …" line are the catalogue's — one tile model, so the
 * home grid and the catalogue directory can never say different things about
 * the same category. Home adds only its own selection: the busiest categories
 * first, capped at eight, and a product thumbnail standing in for a category
 * that has no icon of its own.
 */
export function buildHomeCategories(
  categories: Category[],
  products: ProductSummary[],
  limit = 8,
  locale: SiteLocale = 'it',
): CategoryTile[] {
  const firstImage = new Map<string, string>();
  for (const product of products) {
    const { slug } = product.category;
    if (product.thumbnail && !firstImage.has(slug)) firstImage.set(slug, product.thumbnail.path);
  }

  return buildCategoryTiles(categories, { locale, imageFallback: firstImage })
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, limit);
}

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * The home page's six questions, and the support page's longer, more
 * operational list.
 *
 * Both are keys rather than literals: the answers are customer-facing prose and
 * the storefront serves them in two languages, so they belong in the message
 * catalog with everything else a customer reads. The KEYS are the running order
 * — change the array to reorder a list, the JSON to reword an answer.
 */
const HOME_FAQ_KEYS = [
  'delivery',
  'minimum',
  'hygiene',
  'prescription',
  'payment',
  'earlyReturn',
] as const;

const SUPPORT_FAQ_KEYS = [
  'payment',
  'deposit',
  'deliveryCost',
  'hygiene',
  'extend',
  'unsuitable',
] as const;

function faqFrom(namespace: string, keys: readonly string[], locale: SiteLocale): FaqItem[] {
  return keys.map((key) => ({
    question: translate(locale, `${namespace}.${key}.q`),
    answer: translate(locale, `${namespace}.${key}.a`),
  }));
}

export function homeFaq(locale: SiteLocale): FaqItem[] {
  return faqFrom('home.faq', HOME_FAQ_KEYS, locale);
}

export function supportFaq(locale: SiteLocale): FaqItem[] {
  return faqFrom('support.faq', SUPPORT_FAQ_KEYS, locale);
}

/**
 * Aggregate rating, shown in the PDP order panel.
 *
 * The reviews are NOT a single platform's: they are collected from the social
 * profiles below and aggregated by hand, so the label must stay source-neutral.
 * Calling them "recensioni Google" would claim a Google-verified figure the
 * business does not have. This still needs a governed source before launch,
 * which is why it is deliberately absent from the pages' JSON-LD: a stale
 * aggregate rating in structured data is a Google policy problem, not just an
 * inaccuracy.
 */
export const REVIEW_AGGREGATE = {
  rating: '4,9',
  /** The count is prose a customer reads — `home.reviews.count` carries it. */
  countKey: 'home.reviews.count',
  sources: ['Google Maps', 'Trustpilot', 'Facebook'],
} as const;

export type TestimonialSource = 'google' | 'trustpilot' | 'facebook';

export interface Testimonial {
  name: string;
  /** Two letters for the avatar disc. */
  initials: string;
  /** Month and year, never a relative date — "Giugno 2026". */
  date: string;
  text: string;
  source: TestimonialSource;
}

/**
 * The home testimonial band. PLACEHOLDER people and figures: swap for the
 * governed reviews source before launch, and keep the count in step with
 * `REVIEW_AGGREGATE` when either becomes real.
 *
 * The names and initials are identity, so they stay here; the quote and the
 * month are prose a customer reads, so they live in the message catalog and
 * come back translated. A real reviews source will carry both per language.
 */
const TESTIMONIAL_PEOPLE = [
  { key: '1', name: 'Giulia R.', initials: 'GR', source: 'google' },
  { key: '2', name: 'Franco M.', initials: 'FM', source: 'google' },
  { key: '3', name: 'Sara T.', initials: 'ST', source: 'trustpilot' },
  { key: '4', name: 'Alessandro B.', initials: 'AB', source: 'google' },
  { key: '5', name: 'Marta C.', initials: 'MC', source: 'facebook' },
  { key: '6', name: 'Paolo V.', initials: 'PV', source: 'trustpilot' },
] as const satisfies readonly {
  key: string;
  name: string;
  initials: string;
  source: TestimonialSource;
}[];

export function homeTestimonials(locale: SiteLocale): Testimonial[] {
  return TESTIMONIAL_PEOPLE.map((person) => ({
    name: person.name,
    initials: person.initials,
    source: person.source,
    date: translate(locale, `home.testimonial.${person.key}.date`),
    text: translate(locale, `home.testimonial.${person.key}.text`),
  }));
}

/** The band's headline rating. Its count label is `home.reviews.verifiedCount`. */
export const TESTIMONIAL_RATING = '4,9';
