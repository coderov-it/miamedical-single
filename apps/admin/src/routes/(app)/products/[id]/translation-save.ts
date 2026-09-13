import { api } from '~/lib/api';
import {
  buildTranslations,
  type LanguageCode,
  type LocalizedLike,
  type LocalizedOptional,
  SOURCE_LANGUAGE,
  TARGET_LANGUAGE_CODES,
  type TargetLanguageCode,
} from '~/lib/i18n';
import { unwrap } from '~/lib/request';
import { slugify } from '~/lib/slug';

import type { AdminProduct, Localized } from './shared';

/**
 * Write a translation run back onto the product.
 *
 * Four endpoints, because the product is not one record:
 *
 *   PATCH /products/:id          the translation row, chips, media alt text
 *   PUT   /products/:id/specs     spec text values
 *   PUT   /products/:id/addons    addon names and descriptions
 *   PUT   /products/:id/faqs      FAQ questions and answers
 *
 * Only the endpoints with something to write are called. The collection PUTs
 * replace the whole list, so each rebuilds its array from the DTO the page
 * holds with the translated text merged in — the same shape the corresponding
 * tab sends, which is what keeps a translated save from dropping a field the
 * tab would have kept.
 *
 * Field keys are produced by `translation-fields.ts`; the two files are one
 * contract.
 */

type TranslationRow = NonNullable<AdminProduct['translations'][LanguageCode]>;

/** `{ fr: { 'faq:9.answer': '…' } }` — what the dialog hands back. */
export type TranslationRows = Partial<Record<TargetLanguageCode, Record<string, string>>>;

/** The subset of a run's keys one endpoint owns. */
function selectKeys(rows: TranslationRows, keep: (key: string) => boolean): TranslationRows {
  const out: TranslationRows = {};
  for (const lang of Object.keys(rows) as TargetLanguageCode[]) {
    const values = rows[lang];
    if (!values) continue;
    const matching: Record<string, string> = {};
    for (const [key, text] of Object.entries(values)) {
      if (keep(key)) matching[key] = text;
    }
    if (Object.keys(matching).length > 0) out[lang] = matching;
  }
  return out;
}

/** Drop a common prefix from every key, keeping the language split: `details.title` → `title`. */
function stripPrefix(rows: TranslationRows, prefix: string): TranslationRows {
  const out: TranslationRows = {};
  for (const lang of Object.keys(rows) as TargetLanguageCode[]) {
    const values = rows[lang];
    if (!values) continue;
    const stripped: Record<string, string> = {};
    for (const [key, text] of Object.entries(values)) {
      stripped[key.slice(prefix.length)] = text;
    }
    out[lang] = stripped;
  }
  return out;
}

/** One key read across every language: `{ fr: '…', de: '…' }`. */
function perLanguage(rows: TranslationRows, key: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const lang of Object.keys(rows) as TargetLanguageCode[]) {
    const text = rows[lang]?.[key];
    if (text !== undefined) out[lang] = text;
  }
  return out;
}

const hasKeys = (rows: TranslationRows): boolean => Object.keys(rows).length > 0;

/**
 * Fold translated text into a stored localized value, dropping empty targets —
 * the same rule `localizedOrNull` applies to a form. An empty target must be
 * absent, not `''`, or the storefront would serve a blank translation instead
 * of falling back.
 *
 * Returns `null` when there is no source-language text: a value cannot exist
 * without one, and every collection schema requires it.
 */
function mergeLocalized(
  base: LocalizedLike | null | undefined,
  additions: Record<string, string>,
): Localized | null {
  const source = (base?.[SOURCE_LANGUAGE] ?? '').trim();
  if (!source) return null;

  const merged: Record<string, string> = { [SOURCE_LANGUAGE]: source };
  for (const code of TARGET_LANGUAGE_CODES) {
    const text = (additions[code] ?? base?.[code] ?? '').trim();
    if (text) merged[code] = text;
  }
  return merged as Localized;
}

