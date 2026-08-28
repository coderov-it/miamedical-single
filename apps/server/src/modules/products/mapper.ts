import type {
  LanguageCode,
  Localized,
  MediaItem,
  ProductChip,
  ProductMedia,
  RentalPackage,
} from '@mia/db/schema';
import { durationLabel } from '@mia/i18n';
import { asMoney, toHundredths } from '@mia/pricing';

import type {
  AdminProductDetailDto,
  AdminProductSummaryDto,
  AdminProductTranslationDto,
  AdminSpecValueDto,
  FacetDto,
  MoneyDto,
  PageMetaDto,
  PricingDto,
  PublicAddonDto,
  PublicMediaItemDto,
  PublicProductDetailDto,
  PublicProductMediaDto,
  PublicProductSummaryDto,
  PublicRentalPackageDto,
  PublicSpecDto,
  TranslationStatusDto,
} from './dto.ts';
import { pick, pickAlt, pickOptional, pickTranslation, resolveField } from './i18n.ts';
import type {
  AddonRow,
  ProductAggregate,
  ProductSummaryRowData,
  ProductTranslationRow,
  SpecOptionRow,
  SpecRow,
  SpecValueOptionRow,
  SpecValueRow,
} from './types.ts';

/** Record → DTO. Pure functions, no IO. */

const money = (amount: string, currency: string): MoneyDto => ({ amount, currency });

/**
 * The lowest real figure a product can be had for — see `PricingDto.fromPrice`.
 * Compared in bigint hundredths through `toHundredths`, never as JS numbers.
 */
const toFromPrice = (
  basePrice: string | null,
  packages: readonly RentalPackage[],
): string | null => {
  if (basePrice !== null) return basePrice;
  let cheapest: string | null = null;
  for (const pkg of packages) {
    const price = asMoney(pkg.price);
    if (cheapest === null || toHundredths(price) < toHundredths(cheapest)) cheapest = price;
  }
  return cheapest;
};

/** "90.0000" → 90, "16.5000" → 16.5 — spec quantities, never money. */
const num = (value: string | null): number | null => (value === null ? null : Number(value));

const iso = (date: Date): string => date.toISOString();

export function toPageMeta(page: number, perPage: number, total: number): PageMetaDto {
  return { page, perPage, total, pageCount: Math.max(1, Math.ceil(total / perPage)) };
}

// --- media -----------------------------------------------------------------

function toPublicMediaItem(
  item: MediaItem | null,
  locale: LanguageCode,
): PublicMediaItemDto | null {
  if (!item) return null;
  return { path: item.path, mimeType: item.mimeType, alt: pickAlt(item.alt, locale) };
}

function toPublicMedia(media: ProductMedia, locale: LanguageCode): PublicProductMediaDto {
  const item = (m: MediaItem | null) => toPublicMediaItem(m, locale);
  return {
    thumbnail: item(media.thumbnail),
    cleanPng: item(media.cleanPng),
    gallery: media.gallery.map((m) => item(m)!),
    videos: media.videos.map((m) => item(m)!),
    documents: media.documents.map((m) => item(m)!),
  };
}

// --- rental packages -------------------------------------------------------

/**
 * `label` is composed here rather than in the storefront so the pluralisation
 * rule lives in one place — `@mia/i18n` owns the forms, including Italian's
 * elided `all'ora`. Order is the stored order: the back office arranges them.
 */
function toPublicRentalPackages(
  packages: RentalPackage[],
  locale: LanguageCode,
): PublicRentalPackageDto[] {
  return packages.map((item) => ({
    code: item.code,
    name: pick(item.name, locale),
    label: durationLabel(item.duration, item.unit, locale),
    price: item.price,
    duration: item.duration,
    unit: item.unit,
  }));
}

// --- translation status ----------------------------------------------------

const TRANSLATION_FIELDS = [
  'title',
  'shortDescription',
  'description',
  'slug',
  'metaTitle',
  'metaDescription',
] as const;

