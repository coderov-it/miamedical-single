/**
 * The list read model loads a fraction of what the full rows hold — two
 * languages instead of all, comparable specs only, one character of the long
 * description (docs/code/catalog-list-read-model.md). These pin that the cards
 * built from the narrow rows are the cards the full rows would build.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { LanguageCode } from '@mia/db/schema';

import { toAdminSummary, toPublicSummary } from './mapper.ts';
import type {
  AdminSummaryRowData,
  PublicSummaryRowData,
  SpecDefinition,
  TranslationStatusRow,
} from './types.ts';

const LONG = '<p>Telaio in alluminio, pieghevole, con freni a tamburo e pedane estraibili.</p>';

const translation = (languageCode: LanguageCode, title: string, slug: string) => ({
  languageCode,
  title,
  slug,
  shortDescription: languageCode === 'en' ? null : `${title}, breve`,
  description: languageCode === 'de' ? '' : LONG,
  metaTitle: null,
  metaDescription: null,
});

const fullTranslations: TranslationStatusRow[] = [
  translation('it', 'Carrozzina pieghevole', 'carrozzina-pieghevole'),
  translation('en', 'Folding wheelchair', 'folding-wheelchair'),
  translation('de', 'Faltrollstuhl', 'faltrollstuhl'),
];

const spec = (
  id: string,
  valueType: SpecDefinition['valueType'],
  position: number,
  extra: Partial<SpecDefinition> = {},
): SpecDefinition => ({
  id,
  key: id,
  label: { it: `Etichetta ${id}`, en: `Label ${id}` },
  valueType,
  unit: null,
  isFilterable: true,
  isComparable: true,
  icon: null,
  position,
  options: [],
  ...extra,
});

const option = (id: string, it: string) => ({ id, value: id, label: { it, en: `${it} (en)` } });

const fullSpecs: SpecDefinition[] = [
  spec('note', 'string', 0, { isComparable: false }),
  spec('material', 'single_select', 1, {
    options: [option('steel', 'Acciaio'), option('aluminium', 'Alluminio')],
  }),
  spec('weight', 'number', 2, { unit: 'kg' }),
  spec('folding', 'boolean', 3),
  spec('colours', 'multi_select', 4, {
    options: [option('red', 'Rosso'), option('blue', 'Blu')],
  }),
];

const value = (specId: string, data: Partial<PublicSummaryRowData['specValues'][number]>) => ({
  specId,
  numberValue: null,
  numberMin: null,
  numberMax: null,
  booleanValue: null,
  textValue: null,
  ...data,
});

const fullValues = [
  value('note', { textValue: { it: 'Solo interni' } }),
  value('weight', { numberValue: '11.5000' }),
  value('folding', { booleanValue: true }),
];

const fullLinks = [
  { specId: 'material', optionId: 'aluminium' },
  { specId: 'colours', optionId: 'red' },
  { specId: 'colours', optionId: 'blue' },
];

const category = (languages: LanguageCode[]) => ({
  id: 'cat-1',
  code: 'carrozzine',
  translations: [
    { languageCode: 'it' as const, name: 'Carrozzine', slug: 'carrozzine' },
    { languageCode: 'en' as const, name: 'Wheelchairs', slug: 'wheelchairs' },
    { languageCode: 'de' as const, name: 'Rollstühle', slug: 'rollstuhle' },
  ].filter((t) => languages.includes(t.languageCode)),
});

const product = {
  id: 'prod-1',
  categoryId: 'cat-1',
  status: 'active' as const,
  brand: 'MiaMedical',
  isFeatured: false,
  pricingMode: 'fixed' as const,
  rentalUnit: null,
  currency: 'EUR',
  basePrice: '289.00',
  marketingRate: null,
  rentalPackages: [],
  stock: 4,
  chips: [],
  media: { thumbnail: null, cleanPng: null, gallery: [], videos: [], documents: [] },
  updatedAt: new Date('2026-09-30T10:00:00Z'),
};

const ALL: LanguageCode[] = ['it', 'en', 'fr', 'de'];

/** What `findPublicSummaries` loads for `locale`, next to the everything it replaced. */
function publicRows(locale: LanguageCode): {
  full: PublicSummaryRowData;
  narrow: PublicSummaryRowData;
} {
  const availableLocales = fullTranslations.map((t) => t.languageCode);
  const full = {
    ...product,
    availableLocales,
    translations: fullTranslations,
    category: category(ALL),
    specs: fullSpecs,
    specValues: fullValues,
    specValueOptions: fullLinks,
  };
  const languages: LanguageCode[] = [locale, 'it'];
  const comparable = new Set(fullSpecs.filter((s) => s.isComparable).map((s) => s.id));
  const narrow = {
    ...product,
    availableLocales,
    translations: fullTranslations
      .filter((t) => languages.includes(t.languageCode))
      .map(({ languageCode, title, slug, shortDescription }) => ({
        languageCode,
        title,
        slug,
        shortDescription,
      })),
    category: category(languages),
    specs: fullSpecs.filter((s) => comparable.has(s.id)),
    specValues: fullValues.filter((v) => comparable.has(v.specId)),
    specValueOptions: fullLinks.filter((l) => comparable.has(l.specId)),
  };
  return { full, narrow };
}

describe('toPublicSummary on the narrow read model', () => {
  for (const locale of ALL) {
    it(`builds the same card as the full rows (${locale})`, () => {
      const { full, narrow } = publicRows(locale);
      assert.deepEqual(toPublicSummary(narrow, locale), toPublicSummary(full, locale));
    });
  }

  it('prints the card the full rows printed', () => {
    const card = toPublicSummary(publicRows('en').narrow, 'en');
    assert.equal(card.title, 'Folding wheelchair');
    assert.equal(card.shortDescription, null);
    assert.deepEqual(card.availableLocales, ['it', 'en', 'de']);
    assert.deepEqual(card.category, { slug: 'wheelchairs', name: 'Wheelchairs' });
    assert.equal(card.pricing.fromPrice, '289.00');
    // Comparable specs by position, three at most; the boolean reads as its label.
    assert.deepEqual(card.chips, ['Alluminio (en)', '11.5 kg', 'Label folding']);
  });

  it('falls back to Italian text for a language with no row', () => {
    const card = toPublicSummary(publicRows('fr').narrow, 'fr');
    assert.equal(card.slug, 'carrozzina-pieghevole');
    assert.equal(card.category.name, 'Carrozzine');
  });
});

describe('toAdminSummary on the narrow read model', () => {
  it('reports the same translation status from one character of description', () => {
    const narrowTranslations = fullTranslations.map((t) => ({
      ...t,
      description: t.description === null ? null : t.description.slice(0, 1),
    }));
    const row = (translations: TranslationStatusRow[], languages: LanguageCode[]) =>
      ({ ...product, translations, category: category(languages) }) satisfies AdminSummaryRowData;

    const narrow = toAdminSummary(row(narrowTranslations, ['en', 'it']), 'en');
    assert.deepEqual(narrow, toAdminSummary(row(fullTranslations, ALL), 'en'));
    assert.deepEqual(narrow.translationStatus.missing, {
      en: ['shortDescription'],
      fr: ['title', 'shortDescription', 'description', 'slug'],
      de: ['description'],
    });
  });
});