export async function saveTranslations(
  product: AdminProduct,
  rows: TranslationRows,
): Promise<AdminProduct> {
  const details = stripPrefix(
    selectKeys(rows, (key) => key.startsWith('details.')),
    'details.',
  );
  const chips = selectKeys(rows, (key) => key.startsWith('chip:'));
  const media = selectKeys(rows, (key) => key.startsWith('media:'));
  const specs = selectKeys(rows, (key) => key.startsWith('spec:'));
  const addons = selectKeys(rows, (key) => key.startsWith('addon:'));
  const faqs = selectKeys(rows, (key) => key.startsWith('faq:'));

  let touched = false;

  // --- the product row: translation row, chips and media alt, one PATCH -----

  const rowFor = (
    lang: LanguageCode,
    additions: Record<string, string> | undefined,
  ): TranslationRow | null => {
    const existing = product.translations[lang];
    // The source row always goes back exactly as the server returned it. The
    // payload schema requires it on every request, and a PATCH replaces a
    // language's whole row.
    if (lang === SOURCE_LANGUAGE) return existing ? { ...existing } : null;
    if (!additions) return null;

    const title = additions.title ?? existing?.title;
    // A translated title is re-slugged: the provider never returns one, and a
    // slug with spaces in it is not a URL.
    const slug = additions.title ? slugify(additions.title) : existing?.slug;
    if (!title || !slug) return null;

    return {
      title,
      slug,
      shortDescription: additions.shortDescription ?? existing?.shortDescription ?? null,
      description: additions.description ?? existing?.description ?? null,
      metaTitle: additions.metaTitle ?? existing?.metaTitle ?? null,
      metaDescription: additions.metaDescription ?? existing?.metaDescription ?? null,
    };
  };

  const translations = buildTranslations(
    (lang) => rowFor(lang, details[lang as TargetLanguageCode]),
    () => true,
  );

  const chipsPayload = product.chips
    .map((chip, index) => mergeLocalized(chip, perLanguage(chips, `chip:${index}`)))
    .filter((chip): chip is Localized => chip !== null);

  const mediaItem = (
    item: AdminProduct['media']['gallery'][number],
    id: string,
  ): { path: string; mimeType: string; alt?: LocalizedOptional } => {
    const additions = perLanguage(media, `media:${id}`);
    const alt = Object.keys(additions).length > 0 ? mergeLocalized(item.alt, additions) : item.alt;
    return { path: item.path, mimeType: item.mimeType, ...(alt ? { alt } : {}) };
  };

  const body = {
    ...(hasKeys(details) && translations ? { translations } : {}),
    ...(hasKeys(chips) ? { chips: chipsPayload } : {}),
    ...(hasKeys(media)
      ? {
          media: {
            thumbnail: product.media.thumbnail
              ? mediaItem(product.media.thumbnail, 'thumbnail')
              : null,
            cleanPng: product.media.cleanPng ? mediaItem(product.media.cleanPng, 'cleanPng') : null,
            gallery: product.media.gallery.map((item, index) =>
              mediaItem(item, `gallery:${index}`),
            ),
            videos: product.media.videos.map((item, index) => mediaItem(item, `videos:${index}`)),
            documents: product.media.documents.map((item, index) =>
              mediaItem(item, `documents:${index}`),
            ),
          },
        }
      : {}),
  };

  if (Object.keys(body).length > 0) {
    await unwrap<AdminProduct>(
      await api.api.admin.products[':id'].$patch({ param: { id: product.id }, json: body }),
    );
    touched = true;
  }

  // --- spec text values -----------------------------------------------------

  if (hasKeys(specs)) {
    const payload = product.specValues
      .map((value) => ({
        specId: value.specId,
        numberValue: value.numberValue,
        numberMin: value.numberMin,
        numberMax: value.numberMax,
        booleanValue: value.booleanValue,
        optionIds: value.optionIds,
        textValue:
          value.valueType === 'string'
            ? mergeLocalized(value.textValue, perLanguage(specs, `spec:${value.specId}`))
            : null,
      }))
      // A value with nothing in it is dropped rather than sent as an empty row —
      // the same filter the Specs tab applies before its PUT.
      .filter(
        (entry) =>
          entry.textValue !== null ||
          entry.numberValue !== null ||
          entry.numberMin !== null ||
          entry.numberMax !== null ||
          entry.booleanValue !== null ||
          entry.optionIds.length > 0,
      );

    if (payload.length > 0) {
      await unwrap<AdminProduct>(
        await api.api.admin.products[':id'].specs.$put({
          param: { id: product.id },
          json: payload,
        }),
      );
      touched = true;
    }
  }

  // --- addons ---------------------------------------------------------------

  if (hasKeys(addons)) {
    const payload = product.addons.map((addon, position) => ({
      id: addon.id,
      // A name cannot exist without source text; keeping the stored value is the
      // honest fallback if the provider answered nothing at all.
      name: mergeLocalized(addon.name, perLanguage(addons, `addon:${addon.id}.name`)) ?? addon.name,
      description:
        mergeLocalized(addon.description, perLanguage(addons, `addon:${addon.id}.description`)) ??
        addon.description,
      pricingMode: addon.pricingMode,
      price: addon.price,
      currency: addon.currency,
      rentalUnit: addon.rentalUnit,
      minQuantity: addon.minQuantity,
      maxQuantity: addon.maxQuantity,
      icon: addon.icon,
      position,
    }));

    await unwrap<AdminProduct>(
      await api.api.admin.products[':id'].addons.$put({
        param: { id: product.id },
        json: payload,
      }),
    );
    touched = true;
  }

  // --- FAQs -----------------------------------------------------------------

  if (hasKeys(faqs)) {
    const payload = product.faqs.map((faq, position) => ({
      id: faq.id,
      question:
        mergeLocalized(faq.question, perLanguage(faqs, `faq:${faq.id}.question`)) ?? faq.question,
      answer: mergeLocalized(faq.answer, perLanguage(faqs, `faq:${faq.id}.answer`)) ?? faq.answer,
      isActive: faq.isActive,
      position,
    }));

    await unwrap<AdminProduct>(
      await api.api.admin.products[':id'].faqs.$put({
        param: { id: product.id },
        json: payload,
      }),
    );
    touched = true;
  }

  // One GET rather than the last PUT's body: four writes may have landed and
  // only the server knows the combined result.
  if (!touched) return product;
  return unwrap<AdminProduct>(
    await api.api.admin.products[':id'].$get({ param: { id: product.id } }),
  );
}
