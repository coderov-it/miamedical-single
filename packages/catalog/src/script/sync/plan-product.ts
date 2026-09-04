/**
 * One authored product → the rows it becomes: the product itself, its
 * translations, its typed spec values, its media, add-ons, FAQs, intake
 * questions and the terms it signs.
 *
 * Every id is derived from the product's `code` (see ids.ts), so the position a
 * row holds in the file is presentation and never identity — reorder an add-on
 * list and nothing is deleted and re-created.
 *
 * There is no `position` field anywhere in the authoring API on purpose: the
 * order things are written in IS the order they display in. A field that could
 * disagree with the list it sits in is a second answer to the same question,
 * and the JSON format this replaces had authors keeping the two in step by hand.
 */
import type { Localized } from '@mia/db/schema';

import { parseMoney } from '../../lib/money.ts';
import type {
  AnyQuestion,
  Category,
  FixedAddon,
  MediaInput,
  MediaRef,
  ProductInput,
  RentalAddon,
  SpecMap,
} from '../../lib/types.ts';
import {
  addonId,
  faqId,
  handleOf,
  productId,
  questionId,
  questionOptionId,
  specId,
  termsId,
} from './ids.ts';
import type {
  MediaRole,
  PlannedAddon,
  PlannedMedia,
  PlannedProduct,
  PlannedSpecValue,
} from './planned.ts';
import { whereProduct } from './planned.ts';
import { coerceSpecValue } from './spec-values.ts';
import { assetResolverFor, fromProduct, planTranslations, type AssetResolver } from './resolve.ts';

/** Every amount in the catalogue is euro; no data file states a currency. */
const CURRENCY = 'EUR';

export function planProduct(
  product: ProductInput<SpecMap>,
  category: Category,
  categoryId: string,
  assetsRoot: string,
  problems: string[],
): PlannedProduct {
  const categoryCode = category.input.code;
  const id = productId(product.code);
  const where = whereProduct(categoryCode, product.code);
  const asset = assetResolverFor(assetsRoot, categoryCode);
  const money = (amount: number, field: string): string =>
    parse(amount, `${where} › ${field}`, problems);

  const rental = product.pricingMode === 'rental';

  return {
    id,
    code: product.code,
    categoryId,
    categoryCode,
    status: product.status ?? 'draft',
    brand: product.brand ?? null,
    pricingMode: product.pricingMode,
    basePrice: rental ? null : money(product.basePrice, 'basePrice'),
    marketingRate:
      rental && product.marketingRate !== undefined
        ? money(product.marketingRate, 'marketingRate')
        : null,
    currency: CURRENCY,
    rentalUnit: rental ? product.rentalUnit : null,
    rentalPackages: rental
      ? product.packages.map((entry) => ({
          code: entry.code,
          name: entry.name,
          price: money(entry.price, `package ${entry.code} › price`),
          duration: entry.duration,
          unit: entry.unit,
        }))
      : [],
    stock: product.stock ?? 0,
    isFeatured: product.isFeatured ?? false,
    chips: [...(product.chips ?? [])],
    translations: planTranslations(product.translations, fromProduct),
    specValues: planSpecValues(product, category, id, where, problems),
    media: planMedia(product.media, asset),
    addons: (product.addons ?? []).map((addon, index) =>
      planAddon(addon, index, product.code, money),
    ),
    faqs: (product.faqs ?? []).map((faq, index) => ({
      id: faqId(product.code, handleOf(faq.question.it)),
      question: faq.question,
      answer: faq.answer,
      position: index,
      isActive: faq.isActive ?? true,
    })),
    questions: (product.questions ?? []).map((question, index) =>
      planQuestion(question, index, product.code),
    ),
    termsIds: (product.terms ?? []).map((document) => termsId(document.code)),
  };
}

/**
 * An amount the column cannot hold is a problem rather than a throw, so one run
 * reports every bad price instead of dying on the first. `parseMoney` is what
 * rejects the silent rounding Postgres would otherwise do — see money.ts.
 */
function parse(amount: number, field: string, problems: string[]): string {
  try {
    return parseMoney(amount, field);
  } catch (error) {
    problems.push((error as Error).message);
    return '0.00';
  }
}

