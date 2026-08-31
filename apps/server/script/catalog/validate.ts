/**
 * Everything checked before a single row is written, against the real API
 * schemas rather than bespoke ones — so `--dry-run` proves the data would
 * survive the admin panel's own contract, not a second opinion about it.
 *
 * Problems are collected, never thrown: one run reports every bad row in every
 * file, not the first. Cross-file uniqueness is checked here too, because two
 * categories quietly claiming the same slug is a unique-index failure halfway
 * through a write, which is the one failure mode a big import must not have.
 */
import {
  AddonInputSchema,
  CreateCategorySchema,
  CreateProductSchema,
  FaqInputSchema,
  ProductChipsSchema,
  QuestionInputSchema,
  RentalPackagesSchema,
  SpecInputSchema,
  SpecValueInputSchema,
} from '@mia/validators';
import * as v from 'valibot';

import type {
  CatalogPlan,
  PlannedCategory,
  PlannedProduct,
  PlannedTranslation,
  Translations,
} from './planned.ts';

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

  for (const category of plan.categories) checkCategory(category, check, fail);
  for (const product of plan.products) checkProduct(product, check, fail);

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
  const strip = ({ slugDerived: _ignored, title, shortDescription, ...rest }: PlannedTranslation) =>
    headline === 'title' ? { title, shortDescription, ...rest } : { name: title, ...rest };
  return {
    it: strip(translations.it!),
    ...(translations.en ? { en: strip(translations.en) } : {}),
  };
};

function checkCategory(category: PlannedCategory, check: Check, fail: Fail): void {
  const where = `${category.file}.json › category "${category.code}"`;

  // `icon` is deliberately absent: the schema wants an R2 key and the file
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

  const keys = new Set<string>();
  for (const spec of category.specs) {
    if (keys.has(spec.key)) fail(where, `two specs share the key "${spec.key}"`);
    keys.add(spec.key);
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
}

function checkProduct(product: PlannedProduct, check: Check, fail: Fail): void {
  const where = `${product.file}.json › product "${product.code}"`;
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
     rental — a fixed product's list is legitimately empty. */
  if (isRental) check(RentalPackagesSchema, product.rentalPackages, `${where} › packages`);
  else if (product.rentalPackages.length > 0) {
    fail(where, 'a fixed product carries rental packages — the database CHECK will reject it');
  }
  check(ProductChipsSchema, product.chips, `${where} › chips`);

  for (const value of product.specValues) {
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
    // The two product-mode bounds the addons service enforces, restated because
    // this writer bypasses that service and the DB CHECK only covers the first.
    if (!isRental && addon.pricingMode === 'rental') {
      fail(at, 'a fixed-price product cannot carry a rental add-on — nothing is returned');
    }
    if (addon.pricingMode === 'rental' && addon.rentalUnit !== product.rentalUnit) {
      fail(at, `a rental add-on bills in the product's unit ("${product.rentalUnit}")`);
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

/** Codes and slugs, across every file in the run. */
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

  for (const category of plan.categories) {
    for (const [lang, translation] of Object.entries(category.translations)) {
      claim(slugs, `${lang}/${translation.slug}`, `category ${category.code}`, 'Category slug');
    }
  }
  for (const product of plan.products) {
    const owner = `${product.file}.json › ${product.code}`;
    claim(codes, product.code, owner, 'Product code');
    claim(ids, product.id, owner, 'Product id');
    for (const [lang, translation] of Object.entries(product.translations)) {
      claim(slugs, `${lang}/${translation.slug}`, owner, 'Product slug');
    }
  }
  return problems;
}

function missingAssets(plan: CatalogPlan): string[] {
  const problems: string[] = [];
  for (const category of plan.categories) {
    if (category.icon && !category.icon.exists) {
      problems.push(
        `${category.file}.json › category "${category.code}": no file at ${category.icon.sourcePath}`,
      );
    }
    for (const spec of category.specs) {
      if (spec.icon && !spec.icon.exists) {
        problems.push(
          `${category.file}.json › spec "${spec.key}": no file at ${spec.icon.sourcePath}`,
        );
      }
    }
  }
  for (const product of plan.products) {
    const where = `${product.file}.json › product "${product.code}"`;
    for (const item of product.media) {
      if (!item.asset.exists) problems.push(`${where}: no file at ${item.asset.sourcePath}`);
    }
    for (const addon of product.addons) {
      if (addon.icon && !addon.icon.exists) {
        problems.push(`${where} › addon "${addon.name.it}": no file at ${addon.icon.sourcePath}`);
      }
    }
  }
  return problems;
}
