/**
 * What the product page has to work out before it can render: the browse context
 * the customer arrived with, which images to show, and the structured data.
 *
 * It lives beside the page rather than in it because none of it is markup, and
 * the page file is a route declaration first — see the file-size and page-file
 * rules in AGENTS.md.
 */
import type { PdpLabels } from '../scripts/product/labels.ts';
import { mediaUrl, offerPrice } from './api.ts';
import type { ProductDetail } from './catalog.ts';
import { productPath } from './routes.ts';
import { serviceAreaCity } from './site.ts';

export interface BrowseAnswers {
  /**
   * The delivery city chosen in the home search. Null when the customer came
   * straight to the catalogue or selected "Altra zona", so there is nothing
   * specific to print yet.
   *
   * Null far more often than not, which is why null renders nothing at all
   * rather than a placeholder.
   */
  deliveryCity: string | null;
  /** Today in Europe/Rome, ISO. The floor for the start date. */
  today: string;
  /** A start date carried from the home search, or '' if it is no longer orderable. */
  startDate: string;
}

/**
 * What the customer already told the home search, handed on by every link
 * between there and here (`BrowseContext` in lib/routes.ts).
 *
 * The date is kept only if it is still orderable. A link shared in March and
 * opened in June carries a start date in the past, which the field's own `min`
 * would reject — better to show it empty than pre-filled and invalid.
 */
export function readBrowseAnswers(url: URL): BrowseAnswers {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const carried = url.searchParams.get('from')?.trim() ?? '';
  const orderable = /^\d{4}-\d{2}-\d{2}$/.test(carried) && carried >= today;

  return {
    deliveryCity: serviceAreaCity(url.searchParams.get('area')),
    today,
    startDate: orderable ? carried : '',
  };
}

/** Whether anything can actually be ordered. */
export function isInStock(product: ProductDetail): boolean {
  return product.inStock;
}

export interface ProductImages {
  hero: ProductDetail['media']['gallery'][number] | null;
  images: ProductDetail['media']['gallery'];
}

/** The lead image, then the rest of the gallery with the lead not repeated. */
export function resolveImages(product: ProductDetail): ProductImages {
  const hero =
    product.media.cleanPng ?? product.media.thumbnail ?? product.media.gallery[0] ?? null;
  if (!hero) return { hero: null, images: product.media.gallery };
  return {
    hero,
    images: [hero, ...product.media.gallery.filter((item) => item.path !== hero.path)],
  };
}

interface JsonLdContext {
  product: ProductDetail;
  hero: ProductImages['hero'];
  inStock: boolean;
  /** `Astro.url.origin` — absolute URLs for images. */
  origin: string;
  /** `Astro.site ?? Astro.url.origin` — the canonical host. */
  site: string | URL;
}

/**
 * The Product node, plus an FAQPage when the product carries questions.
 *
 * `offers.price` is the LOWEST REAL FIGURE — a fixed product's price, or the
 * cheapest package. Never the marketing rate: that is copy, and Google reads
 * this as an amount someone can actually be charged.
 */
export function buildProductJsonLd(context: JsonLdContext): Record<string, unknown>[] {
  const { product, hero, inStock, origin, site } = context;

  const nodes: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      ...(product.shortDescription ? { description: product.shortDescription } : {}),
      ...(hero ? { image: [new URL(mediaUrl(hero.path), origin).href] } : {}),
      ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
      category: product.category.name,
      offers: {
        '@type': 'Offer',
        ...(product.pricing.fromPrice ? { price: offerPrice(product.pricing.fromPrice) } : {}),
        priceCurrency: product.pricing.currency,
        availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: new URL(productPath(product.slug), site).href,
      },
    },
  ];

  if (product.faqs.length > 0) {
    nodes.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: product.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    });
  }

  return nodes;
}

/**
 * The words the page's scripts need at runtime, shipped as a JSON island.
 *
 * Italian belongs in this file and nowhere near the scripts — see
 * `scripts/product/labels.ts` for the arrangement and the reason for it. The
 * shape here IS `PdpLabels`; the two are checked against each other by the
 * `satisfies` on the export.
 */
export const PDP_SCRIPT_LABELS = {
  baseRate: 'Tariffa base',
  choosePackage: 'Scegli un pacchetto',
  choosePackageNote: 'scegli un pacchetto',
  productPrice: 'prezzo del prodotto',
  packageNote: 'pacchetto {name}',
  included: 'Incluso',
  extra: 'Extra',
  quantity: 'Quantità',
  chooseDate: 'Scegli la data',
  hourOne: 'ora',
  hourMany: 'ore',
  dayOne: 'giorno',
  dayMany: 'giorni',
} as const satisfies PdpLabels;