/**
 * An add-on states its own mode, and a rental one its own unit — the authoring
 * API has a constructor per kind, so neither is inherited or guessed here.
 */
function planAddon(
  addon: FixedAddon | RentalAddon,
  index: number,
  productCode: string,
  money: (amount: number, field: string) => string,
): PlannedAddon {
  const handle = handleOf(addon.name.it);
  return {
    id: addonId(productCode, handle),
    name: addon.name,
    description: addon.description ?? null,
    pricingMode: addon.pricingMode,
    price: money(addon.price, `addon ${handle} › price`),
    currency: CURRENCY,
    rentalUnit: addon.pricingMode === 'rental' ? addon.rentalUnit : null,
    minQuantity: addon.minQuantity ?? 0,
    maxQuantity: addon.maxQuantity ?? null,
    icon: null,
    position: index,
  };
}

function planQuestion(question: AnyQuestion, index: number, productCode: string) {
  const numeric = question.questionValueType === 'number' ? question : null;
  const text =
    question.questionValueType === 'string' || question.questionValueType === 'text'
      ? question
      : null;
  const select =
    question.questionValueType === 'single_select' || question.questionValueType === 'multi_select'
      ? question
      : null;

  return {
    id: questionId(productCode, question.key),
    key: question.key,
    prompt: question.prompt,
    helpText: question.helpText ?? null,
    questionValueType: question.questionValueType,
    isRequired: question.isRequired ?? false,
    minValue: numeric?.minValue ?? null,
    maxValue: numeric?.maxValue ?? null,
    maxLength: text?.maxLength ?? null,
    position: index,
    options: Object.entries(select?.options ?? {}).map(([value, label], optionIndex) => ({
      id: questionOptionId(productCode, question.key, value),
      value,
      label: label as Localized,
      position: optionIndex,
    })),
  };
}

/**
 * The `specs` map, keyed by the category's spec keys. An undeclared key is a
 * problem rather than a silent drop: a typo'd key would otherwise mean a
 * product that quietly lost a filterable attribute.
 */
function planSpecValues(
  product: ProductInput<SpecMap>,
  category: Category,
  id: string,
  where: string,
  problems: string[],
): PlannedSpecValue[] {
  const declared = category.input.specs;
  const categoryCode = category.input.code;
  const values: PlannedSpecValue[] = [];

  for (const [key, raw] of Object.entries(product.specs ?? {})) {
    if (raw === undefined) continue;
    const spec = declared[key];
    if (!spec) {
      problems.push(
        `${where}: spec "${key}" is not declared on category "${categoryCode}" ` +
          `(declared: ${Object.keys(declared).join(', ') || 'none'})`,
      );
      continue;
    }
    const result = coerceSpecValue(spec, key, categoryCode, raw);
    if (!result.ok) {
      problems.push(`${where}: spec "${key}" — ${result.error}`);
      continue;
    }
    values.push({
      productId: id,
      specId: specId(categoryCode, key),
      specKey: key,
      ...result.value,
    });
  }

  for (const [key, spec] of Object.entries(declared)) {
    if (spec.isRequired && !values.some((value) => value.specKey === key)) {
      problems.push(`${where}: spec "${key}" is required on this category and is missing`);
    }
  }

  return values;
}

function planMedia(media: MediaInput | undefined, asset: AssetResolver): PlannedMedia[] {
  const entries: PlannedMedia[] = [];

  const push = (role: MediaRole, ref: string | MediaRef | undefined, position: number): void => {
    if (!ref) return;
    const resolved = asset(typeof ref === 'string' ? ref : ref.file);
    if (!resolved) return;
    const alt = typeof ref === 'string' ? undefined : ref.alt;
    entries.push({
      role,
      position,
      asset: resolved,
      alt: alt?.it === undefined ? null : { it: alt.it, ...(alt.en ? { en: alt.en } : {}) },
    });
  };

  push('thumbnail', media?.thumbnail, 0);
  push('cleanPng', media?.cleanPng, 0);
  for (const [index, ref] of (media?.gallery ?? []).entries()) push('gallery', ref, index);
  for (const [index, ref] of (media?.videos ?? []).entries()) push('video', ref, index);
  for (const [index, ref] of (media?.documents ?? []).entries()) push('document', ref, index);
  return entries;
}