export function toTranslationStatus(rows: ProductTranslationRow[]): TranslationStatusDto {
  const missing: Partial<Record<LanguageCode, string[]>> = {};
  const statusFor = (lang: LanguageCode): 'complete' | 'partial' | 'missing' => {
    const row = rows.find((r) => r.languageCode === lang);
    if (!row) return 'missing';
    const gaps = TRANSLATION_FIELDS.filter((field) => {
      const value = row[field];
      return value === null || value === '';
    });
    if (gaps.length === 0) return 'complete';
    missing[lang] = gaps;
    return 'partial';
  };
  return { it: statusFor('it'), en: statusFor('en'), missing };
}

// --- specs -----------------------------------------------------------------

const YES: Record<LanguageCode, string> = { it: 'Sì', en: 'Yes' };
const NO: Record<LanguageCode, string> = { it: 'No', en: 'No' };

/**
 * Exported because an order line snapshots the words the customer read, and a
 * `boolean` intake answer is one of them: the storefront showed "Sì", so that is
 * what the record has to say — not the `yes` the wire carried.
 */
export function booleanLabel(value: boolean, locale: LanguageCode): string {
  return value ? YES[locale] : NO[locale];
}

function specValueAndDisplay(
  spec: SpecRow & { options: SpecOptionRow[] },
  value: SpecValueRow,
  optionIds: string[],
  locale: LanguageCode,
): { value: PublicSpecDto['value']; displayValue: string } {
  const unit = spec.unit ? ` ${spec.unit}` : '';
  switch (spec.valueType) {
    case 'number': {
      const n = num(value.numberValue);
      return { value: n, displayValue: n === null ? '—' : `${n}${unit}` };
    }
    case 'number_range': {
      const min = num(value.numberMin);
      const max = num(value.numberMax);
      return { value: { min, max }, displayValue: `${min ?? '—'}–${max ?? '—'}${unit}` };
    }
    case 'boolean': {
      const b = value.booleanValue;
      return { value: b, displayValue: b === null ? '—' : b ? YES[locale] : NO[locale] };
    }
    case 'single_select': {
      const option = spec.options.find((o) => optionIds.includes(o.id));
      return {
        value: option?.value ?? null,
        displayValue: option ? pick(option.label, locale) : '—',
      };
    }
    case 'multi_select': {
      const selected = spec.options.filter((o) => optionIds.includes(o.id));
      return {
        value: selected.map((o) => o.value),
        displayValue: selected.map((o) => pick(o.label, locale)).join(', ') || '—',
      };
    }
    default: {
      const text = value.textValue ? pick(value.textValue, locale) : null;
      return { value: text, displayValue: text ?? '—' };
    }
  }
}

function toPublicSpecs(
  specs: ProductAggregate['specs'],
  values: SpecValueRow[],
  valueOptions: SpecValueOptionRow[],
  locale: LanguageCode,
): PublicSpecDto[] {
  const valueBySpec = new Map(values.map((v) => [v.specId, v]));
  const optionsBySpec = new Map<string, string[]>();
  for (const link of valueOptions) {
    const list = optionsBySpec.get(link.specId) ?? [];
    list.push(link.optionId);
    optionsBySpec.set(link.specId, list);
  }

  return specs
    .filter((spec) => valueBySpec.has(spec.id) || optionsBySpec.has(spec.id))
    .sort((a, b) => a.position - b.position)
    .map((spec) => {
      const value = valueBySpec.get(spec.id);
      const optionIds = optionsBySpec.get(spec.id) ?? [];
      const resolved = value
        ? specValueAndDisplay(spec, value, optionIds, locale)
        : specValueAndDisplay(
            spec,
            // Select specs may carry options without a value row.
            {
              numberValue: null,
              numberMin: null,
              numberMax: null,
              booleanValue: null,
              textValue: null,
            } as SpecValueRow,
            optionIds,
            locale,
          );
      return {
        id: spec.id,
        key: spec.key,
        label: pick(spec.label, locale),
        valueType: spec.valueType,
        unit: spec.unit,
        value: resolved.value,
        displayValue: resolved.displayValue,
        isFilterable: spec.isFilterable,
        isComparable: spec.isComparable,
        icon: spec.icon,
        position: spec.position,
      };
    });
}

