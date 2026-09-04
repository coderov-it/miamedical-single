/**
 * Everything checked before a single row is written, against the real API
 * schemas rather than bespoke ones — so `--dry-run` proves the data would
 * survive the admin panel's own contract, not a second opinion about it.
 *
 * The authoring API has already made a great deal of this unrepresentable: a
 * rental product with a `basePrice` does not compile, and neither does a spec
 * value of the wrong type. What is left for runtime is everything the type
 * system does not measure — string lengths, slug format, chip counts, the
 * cardinality bounds — plus cross-category uniqueness, which no single file can
 * see.
 *
 * Problems are collected, never thrown: one run reports every bad row, not the
 * first.
 */
import {
  AddonInputSchema,
  CreateCategorySchema,
  CreateProductSchema,
  CreateTermsSchema,
  FaqInputSchema,
  QuestionInputSchema,
  RentalPackagesSchema,
  SpecInputSchema,
  SpecValueInputSchema,
} from '@mia/validators';
import * as v from 'valibot';

import { parseSpecNumber } from '../../lib/money.ts';

import type {
  CatalogPlan,
  PlannedCategory,
  PlannedProduct,
  PlannedTerms,
  PlannedTranslation,
  Translations,
} from './planned.ts';
import { whereCategory, whereProduct, whereTerms } from './planned.ts';

export function validatePlan(plan: CatalogPlan): string[] {
  const problems = [...plan.problems];
  const fail = (where: string, detail: string): void => {
    problems.push(`${where}: ${detail}`);
  };

  const check = (schema: v.GenericSchema, value: unknown, where: string): void => {
    const result = v.safeParse(schema, value);
    if (result.success) return;
    for (const issue of result.issues) {
      const path = issue.path?.map((segment) => String(segment.key)).join('.') ?? '';
      fail(where, `${path ? `${path}: ` : ''}${issue.message}`);
    }
  };

  for (const document of plan.terms) checkTerms(document, check);
  for (const category of plan.categories) checkCategory(category, check, fail);
  for (const product of plan.products) checkProduct(product, check, fail, problems);

  problems.push(...uniqueness(plan));
  problems.push(...missingAssets(plan));
  return problems;
}

type Check = (schema: v.GenericSchema, value: unknown, where: string) => void;
type Fail = (where: string, detail: string) => void;

/**
 * A planned translation as its schema wants it: `slugDerived` is ours and not
 * the API's, and every schema here is a `strictObject`. Categories call the
 * headline `name` and have no `shortDescription`; products call it `title`.
 */
const wire = (translations: Translations, headline: 'title' | 'name'): Record<string, unknown> => {
  const strip = ({
    slugDerived: _ignored,
    title,
    shortDescription,
    ...rest
  }: PlannedTranslation) =>
    headline === 'title' ? { title, shortDescription, ...rest } : { name: title, ...rest };
  return Object.fromEntries(
    Object.entries(translations).map(([language, translation]) => [language, strip(translation)]),
  );
};

function checkTerms(document: PlannedTerms, check: Check): void {
  check(
    CreateTermsSchema,
    { code: document.code, translations: document.translations },
    whereTerms(document.code),
  );
}

function checkCategory(category: PlannedCategory, check: Check, fail: Fail): void {
  const where = whereCategory(category.code);

  // `icon` is deliberately absent: the schema wants an R2 key and the data file
  // holds a file name. The object itself is checked by `missingAssets`.
  check(
    CreateCategorySchema,
    {
      code: category.code,
      position: category.position,
      isActive: category.isActive,
      requiresDeposit: category.requiresDeposit,
      translations: wire(category.translations, 'name'),
    },
    where,
  );

  for (const spec of category.specs) {
    check(
      SpecInputSchema,
      {
        key: spec.key,
        label: spec.label,
        ...(spec.helpText ? { helpText: spec.helpText } : {}),
        valueType: spec.valueType,
        unit: spec.unit,
        isRequired: spec.isRequired,
        isFilterable: spec.isFilterable,
        isComparable: spec.isComparable,
        position: spec.position,
        options: spec.options.map((option) => ({
          value: option.value,
          label: option.label,
          position: option.position,
        })),
      },
      `${where} › spec "${spec.key}"`,
    );
  }

  if (category.specs.length === 0) {
    fail(where, 'declares no specs — nothing on its products can be filtered or compared');
  }
}

