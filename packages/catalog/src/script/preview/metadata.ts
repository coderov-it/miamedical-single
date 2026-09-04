/**
 * The last panel: everything that is a fact about the row rather than something
 * a customer reads — identity, pricing mode, SEO, linked terms, and the media
 * file inventory.
 *
 * It goes at the bottom because that is the order a reviewer works in: look at
 * the photos, read the copy, check the numbers, and only then confirm the codes
 * and slugs. Putting it first would make every product open on a wall of
 * machine values.
 *
 * The media table here is the flat inventory — one row per file with its role,
 * size and alt text. The gallery at the top shows the pictures; this shows what
 * the importer will actually upload, which is not the same question.
 */
import type { LanguageCode, ProductInput, SpecMap, TermsDocument } from '../../lib/types.ts';
import type { AssetResolver } from './assets.ts';
import { fileSize } from './assets.ts';
import { escape } from './html.ts';
import { slotsOf } from './media.ts';

const row = (label: string, value: string): string =>
  `<tr><th scope="row">${escape(label)}</th><td>${value}</td></tr>`;

const yesNo = (value: boolean | undefined): string =>
  value ? '<span class="flag on">yes</span>' : '<span class="muted">no</span>';

function identity(product: ProductInput<SpecMap>, categoryCode: string): string {
  const pricing =
    product.pricingMode === 'rental'
      ? [
          row('rental unit', `<code>${escape(product.rentalUnit)}</code>`),
          row('packages', product.packages.length.toString()),
          row(
            'marketing rate',
            product.marketingRate === undefined
              ? '<span class="muted">not set</span>'
              : `<code>${product.marketingRate.toString()}</code>`,
          ),
        ]
      : [row('base price', `<code>${product.basePrice.toString()}</code>`)];

  return `<table class="meta">
    <caption>Identity</caption>
    <tbody>
      ${row('code', `<code>${escape(product.code)}</code>`)}
      ${row('category', `<code>${escape(categoryCode)}</code>`)}
      ${row('status', `<span class="flag status-${escape(product.status ?? 'draft')}">${escape(product.status ?? 'draft')}</span>`)}
      ${row('stock', (product.stock ?? 0).toString())}
      ${row('featured', yesNo(product.isFeatured))}
      ${row('brand', product.brand ? escape(product.brand) : '<span class="muted">not set</span>')}
      ${row('pricing mode', `<code>${escape(product.pricingMode)}</code>`)}
      ${pricing.join('')}
    </tbody>
  </table>`;
}

function seo(product: ProductInput<SpecMap>): string {
  const languages = Object.entries(product.translations) as [
    LanguageCode,
    (typeof product.translations)['it'],
  ][];

  const body = languages
    .map(([language, text]) => {
      const missing = '<span class="muted">not set</span>';
      return `<tr>
        <th scope="row"><code>${escape(language)}</code></th>
        <td>${escape(text.title)}</td>
        <td>${text.slug ? `<code>/${escape(text.slug)}</code>` : '<span class="muted">derived from the title</span>'}</td>
        <td>${text.metaTitle ? escape(text.metaTitle) : missing}</td>
        <td>${text.metaDescription ? escape(text.metaDescription) : missing}</td>
      </tr>`;
    })
    .join('');

  return `<table class="meta wide">
    <caption>Titles, slugs and SEO</caption>
    <thead><tr><th>Lang</th><th>Title</th><th>Slug</th><th>Meta title</th><th>Meta description</th></tr></thead>
    <tbody>${body}</tbody>
  </table>`;
}

function terms(documents: readonly TermsDocument[] | undefined): string {
  const list = documents ?? [];
  if (list.length === 0) return '';
  const body = list
    .map(
      (document) => `<tr>
        <td><code>${escape(document.code)}</code></td>
        <td>${escape(document.translations.it.title)}</td>
        <td><span class="flag">${escape(document.status ?? 'draft')}</span></td>
        <td><code>/${escape(document.translations.it.slug)}</code></td>
      </tr>`,
    )
    .join('');

  return `<table class="meta wide">
    <caption>Terms linked</caption>
    <thead><tr><th>Code</th><th>Title</th><th>Status</th><th>Slug</th></tr></thead>
    <tbody>${body}</tbody>
  </table>`;
}

function files(product: ProductInput<SpecMap>, resolve: AssetResolver): string {
  const slots = slotsOf(product.media);
  if (slots.length === 0) return '';

  const body = slots
    .map((slot) => {
      const asset = resolve(slot.ref.file);
      const alt = slot.ref.alt;
      return `<tr${asset.exists ? '' : ' class="broken"'}>
        <td><code>${escape(slot.role)}</code></td>
        <td>${escape(slot.ref.file)}</td>
        <td class="num">${asset.exists ? fileSize(asset.bytes) : '<span class="bad">missing</span>'}</td>
        <td>${
          alt?.it
            ? escape(alt.it)
            : asset.kind === 'image'
              ? '<span class="warn">no alt</span>'
              : '<span class="muted">—</span>'
        }</td>
      </tr>`;
    })
    .join('');

  return `<table class="meta wide">
    <caption>Media files</caption>
    <thead><tr><th>Role</th><th>File</th><th>Size</th><th>Alt (it)</th></tr></thead>
    <tbody>${body}</tbody>
  </table>`;
}

export function renderMetadata(
  product: ProductInput<SpecMap>,
  categoryCode: string,
  resolve: AssetResolver,
): string {
  return `<div class="meta-grid">
    ${identity(product, categoryCode)}
    ${seo(product)}
    ${terms(product.terms)}
    ${files(product, resolve)}
  </div>`;
}
