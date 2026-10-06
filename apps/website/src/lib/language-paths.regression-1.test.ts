// Regression: PUB-016 — the language switcher hid every language an untranslated product's page exists in
// Regression: PUB-019 — the language switcher dropped the catalogue's filters and the search query
// Found by /qa on 2026-10-04
// Report: ~/.gstack/projects/coderov-it-miamedical-single/qa-reports/run-20261004T080925Z/

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { productSlugs, withQuery } from './language-paths.ts';

const LOCALES = ['it', 'en', 'fr', 'de'] as const;

describe('productSlugs', () => {
  it('offers every locale for an untranslated product, at the source slug', () => {
    const slugs = productSlugs({
      locales: LOCALES,
      current: 'it',
      source: 'it',
      currentSlug: 'rollator',
      available: ['it'],
      translated: {},
    });
    assert.deepEqual(slugs, { it: 'rollator', en: 'rollator', fr: 'rollator', de: 'rollator' });
  });

  it('offers every locale from an untranslated locale page, not only it and itself', () => {
    const slugs = productSlugs({
      locales: LOCALES,
      current: 'fr',
      source: 'it',
      currentSlug: 'rollator',
      available: ['it'],
      translated: { it: 'rollator' },
    });
    assert.deepEqual(Object.keys(slugs).sort(), ['de', 'en', 'fr', 'it']);
    assert.equal(slugs.de, 'rollator');
  });

  it('keeps translated slugs, and serves the rest at the source slug', () => {
    const slugs = productSlugs({
      locales: LOCALES,
      current: 'fr',
      source: 'it',
      currentSlug: 'rollator-fr',
      available: ['it', 'fr'],
      translated: { it: 'rollator' },
    });
    assert.deepEqual(slugs, { it: 'rollator', en: 'rollator', fr: 'rollator-fr', de: 'rollator' });
  });

  it('leaves out what it cannot know when the source alternate failed to load', () => {
    const slugs = productSlugs({
      locales: LOCALES,
      current: 'fr',
      source: 'it',
      currentSlug: 'rollator-fr',
      available: ['it', 'fr'],
      translated: {},
    });
    assert.deepEqual(slugs, { fr: 'rollator-fr' });
  });
});

describe('withQuery', () => {
  it('carries the filters to every language', () => {
    const paths = withQuery(
      { it: '/catalogo/', en: '/en/catalog/' },
      '?category=sollevatori&sort=price_asc',
    );
    assert.deepEqual(paths, {
      it: '/catalogo/?category=sollevatori&sort=price_asc',
      en: '/en/catalog/?category=sollevatori&sort=price_asc',
    });
  });

  it('carries a search query, re-encoded', () => {
    assert.deepEqual(withQuery({ en: '/en/search/' }, '?q=letto elettrico'), {
      en: '/en/search/?q=letto+elettrico',
    });
  });

  it('leaves the paths alone with no query', () => {
    const paths = { it: '/catalogo/' };
    assert.equal(withQuery(paths, ''), paths);
    assert.equal(withQuery(paths, '?'), paths);
  });
});