// --- addons ----------------------------------------------------------------

function toPublicAddon(row: AddonRow, locale: LanguageCode): PublicAddonDto {
  return {
    id: row.id,
    name: pick(row.name, locale),
    description: pickOptional(row.description, locale),
    pricing: {
      mode: row.pricingMode,
      rentalUnit: row.rentalUnit,
      currency: row.currency,
      price: asMoney(row.price),
    },
    minQuantity: row.minQuantity,
    maxQuantity: row.maxQuantity,
    icon: row.icon,
    position: row.position,
  };
}

// --- public detail ---------------------------------------------------------

export function toPublicDetail(
  row: ProductAggregate,
  locale: LanguageCode,
): PublicProductDetailDto {
  const translations = row.translations;
  const requested = translations.find((t) => t.languageCode === locale);
  const italian = translations.find((t) => t.languageCode === 'it');
  const active = requested ?? italian;
  if (!active) throw new Error(`Product ${row.id} has no translations.`);

  const shortDescription = resolveField(
    requested?.shortDescription,
    italian?.shortDescription,
    locale,
  );
  const description = resolveField(requested?.description, italian?.description, locale);

  const pricing: PricingDto = {
    mode: row.pricingMode,
    rentalUnit: row.rentalUnit,
    currency: row.currency,
    price: row.basePrice,
    marketingRate: row.marketingRate,
    fromPrice: toFromPrice(row.basePrice, row.rentalPackages),
  };

  const categoryTranslation = pickTranslation(row.category.translations, locale);

  const detail: PublicProductDetailDto = {
    id: row.id,
    slug: active.slug,
    locale,
    availableLocales: translations.map((t) => t.languageCode),
    status: row.status,
    brand: row.brand,
    isFeatured: row.isFeatured,
    title: resolveField(requested?.title, italian?.title, locale).value ?? '',
    shortDescription: shortDescription.value,
    description: description.value,
    seo: {
      title: resolveField(requested?.metaTitle, italian?.metaTitle, locale).value,
      description: resolveField(requested?.metaDescription, italian?.metaDescription, locale).value,
    },
    chips: toChips(row.chips, locale),
    category: {
      id: row.category.id,
      code: row.category.code,
      slug: categoryTranslation?.slug ?? row.category.code,
      name: categoryTranslation?.name ?? row.category.code,
      icon: row.category.icon,
    },
    pricing,
    rentalPackages: toPublicRentalPackages(row.rentalPackages, locale),
    media: toPublicMedia(row.media, locale),
    stock: row.stock,
    inStock: row.stock > 0,
    specifications: toPublicSpecs(row.specs, row.specValues, row.specValueOptions, locale),
    addons: row.addons.sort((a, b) => a.position - b.position).map((a) => toPublicAddon(a, locale)),
    questions: row.questions
      .sort((a, b) => a.position - b.position)
      .map((question) => ({
        id: question.id,
        key: question.key,
        prompt: pick(question.prompt, locale),
        helpText: pickOptional(question.helpText, locale),
        valueType: question.questionValueType,
        isRequired: question.isRequired,
        min: num(question.minValue),
        max: num(question.maxValue),
        maxLength: question.maxLength,
        position: question.position,
        options: question.options
          .sort((a, b) => a.position - b.position)
          .map((option) => ({
            id: option.id,
            value: option.value,
            label: pick(option.label, locale),
          })),
      })),
    faqs: row.faqs
      .filter((faq) => faq.isActive)
      .sort((a, b) => a.position - b.position)
      .map((faq) => ({
        id: faq.id,
        question: pick(faq.question, locale),
        answer: pick(faq.answer, locale),
        position: faq.position,
      })),
    terms: row.terms
      .sort((a, b) => a.position - b.position)
      .map((link) => {
        const translation = pickTranslation(link.terms.translations, locale);
        return {
          id: link.terms.id,
          code: link.terms.code,
          slug: translation?.slug ?? link.terms.code,
          title: translation?.title ?? link.terms.code,
          version: link.terms.version,
          publishedAt: link.terms.publishedAt ? iso(link.terms.publishedAt) : null,
        };
      }),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };

  // Fallback markers — present only when the field actually fell back.
  if (shortDescription.fellBack) detail.shortDescriptionLocale = 'it';
  if (description.fellBack) detail.descriptionLocale = 'it';
  return detail;
}

