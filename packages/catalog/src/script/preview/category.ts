/**
 * The category's own page, plus the product pages written against it.
 *
 * A category gets a page of its own because it holds things no product does —
 * the icon, the SEO copy, and the spec DECLARATIONS every product's values are
 * read through. Reaching it from the menu means those declarations stay one
 * click away from any product without sitting on top of all fifteen of them.
 */
import type { Category, CategoryTranslationInput, LanguageCode } from '../../lib/types.ts';
import type { ResolvedAsset } from './assets.ts';
import { assetResolver } from './assets.ts';
import { escape, field, localized, plain, rows, section } from './html.ts';
import { renderProduct, type ProductEntry } from './product.ts';
import { specTable } from './specs.ts';

export interface RenderedCategory {
  /** The category page, then one page per product. */
  html: string;
  missing: ResolvedAsset[];
  entry: CategoryEntry;
}

export interface CategoryEntry {
  code: string;
  route: string;
  name: { it: string; en?: string | undefined };
  products: ProductEntry[];
}

const pick = <K extends keyof CategoryTranslationInput>(
  translations: Category['input']['translations'],
  key: K,
): { it: string; en?: string | undefined } | null => {
  const it = translations.it[key];
  if (it === undefined) return null;
  const en = translations.en?.[key];
  return { it, ...(en === undefined ? {} : { en }) };
};

function icon(resolved: ResolvedAsset | null): string {
  if (!resolved) return '<div class="cat-icon empty">no icon</div>';
  if (!resolved.exists)
    return `<div class="cat-icon absent"><strong>file missing</strong><code>${escape(resolved.ref)}</code></div>`;
  return `<img class="cat-icon" src="${resolved.href}" alt="${escape(resolved.ref)}" loading="lazy">`;
}

export function renderCategory(category: Category, assetsRoot: string): RenderedCategory {
  const input = category.input;
  const resolve = assetResolver(assetsRoot, input.code);
  const missing: ResolvedAsset[] = [];

  const resolvedIcon = input.icon ? resolve(input.icon) : null;
  if (resolvedIcon && !resolvedIcon.exists) missing.push(resolvedIcon);

  const products = category.products.map((product) => {
    const rendered = renderProduct(product, input.specs, input.code, resolve);
    missing.push(...rendered.missing);
    return rendered;
  });

  const name = pick(input.translations, 'name') ?? { it: input.code };
  const description = pick(input.translations, 'description');
  const metaTitle = pick(input.translations, 'metaTitle');
  const metaDescription = pick(input.translations, 'metaDescription');

  const slugs = (Object.entries(input.translations) as [LanguageCode, CategoryTranslationInput][])
    .map(
      ([language, text]) =>
        `<span class="option"><code>${escape(language)}</code> <code>/${escape(text.slug ?? '')}</code></span>`,
    )
    .join('');

  const page = `<article class="page category" data-page="${escape(input.code)}" data-title="${escape(plain(name))}">
    <header class="page-head">
      <p class="eyebrow"><code>${escape(input.code)}</code><span class="flag">position ${(input.position ?? 0).toString()}</span>${
        input.isActive === false
          ? '<span class="flag off">inactive</span>'
          : '<span class="flag on">active</span>'
      }${input.requiresDeposit ? '<span class="flag">deposit</span>' : ''}<span class="flag">${category.products.length.toString()} products</span></p>
      ${icon(resolvedIcon)}
      <h1>${localized(name)}</h1>
    </header>

    ${rows([
      section(
        'category-copy',
        'Category copy',
        `<div class="fields">
          ${field('slug', slugs)}
          ${field('description', description ? localized(description, 'p') : undefined)}
          ${field('meta title', metaTitle ? localized(metaTitle) : undefined)}
          ${field('meta description', metaDescription ? localized(metaDescription, 'p') : undefined)}
        </div>`,
      ),
      section(
        'category-specs',
        'Specs declared',
        specTable(input.specs, resolve),
        'Every product below states its values against these.',
      ),
    ])}
  </article>`;

  return {
    html: page + products.map((product) => product.html).join(''),
    missing,
    entry: {
      code: input.code,
      route: input.code,
      name,
      products: products.map((product) => product.entry),
    },
  };
}
