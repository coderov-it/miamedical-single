/**
 * One product = one page. This file is that page's running order, and the order
 * is the whole design:
 *
 *   1  title            what it is
 *   2  gallery          what it looks like
 *   3  price packages   what it costs
 *   4  description      how it is sold
 *   5  specifications   what it measures
 *   6  questions        what the customer is asked
 *   7  FAQs             what the customer asks
 *   8  metadata         codes, slugs, terms, files
 *
 * It runs picture-first and machine-values-last because that is the order a
 * reviewer actually works in. Anything that is a fact about the ROW rather than
 * about the product — the code, the status, the slug, the file names — is held
 * back to step 8 in `metadata.ts`, so opening a product does not open onto a
 * wall of identifiers.
 *
 * Both languages are emitted for every piece of copy; the toggle in the corner
 * shows one. See the note in `html.ts` for why they are both in the DOM.
 */
import type { ProductInput, SpecMap } from '../../lib/types.ts';
import type { AssetResolver, ResolvedAsset } from './assets.ts';
import { escape, localized, localizedRich, plain, rows, section } from './html.ts';
import { questionsTable, renderFaqs } from './intake.ts';
import { renderGallery } from './media.ts';
import { renderMetadata } from './metadata.ts';
import { addonsTable, packagesTable, priceHeadline, renderChips } from './pricing.ts';
import { specValues } from './specs.ts';

export interface RenderedProduct {
  html: string;
  missing: ResolvedAsset[];
  entry: ProductEntry;
}

export interface ProductEntry {
  code: string;
  route: string;
  /** Both languages, for the outline panel. */
  title: { it: string; en?: string | undefined };
  status: string;
}

/** Step 4 — the sales copy, short description above the rich description. */
function description(product: ProductInput<SpecMap>): string {
  const it = product.translations.it;
  const en = product.translations.en;

  const short =
    it.shortDescription === undefined
      ? ''
      : `<div class="lede">${localized({ it: it.shortDescription, ...(en?.shortDescription ? { en: en.shortDescription } : {}) }, 'p')}</div>`;

  const long =
    it.description === undefined ? '' : localizedRich(it.description, en?.description ?? undefined);

  return short + long;
}

export function renderProduct(
  product: ProductInput<SpecMap>,
  specs: SpecMap,
  categoryCode: string,
  resolve: AssetResolver,
): RenderedProduct {
  const gallery = renderGallery(product.media, resolve);
  const it = product.translations.it;
  const en = product.translations.en;
  const route = `${categoryCode}/${product.code}`;

  const title = { it: it.title, ...(en?.title ? { en: en.title } : {}) };

  const html = `<article class="page product" data-page="${escape(route)}" data-title="${escape(plain(title))}">
    <header class="page-head">
      <p class="eyebrow"><code>${escape(product.code)}</code><span class="flag status-${escape(product.status ?? 'draft')}">${escape(product.status ?? 'draft')}</span><span class="flag">stock ${(product.stock ?? 0).toString()}</span>${product.isFeatured ? '<span class="flag on">featured</span>' : ''}</p>
      <h1>${localized(title)}</h1>
      ${renderChips(product)}
    </header>

    ${gallery.html}

    ${rows([
      section(
        'price',
        product.pricingMode === 'rental' ? 'Price packages' : 'Price',
        priceHeadline(product) + packagesTable(product) + addonsTable(product, resolve),
      ),
      section('description', 'Description', description(product)),
      section('specs', 'Specifications', specValues(specs, product.specs)),
      section('questions', 'Questions asked at checkout', questionsTable(product)),
      section('faqs', 'FAQs', renderFaqs(product.faqs)),
      section('metadata', 'Metadata', renderMetadata(product, categoryCode, resolve)),
    ])}
  </article>`;

  return {
    html,
    missing: gallery.missing,
    entry: { code: product.code, route, title, status: product.status ?? 'draft' },
  };
}
