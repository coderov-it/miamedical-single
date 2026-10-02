import assert from 'node:assert/strict';
import { test } from 'node:test';

import { lineProductIds, pickSlugMatch, type SlugRow, slugsToResolve } from './line-products.ts';

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';

// it: wheelchair → B, en: wheelchair → A; en: sedia-x → A only.
const ROWS: SlugRow[] = [
  { slug: 'wheelchair', productId: B, languageCode: 'it' },
  { slug: 'wheelchair', productId: A, languageCode: 'en' },
  { slug: 'sedia-x', productId: A, languageCode: 'en' },
];

test('the exact language wins over another language with the same slug', () => {
  const rows = ROWS.filter((row) => row.slug === 'wheelchair');
  assert.equal(pickSlugMatch(rows, 'en'), A);
  assert.equal(pickSlugMatch(rows, 'it'), B);
});

test('another language is accepted only when it names one product', () => {
  assert.equal(pickSlugMatch(ROWS.filter((row) => row.slug === 'sedia-x'), 'it'), A);
  assert.equal(pickSlugMatch(ROWS.filter((row) => row.slug === 'wheelchair'), 'fr'), undefined);
  assert.equal(pickSlugMatch([], 'it'), undefined);
});

test('lines keep their order, an id beats its slug, unknown slugs stay empty', () => {
  const lines = [
    { productSlug: 'sedia-x' },
    { productId: B, productSlug: 'sedia-x' },
    { productSlug: 'gone' },
    { productSlug: 'wheelchair' },
    { productSlug: 'sedia-x' },
  ];
  assert.deepEqual(lineProductIds(lines, ROWS, 'it'), [A, B, undefined, B, A]);
});

test('only slugs of lines without an id are looked up, once each', () => {
  const lines = [
    { productSlug: 'sedia-x' },
    { productId: B, productSlug: 'wheelchair' },
    { productSlug: 'sedia-x' },
    { productSlug: 'gone' },
  ];
  assert.deepEqual(slugsToResolve(lines), ['sedia-x', 'gone']);
});
