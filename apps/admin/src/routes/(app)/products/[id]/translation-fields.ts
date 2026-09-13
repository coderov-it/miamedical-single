import {
  type LanguageCode,
  type LocalizedLike,
  localizedFrom,
  type PlanField,
  SOURCE_LANGUAGE,
} from '~/lib/i18n';

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

export const SECTION = {
  details: 'Product details',
  chips: 'Chips',
  media: 'Media alt text',
  specs: 'Specs',
  addons: 'Add-ons',
  faqs: 'FAQs',
} as const;

/** The longest the server accepts for a chip — `ProductChipSchema`'s 20. */
const CHIP_MAX = 20;

export function buildPlanFields(
  product: AdminProduct,
  category: AdminCategory | null,
): PlanField[] {
  const fields: PlanField[] = [];

  const detail = (
    key: string,
    label: string,
    maxLength: number,
    pick: (row: TranslationRow) => string | null,
    options: { format?: 'text' | 'html'; createsRow?: boolean; deriveFrom?: string } = {},
  ): void => {
    fields.push({
      key: `${DETAILS}.${key}`,
      label,
      section: SECTION.details,
      group: DETAILS,
      groupLabel: 'Product details',
      format: options.format ?? 'text',
      maxLength,
      ...(options.createsRow ? { createsRow: true } : {}),
      ...(options.deriveFrom ? { deriveFrom: options.deriveFrom } : {}),
      values: localizedFrom(product.translations, pick),
    });
  };

  /** Caps mirror `ProductTranslationFields` in `@mia/validators`. */
  detail('title', 'Title', 200, (row) => row.title, { createsRow: true });
  detail('shortDescription', 'Short description', 500, (row) => row.shortDescription);
  detail('description', 'Description', 40_000, (row) => row.description, { format: 'html' });
  /*
    The two SEO fields derive from prose when the source has none. They are
    nullable and nothing in the admin asks for them, so a product whose Italian
    row has neither would otherwise never carry a meta title in any language —
    which is what an operator means by "translate every multi-language field".
    A meta title IS the title, which is the ordinary SEO default.
  */
  detail('metaTitle', 'Meta title', 200, (row) => row.metaTitle, {
    deriveFrom: `${DETAILS}.title`,
  });
  detail('metaDescription', 'Meta description', 400, (row) => row.metaDescription, {
    deriveFrom: `${DETAILS}.shortDescription`,
  });

  // A chip IS a localized value, so the chip is both the group and the field.
  product.chips.forEach((chip, index) => {
    fields.push({
      key: `chip:${index}`,
      label: 'Chip text',
      section: SECTION.chips,
      group: `chip:${index}`,
      groupLabel: `Chip ${index + 1}`,
      format: 'text',
      maxLength: CHIP_MAX,
      values: chip,
    });
  });

  const mediaItems: Array<{
    id: string;
    label: string;
    item: AdminProduct['media']['gallery'][number];
  }> = [];
  if (product.media.thumbnail) {
    mediaItems.push({ id: 'thumbnail', label: 'Thumbnail', item: product.media.thumbnail });
  }
  if (product.media.cleanPng) {
    mediaItems.push({ id: 'cleanPng', label: 'Clean cutout', item: product.media.cleanPng });
  }
  for (const [index, item] of product.media.gallery.entries()) {
    mediaItems.push({ id: `gallery:${index}`, label: `Gallery photo ${index + 1}`, item });
  }
  for (const [index, item] of product.media.videos.entries()) {
    mediaItems.push({ id: `videos:${index}`, label: `Video ${index + 1}`, item });
  }
  for (const [index, item] of product.media.documents.entries()) {
    mediaItems.push({ id: `documents:${index}`, label: `Document ${index + 1}`, item });
  }

  for (const { id, label, item } of mediaItems) {
    fields.push({
      key: `media:${id}`,
      label: 'Alt text',
      section: SECTION.media,
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
        label: 'Text value',
        section: SECTION.specs,
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
    const groupLabel = addon.name[SOURCE_LANGUAGE] || `Add-on ${index + 1}`;
    fields.push({
      key: `${group}.name`,
      label: 'Name',
      section: SECTION.addons,
      group,
      groupLabel,
      format: 'text',
      maxLength: 200,
      values: addon.name,
    });
    fields.push({
      key: `${group}.description`,
      label: 'Description',
      section: SECTION.addons,
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
      label: 'Question',
      section: SECTION.faqs,
      group,
      groupLabel: `FAQ ${index + 1}`,
      format: 'text',
      maxLength: 500,
      values: faq.question,
    });
    fields.push({
      key: `${group}.answer`,
      label: 'Answer',
      section: SECTION.faqs,
      group,
      groupLabel: `FAQ ${index + 1}`,
      format: 'text',
      maxLength: 5000,
      values: faq.answer,
    });
  });

  return fields;
}