function checkProduct(product: PlannedProduct, check: Check, fail: Fail, problems: string[]): void {
  const where = whereProduct(product.categoryCode, product.code);
  const isRental = product.pricingMode === 'rental';

  check(
    CreateProductSchema,
    {
      categoryId: product.categoryId,
      status: product.status,
      brand: product.brand,
      pricingMode: product.pricingMode,
      basePrice: product.basePrice,
      marketingRate: product.marketingRate,
      currency: product.currency,
      rentalUnit: product.rentalUnit,
      ...(isRental ? { rentalPackages: product.rentalPackages } : {}),
      stock: product.stock,
      isFeatured: product.isFeatured,
      chips: product.chips,
      translations: wire(product.translations, 'title'),
    },
    where,
  );

  /* `RentalPackagesSchema` requires at least one, which is only true of a
     rental — a fixed product's list is legitimately empty, and `CreateProductSchema`
     only carries the field on a rental. Chips need no second pass: that schema
     checks them already, and running both reported every bad chip twice. */
  if (isRental) check(RentalPackagesSchema, product.rentalPackages, `${where} › packages`);

  for (const value of product.specValues) {
    /* `numeric(14,4)` keeps four decimals and rounds a fifth in silence, so a
       spec number passes the same gate a price does. Checked HERE rather than
       where the row is written, because `parseSpecNumber` throws and a throw
       during the write phase leaves a half-written catalogue. */
    for (const [field, amount] of [
      ['value', value.numberValue],
      ['min', value.numberMin],
      ['max', value.numberMax],
    ] as const) {
      if (amount === null) continue;
      try {
        parseSpecNumber(amount, `${where} \u203a spec "${value.specKey}" \u203a ${field}`);
      } catch (error) {
        problems.push((error as Error).message);
      }
    }

    check(
      SpecValueInputSchema,
      {
        specId: value.specId,
        numberValue: value.numberValue,
        numberMin: value.numberMin,
        numberMax: value.numberMax,
        booleanValue: value.booleanValue,
        textValue: value.textValue,
        optionIds: value.optionIds,
      },
      `${where} › spec "${value.specKey}"`,
    );
  }

  for (const addon of product.addons) {
    const at = `${where} › addon "${addon.name.it}"`;
    check(
      AddonInputSchema,
      {
        name: addon.name,
        description: addon.description,
        pricingMode: addon.pricingMode,
        price: addon.price,
        currency: addon.currency,
        rentalUnit: addon.rentalUnit,
        minQuantity: addon.minQuantity,
        maxQuantity: addon.maxQuantity,
        position: addon.position,
      },
      at,
    );
    // The one product-mode bound the type system cannot state: `FixedProductInput`
    // narrows `addons` to `FixedAddon[]`, but `ProductInput<SpecMap>` is a union
    // and the widened registry hands over the union.
    if (!isRental && addon.pricingMode === 'rental') {
      fail(at, 'a fixed-price product cannot carry a rental add-on — nothing is returned');
    }
    if (addon.pricingMode === 'rental' && addon.rentalUnit !== product.rentalUnit) {
      fail(at, `a rental add-on bills in the product's unit ("${String(product.rentalUnit)}")`);
    }
  }

  for (const faq of product.faqs) {
    check(
      FaqInputSchema,
      {
        question: faq.question,
        answer: faq.answer,
        position: faq.position,
        isActive: faq.isActive,
      },
      `${where} › FAQ "${faq.question.it.slice(0, 40)}"`,
    );
  }

  for (const question of product.questions) {
    check(
      QuestionInputSchema,
      {
        key: question.key,
        prompt: question.prompt,
        helpText: question.helpText,
        questionValueType: question.questionValueType,
        isRequired: question.isRequired,
        minValue: question.minValue,
        maxValue: question.maxValue,
        maxLength: question.maxLength,
        position: question.position,
        options: question.options.map((option) => ({
          value: option.value,
          label: option.label,
          position: option.position,
        })),
      },
      `${where} › question "${question.key}"`,
    );
  }
}

/**
 * Codes and slugs, across the whole registry. Two categories quietly claiming
 * the same slug is a unique-index failure halfway through a write, which is the
 * one failure mode a big sync must not have.
 */
function uniqueness(plan: CatalogPlan): string[] {
  const problems: string[] = [];
  const claim = (owners: Map<string, string>, key: string, owner: string, what: string): void => {
    const held = owners.get(key);
    if (held) problems.push(`${what} "${key}" is claimed by both ${held} and ${owner}`);
    else owners.set(key, owner);
  };

  const codes = new Map<string, string>();
  const ids = new Map<string, string>();
  const slugs = new Map<string, string>();
  const termsSlugs = new Map<string, string>();

  for (const document of plan.terms) {
    const owner = whereTerms(document.code);
    claim(codes, `terms:${document.code}`, owner, 'Terms code');
    for (const [lang, translation] of Object.entries(document.translations)) {
      claim(termsSlugs, `${lang}/${translation.slug}`, owner, 'Terms slug');
    }
  }
  for (const category of plan.categories) {
    const owner = whereCategory(category.code);
    claim(codes, `category:${category.code}`, owner, 'Category code');
    for (const [lang, translation] of Object.entries(category.translations)) {
      claim(slugs, `category/${lang}/${translation.slug}`, owner, 'Category slug');
    }
  }
  for (const product of plan.products) {
    const owner = whereProduct(product.categoryCode, product.code);
    claim(codes, `product:${product.code}`, owner, 'Product code');
    claim(ids, product.id, owner, 'Product id');
    for (const [lang, translation] of Object.entries(product.translations)) {
      claim(slugs, `product/${lang}/${translation.slug}`, owner, 'Product slug');
    }
  }
  return problems;
}

function missingAssets(plan: CatalogPlan): string[] {
  const problems: string[] = [];
  for (const category of plan.categories) {
    const where = whereCategory(category.code);
    if (category.icon && !category.icon.exists) {
      problems.push(`${where}: no file at ${category.icon.sourcePath}`);
    }
    for (const spec of category.specs) {
      if (spec.icon && !spec.icon.exists) {
        problems.push(`${where} › spec "${spec.key}": no file at ${spec.icon.sourcePath}`);
      }
    }
  }
  for (const product of plan.products) {
    const where = whereProduct(product.categoryCode, product.code);
    for (const item of product.media) {
      if (!item.asset.exists) problems.push(`${where}: no file at ${item.asset.sourcePath}`);
    }
  }
  return problems;
}
