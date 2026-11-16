import {
  type LanguageCode,
  type LocalizedLike,
  localizedFrom,
  type PlanField,
  SOURCE_LANGUAGE,
} from '~/lib/i18n';

import { type MessageKey, t } from '~/lib/ui-text';

import type { AdminCategory, AdminProduct } from './shared';

/**
 * Everything on a product that a translation run can fill.
 *
 * The list is built from the DTO the page already holds, so it needs no extra
 * request — except for spec labels, which live on the category. `category` is
 * therefore optional: without it the spec fields are simply absent from the run
 * rather than labelled by a uuid.
 *
 * Field keys are the contract with `translation-save.ts`, which parses them
 * back into the four payloads they came from. Keep the two files in step.
 *
 * Not included, deliberately:
 *   · `slug` — derived from the translated title, so asking a provider for it
 *     would return a URL with spaces in it (see `translation-save.ts`)
 *   · spec *option* labels — they belong to the category's spec definition, not
 *     to this product, so translating one product must not rewrite them
 *   · intake questions — their prompt/help/option labels are the same shape and
 *     can be added the same way when that tab is next touched
 */

type TranslationRow = NonNullable<AdminProduct['translations'][LanguageCode]>;

const DETAILS = 'details';

/**
 * Section headings, stored as keys and translated when the field list is built.
 * `buildPlanFields` runs inside a `$derived`, so a language switch rebuilds the
 * labels the translate dialog prints.
 */
const SECTION_KEY = {
  details: 'products.planDetails',
  chips: 'products.planChips',
  media: 'products.planMedia',
  specs: 'products.planSpecs',
  addons: 'products.planAddons',
  faqs: 'products.planFaqs',
} as const satisfies Record<string, MessageKey>;

/** The longest the server accepts for a chip — `ProductChipSchema`'s 20. */
const CHIP_MAX = 20;