// --- public summary --------------------------------------------------------

/**
 * A product's own chips, resolved for the reader. Order is the order the back
 * office typed; the 20-character and five-chip limits were enforced on write,
 * so nothing is trimmed or dropped here.
 */
function toChips(chips: ProductChip[], locale: LanguageCode): string[] {
  return chips.map((chip) => pick(chip, locale));
}

/**
 * The fallback for a product nobody has written chips for yet: at most three
 * comparable specs, each collapsed to one short string. Booleans read as their
 * label ("Pieghevole"), and only when true — "Sì" alone tells a shopper
 * nothing; everything else shows its displayValue ("120 kg", "Elettrico").
 *
 * Kept so the pre-chip catalog still looks finished. It is second choice
 * everywhere: a spec is written to be filtered and compared, which is not the
 * same job as selling the product in four words.
 */
function toCardSpecTags(row: ProductSummaryRowData, locale: LanguageCode): string[] {
  return toPublicSpecs(row.specs, row.specValues, row.specValueOptions, locale)
    .filter((spec) => spec.isComparable && spec.displayValue !== '—')
    .filter((spec) => spec.valueType !== 'boolean' || spec.value === true)
    .slice(0, 3)
    .map((spec) => (spec.valueType === 'boolean' ? spec.label : spec.displayValue));
}

export function toPublicSummary(
  row: ProductSummaryRowData,
  locale: LanguageCode,
): PublicProductSummaryDto {
  const translation = pickTranslation(row.translations, locale);
  const categoryTranslation = pickTranslation(row.category.translations, locale);
  return {
    id: row.id,
    slug: translation?.slug ?? '',
    title: translation?.title ?? '',
    shortDescription: translation?.shortDescription ?? null,
    status: row.status,
    brand: row.brand,
    isFeatured: row.isFeatured,
    category: {
      slug: categoryTranslation?.slug ?? row.category.code,
      name: categoryTranslation?.name ?? row.category.code,
    },
    pricing: {
      mode: row.pricingMode,
      rentalUnit: row.rentalUnit,
      currency: row.currency,
      price: row.basePrice,
      marketingRate: row.marketingRate,
      fromPrice: toFromPrice(row.basePrice, row.rentalPackages),
    },
    thumbnail: toPublicMediaItem(row.media.thumbnail, locale),
    chips: row.chips.length > 0 ? toChips(row.chips, locale) : toCardSpecTags(row, locale),
    inStock: row.stock > 0,
  };
}

export type { FacetDto };

// --- admin -----------------------------------------------------------------

function toAdminTranslation(row: ProductTranslationRow): AdminProductTranslationDto {
  return {
    title: row.title,
    shortDescription: row.shortDescription,
    description: row.description,
    slug: row.slug,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
  };
}

