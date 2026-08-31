/**
 * One authored product → the rows it becomes: the product itself, its
 * translations, its typed spec values, its media, add-ons, FAQs and intake
 * questions.
 *
 * Every id is derived from the product's `code` (see ids.ts), so the position a
 * row holds in the file is presentation and never identity — reorder an add-on
 * list and nothing is deleted and re-created.
 */
import type {
  AuthoredAddon,
  AuthoredCategory,
  AuthoredMediaRef,
  AuthoredProduct,
} from './authored.ts';
import {
  addonId,
  faqId,
  handleOf,
  productId,
  questionId,
  questionOptionId,
  specId,
} from './ids.ts';
import type {
  PlannedAddon,
  PlannedMedia,
  PlannedProduct,
  PlannedSpecValue,
  MediaRole,
} from './planned.ts';
import {
  assetResolverFor,
  localized,
  localizedOrNull,
  planTranslations,
  type AssetResolver,
} from './resolve.ts';
import { coerceSpecValue } from './spec-values.ts';

export function planProduct(
  product: AuthoredProduct,
  category: AuthoredCategory,
  categoryId: string,
  file: string,
  assetsRoot: string,
  problems: string[],
): PlannedProduct {
  const id = product.id ?? productId(product.code);
  const where = `${file}.json › product "${product.code}"`;
  const currency = (product.currency ?? 'EUR').toUpperCase();
  const asset = assetResolverFor(assetsRoot, category.code);

  return {
    id,
    code: product.code,
    file,
    categoryId,
    categoryCode: category.code,
    status: product.status ?? 'draft',
    brand: product.brand ?? null,
    pricingMode: product.pricingMode,
    basePrice: product.basePrice ?? null,
    marketingRate: product.marketingRate ?? null,
    currency,
    rentalUnit: product.rentalUnit ?? null,
    rentalPackages: (product.rentalPackages ?? []).map((entry) => ({
      code: entry.code,
      name: localized(entry.name),
      price: entry.price,
      duration: entry.duration,
      unit: entry.unit,
    })),
    stock: product.stock ?? 0,
    isFeatured: product.isFeatured ?? false,
    chips: (product.chips ?? []).map(localized),
    translations: planTranslations(product.title, product.slug, {
      shortDescription: product.shortDescription ?? null,
      description: product.description ?? null,
      metaTitle: product.metaTitle ?? null,
      metaDescription: product.metaDescription ?? null,
    }),
    specValues: planSpecValues(product, category, id, where, problems),
    media: planMedia(product, asset),
    addons: (product.addons ?? []).map((addon, index) =>
      planAddon(addon, index, product, currency, asset),
    ),
    faqs: (product.faqs ?? []).map((faq, index) => ({
      id: faqId(product.code, handleOf(faq.question.it)),
      question: localized(faq.question),
      answer: localized(faq.answer),
      position: faq.position ?? index,
      isActive: faq.isActive ?? true,
    })),
    questions: (product.questions ?? []).map((question, index) => ({
      id: questionId(product.code, question.key),
      key: question.key,
      prompt: localized(question.prompt),
      helpText: localizedOrNull(question.helpText),
      questionValueType: question.questionValueType,
      isRequired: question.isRequired ?? false,
      minValue: question.minValue ?? null,
      maxValue: question.maxValue ?? null,
      maxLength: question.maxLength ?? null,
      position: question.position ?? index,
      options: (question.options ?? []).map((option, optionIndex) => ({
        id: questionOptionId(product.code, question.key, option.value),
        value: option.value,
        label: localized(option.label),
        position: optionIndex,
      })),
    })),
  };
}

/**
 * An add-on inherits the product's mode and currency unless the file overrides
 * the mode, and a rental add-on always bills in the PRODUCT's unit — one period
 * has to multiply every amount on the page, so its own unit is never a second
 * answer to the same question.
 */
function planAddon(
  addon: AuthoredAddon,
  index: number,
  product: AuthoredProduct,
  currency: string,
  asset: AssetResolver,
): PlannedAddon {
  const mode = addon.pricingMode ?? product.pricingMode;
  return {
    id: addonId(product.code, handleOf(addon.name.it)),
    name: localized(addon.name),
    description: localizedOrNull(addon.description),
    pricingMode: mode,
    price: addon.price,
    currency,
    rentalUnit: mode === 'rental' ? (addon.rentalUnit ?? product.rentalUnit ?? null) : null,
    minQuantity: addon.minQuantity ?? 0,
    maxQuantity: addon.maxQuantity ?? null,
    icon: asset(addon.icon),
    position: addon.position ?? index,
  };
}

/**
 * The `specs` map, keyed by the category's spec keys. An unknown key is a
 * problem rather than a silent drop: a typo'd key would otherwise mean a
 * product that quietly lost a filterable attribute.
 */
function planSpecValues(
  product: AuthoredProduct,
  category: AuthoredCategory,
  id: string,
  where: string,
  problems: string[],
): PlannedSpecValue[] {
  const declared = new Map((category.specs ?? []).map((spec) => [spec.key, spec]));
  const values: PlannedSpecValue[] = [];

  for (const [key, raw] of Object.entries(product.specs ?? {})) {
    const spec = declared.get(key);
    if (!spec) {
      problems.push(
        `${where}: spec "${key}" is not declared on category "${category.code}" ` +
          `(declared: ${[...declared.keys()].join(', ') || 'none'})`,
      );
      continue;
    }
    const result = coerceSpecValue(spec, category.code, raw);
    if (!result.ok) {
      problems.push(`${where}: spec "${key}" — ${result.error}`);
      continue;
    }
    values.push({
      productId: id,
      specId: specId(category.code, key),
      specKey: key,
      ...result.value,
    });
  }

  for (const spec of declared.values()) {
    if (spec.isRequired && !values.some((value) => value.specKey === spec.key)) {
      problems.push(`${where}: spec "${spec.key}" is required on this category and is missing`);
    }
  }

  return values;
}

function planMedia(product: AuthoredProduct, asset: AssetResolver): PlannedMedia[] {
  const media = product.media ?? {};
  const entries: PlannedMedia[] = [];

  const push = (role: MediaRole, ref: AuthoredMediaRef | null | undefined, position: number) => {
    if (!ref) return;
    const resolved = asset(typeof ref === 'string' ? ref : ref.file);
    if (!resolved) return;
    entries.push({
      role,
      position,
      asset: resolved,
      alt: typeof ref === 'string' ? null : localizedOrNull(ref.alt),
    });
  };

  push('thumbnail', media.thumbnail, 0);
  push('cleanPng', media.cleanPng, 0);
  for (const [index, ref] of (media.gallery ?? []).entries()) push('gallery', ref, index);
  for (const [index, ref] of (media.videos ?? []).entries()) push('video', ref, index);
  for (const [index, ref] of (media.documents ?? []).entries()) push('document', ref, index);
  return entries;
}