export function buildPlanFields(
  product: AdminProduct,
  category: AdminCategory | null,
): PlanField[] {
  const fields: PlanField[] = [];
  const section = (name: keyof typeof SECTION_KEY): string => t(SECTION_KEY[name]);

  const detail = (
    key: string,
    labelKey: MessageKey,
    maxLength: number,
    pick: (row: TranslationRow) => string | null,
    options: { format?: 'text' | 'html'; createsRow?: boolean; deriveFrom?: string } = {},
  ): void => {
    fields.push({
      key: `${DETAILS}.${key}`,
      label: t(labelKey),
      section: section('details'),
      group: DETAILS,
      groupLabel: section('details'),
      format: options.format ?? 'text',
      maxLength,
      ...(options.createsRow ? { createsRow: true } : {}),
      ...(options.deriveFrom ? { deriveFrom: options.deriveFrom } : {}),
      values: localizedFrom(product.translations, pick),
    });
  };

  /** Caps mirror `ProductTranslationFields` in `@mia/validators`. */
  detail('title', 'products.fieldTitle', 200, (row) => row.title, { createsRow: true });
  detail('shortDescription', 'products.fieldShortDescription', 500, (row) => row.shortDescription);
  detail('description', 'products.fieldDescription', 40_000, (row) => row.description, {
    format: 'html',
  });
  /*
    The two SEO fields derive from prose when the source has none. They are
    nullable and nothing in the admin asks for them, so a product whose Italian
    row has neither would otherwise never carry a meta title in any language —
    which is what an operator means by "translate every multi-language field".
    A meta title IS the title, which is the ordinary SEO default.
  */
  detail('metaTitle', 'products.fieldMetaTitle', 200, (row) => row.metaTitle, {
    deriveFrom: `${DETAILS}.title`,
  });
  detail('metaDescription', 'products.fieldMetaDescription', 400, (row) => row.metaDescription, {
    deriveFrom: `${DETAILS}.shortDescription`,
  });

  // A chip IS a localized value, so the chip is both the group and the field.
  product.chips.forEach((chip, index) => {
    fields.push({
      key: `chip:${index}`,
      label: t('products.planChipText'),
      section: section('chips'),
      group: `chip:${index}`,
      groupLabel: t('products.planChip', { n: index + 1 }),
      format: 'text',
      maxLength: CHIP_MAX,
      values: chip,
    });
  });

  const mediaItems: Array<{
    id: string;
    label: string;
    item: AdminProduct['media']['gallery'][number] | AdminProduct['media']['videos'][number];
  }> = [];
  if (product.media.thumbnail) {
    mediaItems.push({
      id: 'thumbnail',
      label: t('products.planThumbnail'),
      item: product.media.thumbnail,
    });
  }
  if (product.media.cleanPng) {
    mediaItems.push({
      id: 'cleanPng',
      label: t('products.planCutout'),
      item: product.media.cleanPng,
    });
  }
  for (const [index, item] of product.media.gallery.entries()) {
    mediaItems.push({
      id: `gallery:${index}`,
      label: t('products.planGalleryPhoto', { n: index + 1 }),
      item,
    });
  }
  for (const [index, item] of product.media.videos.entries()) {
    mediaItems.push({
      id: `videos:${index}`,
      label: t('products.planVideo', { n: index + 1 }),
      item,
    });
  }
  for (const [index, item] of product.media.documents.entries()) {
    mediaItems.push({
      id: `documents:${index}`,
      label: t('products.planDocument', { n: index + 1 }),
      item,
    });
  }

  for (const { id, label, item } of mediaItems) {
    fields.push({
      key: `media:${id}`,
      label: t('products.planAltText'),
      section: section('media'),
      group: `media:${id}`,
      groupLabel: label,
      format: 'text',
      // `AltSchema`'s cap. Alt is optional in every language, so a group here
      // has no source value to require — only a target to fill.
      maxLength: 300,
      values: (item.alt ?? {}) as LocalizedLike,
    });
  }

  if (category) {
    for (const value of product.specValues) {
      const spec = category.specs.find((entry) => entry.id === value.specId);
      // Only free-text specs carry per-product prose. Numbers, booleans and
      // option ids are not language-dependent.
      if (!spec || spec.valueType !== 'string') continue;
      fields.push({
        key: `spec:${value.specId}`,
        label: t('products.planTextValue'),
        section: section('specs'),
        group: `spec:${value.specId}`,
        groupLabel: spec.label[SOURCE_LANGUAGE],
        format: 'text',
        maxLength: 500,
        values: value.textValue ?? {},
      });
    }
  }

  product.addons.forEach((addon, index) => {
    const group = `addon:${addon.id}`;
    const groupLabel = addon.name[SOURCE_LANGUAGE] || t('products.planAddon', { n: index + 1 });
    fields.push({
      key: `${group}.name`,
      label: t('products.fieldName'),
      section: section('addons'),
      group,
      groupLabel,
      format: 'text',
      maxLength: 200,
      values: addon.name,
    });
    fields.push({
      key: `${group}.description`,
      label: t('products.fieldDescription'),
      section: section('addons'),
      group,
      groupLabel,
      format: 'text',
      maxLength: 2000,
      values: addon.description ?? {},
    });
  });

  product.faqs.forEach((faq, index) => {
    const group = `faq:${faq.id}`;
    fields.push({
      key: `${group}.question`,
      label: t('products.fieldQuestion'),
      section: section('faqs'),
      group,
      groupLabel: t('products.planFaq', { n: index + 1 }),
      format: 'text',
      maxLength: 500,
      values: faq.question,
    });
    fields.push({
      key: `${group}.answer`,
      label: t('products.fieldAnswer'),
      section: section('faqs'),
      group,
      groupLabel: t('products.planFaq', { n: index + 1 }),
      format: 'text',
      maxLength: 5000,
      values: faq.answer,
    });
  });

  return fields;
}