export function toAdminDetail(row: ProductAggregate): AdminProductDetailDto {
  const translations: Partial<Record<LanguageCode, AdminProductTranslationDto>> = {};
  for (const t of row.translations) translations[t.languageCode] = toAdminTranslation(t);

  const optionsBySpec = new Map<string, string[]>();
  for (const link of row.specValueOptions) {
    const list = optionsBySpec.get(link.specId) ?? [];
    list.push(link.optionId);
    optionsBySpec.set(link.specId, list);
  }
  const specTypeById = new Map(row.specs.map((s) => [s.id, s.valueType]));

  const specValues: AdminSpecValueDto[] = row.specValues.map((value) => ({
    specId: value.specId,
    valueType: specTypeById.get(value.specId) ?? 'string',
    numberValue: num(value.numberValue),
    numberMin: num(value.numberMin),
    numberMax: num(value.numberMax),
    booleanValue: value.booleanValue,
    optionIds: optionsBySpec.get(value.specId) ?? [],
    textValue: value.textValue,
  }));
  // Select specs whose links exist without a value row still surface.
  for (const [specId, optionIds] of optionsBySpec) {
    if (!row.specValues.some((v) => v.specId === specId)) {
      specValues.push({
        specId,
        valueType: specTypeById.get(specId) ?? 'single_select',
        numberValue: null,
        numberMin: null,
        numberMax: null,
        booleanValue: null,
        optionIds,
        textValue: null,
      });
    }
  }

  return {
    id: row.id,
    status: row.status,
    categoryId: row.categoryId,
    brand: row.brand,
    isFeatured: row.isFeatured,
    pricingMode: row.pricingMode,
    pricingModeLocked: true,
    rentalUnit: row.rentalUnit,
    basePrice: row.basePrice,
    marketingRate: row.marketingRate,
    currency: row.currency,
    rentalPackages: row.rentalPackages,
    chips: row.chips,
    translations,
    translationStatus: toTranslationStatus(row.translations),
    stock: row.stock,
    specValues,
    media: row.media,
    addons: row.addons
      .sort((a, b) => a.position - b.position)
      .map((addon) => ({
        id: addon.id,
        pricingMode: addon.pricingMode,
        productPricingMode: addon.productPricingMode,
        rentalUnit: addon.rentalUnit,
        price: asMoney(addon.price),
        currency: addon.currency,
        minQuantity: addon.minQuantity,
        maxQuantity: addon.maxQuantity,
        icon: addon.icon,
        position: addon.position,
        name: addon.name,
        description: addon.description,
      })),
    allowedAddonModes: row.pricingMode === 'rental' ? ['rental', 'fixed'] : ['fixed'],
    questions: row.questions
      .sort((a, b) => a.position - b.position)
      .map((question) => ({
        id: question.id,
        key: question.key,
        questionValueType: question.questionValueType,
        isRequired: question.isRequired,
        minValue: num(question.minValue),
        maxValue: num(question.maxValue),
        maxLength: question.maxLength,
        position: question.position,
        prompt: question.prompt,
        helpText: question.helpText,
        options: question.options
          .sort((a, b) => a.position - b.position)
          .map((option) => ({
            id: option.id,
            value: option.value,
            position: option.position,
            label: option.label,
          })),
      })),
    faqs: row.faqs
      .sort((a, b) => a.position - b.position)
      .map((faq) => ({
        id: faq.id,
        position: faq.position,
        isActive: faq.isActive,
        question: faq.question,
        answer: faq.answer,
      })),
    termsIds: row.terms.sort((a, b) => a.position - b.position).map((link) => link.termsId),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

/** Display strings resolve per the reader's locale, falling back to Italian
    — same rule as the storefront. Slug stays Italian: it is the canonical
    URL segment, not display text. */
export function toAdminSummary(
  row: ProductSummaryRowData,
  locale: LanguageCode = 'it',
): AdminProductSummaryDto {
  const italian = row.translations.find((t) => t.languageCode === 'it');
  const localized = row.translations.find((t) => t.languageCode === locale) ?? italian;
  const categoryItalian = row.category.translations.find((t) => t.languageCode === 'it');
  const categoryLocalized =
    row.category.translations.find((t) => t.languageCode === locale) ?? categoryItalian;
  return {
    id: row.id,
    status: row.status,
    brand: row.brand,
    isFeatured: row.isFeatured,
    pricingMode: row.pricingMode,
    rentalUnit: row.rentalUnit,
    basePrice: row.basePrice,
    marketingRate: row.marketingRate,
    currency: row.currency,
    stock: row.stock,
    title: localized?.title || italian?.title || '',
    slug: italian?.slug ?? '',
    categoryName: categoryLocalized?.name || categoryItalian?.name || row.category.code,
    translationStatus: toTranslationStatus(row.translations),
    thumbnail: row.media.thumbnail?.path ?? null,
    updatedAt: iso(row.updatedAt),
  };
}

export type LocalizedValue = Localized;
