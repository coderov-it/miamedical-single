/**
 * Where the header's language switcher sends a customer, kept apart from where
 * `hreflang` tells a search engine a translation exists.
 *
 * Pure on purpose — no `./i18n.ts` import (it reaches four JSON files through
 * the `~/` alias, which `node --test` cannot resolve), so the locale list and
 * slugs come in as arguments.
 *
 * TWO QUESTIONS, TWO ANSWERS. "Is there a translation?" is `availableLocales`
 * and drives `hreflang` and the sitemap. "Can this page be read in that
 * language?" is wider: an untranslated product still has a page in every
 * locale — the API falls back to the source copy, and the chrome, the order
 * panel and the checkout around it are translated (the product text carries
 * `lang`, see `contentLang` in product-page.ts). Hiding those locales left an
 * Italian visitor on most of the catalogue unable to switch language at all.
 *
 *   product, current it, available [it]       untranslated, current en
 *   1. it → current slug "rollator"           1. en → current slug "rollator"
 *   2. en, fr, de → source slug "rollator"    2. it → fetched slug "rollator"
 *                                             3. fr, de → source slug "rollator"
 *
 *   translated, current fr ("rollator-fr"), available [it, fr]
 *   1. fr → "rollator-fr"   2. it → fetched "rollator"   3. en, de → "rollator"
 */

export interface ProductSlugInput<L extends string> {
  locales: readonly L[];
  current: L;
  source: L;
  /** The slug the page is being served at. */
  currentSlug: string;
  /** The locales with a real translation. */
  available: readonly string[];
  /** Slugs read for the OTHER translated locales; a failed read is absent. */
  translated: Partial<Record<L, string>>;
}

/**
 * The slug of this product in every locale it can be read in.
 *
 * An untranslated locale is served at the source-language slug. That slug is
 * the current one when the page itself is the source or a fallback; otherwise
 * it is the source alternate's, and when that read failed the untranslated
 * locales are left out rather than guessed.
 */
export function productSlugs<L extends string>(
  input: ProductSlugInput<L>,
): Partial<Record<L, string>> {
  const { locales, current, source, currentSlug, available, translated } = input;
  const servedAsSource = current === source || !available.includes(current);
  const sourceSlug = servedAsSource ? currentSlug : translated[source];

  const slugs: Partial<Record<L, string>> = {};
  for (const locale of locales) {
    const slug = slugFor(locale);
    if (slug) slugs[locale] = slug;
  }
  return slugs;

  function slugFor(locale: L): string | undefined {
    if (locale === current) return currentSlug;
    if (available.includes(locale)) return translated[locale];
    return sourceSlug;
  }
}

/**
 * The switcher's links, each carrying the page's query string.
 *
 * Every path here is the SAME page in another language, so its filters, search
 * and sort mean the same thing there: `/catalogo/?category=sollevatori` goes to
 * `/en/catalog/?category=sollevatori`, not to the unfiltered catalogue.
 *
 *   paths { it: /catalogo/, en: /en/catalog/ }, search "?q=letto&sort=price_asc"
 *   → { it: /catalogo/?q=letto&sort=price_asc, en: /en/catalog/?q=letto&sort=price_asc }
 *
 *   search "" or "?" → paths unchanged
 */
export function withQuery<L extends string>(
  paths: Partial<Record<L, string>>,
  search: string,
): Partial<Record<L, string>> {
  const query = new URLSearchParams(search).toString();
  if (!query) return paths;

  const carried: Partial<Record<L, string>> = {};
  for (const [locale, path] of Object.entries(paths) as [L, string | undefined][]) {
    if (path) carried[locale] = `${path}?${query}`;
  }
  return carried;
}
