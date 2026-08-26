/**
 * Everything checked before a single row is written, against the real API
 * schemas rather than bespoke ones — so `--dry-run` proves the data would
 * survive the admin's own contract, not a second opinion about it.
 *
 * Problems are collected, not thrown: one run should report every bad row, not
 * the first. Cross-references are checked here too, because a chunk pointing at
 * a row no other chunk contains is the failure mode a scoped load invites.
 */
import {
  CreateProductSchema,
  RentalPackagesSchema,
  SpecValueInputSchema,
  VariantGroupInputSchema,
} from '@mia/validators';
import * as v from 'valibot';

import type { LoadPlan } from '../types.ts';

/** Returns every problem found; empty means the plan is safe to write. */
export function validatePlan(plan: LoadPlan): string[] {
  const problems: string[] = [];
  const fail = (where: string, detail: string): void => {
    problems.push(`${where}: ${detail}`);
  };

  const check = <TSchema extends v.GenericSchema>(
    schema: TSchema,
    value: unknown,
    where: string,
  ): boolean => {
    const result = v.safeParse(schema, value);
    if (result.success) return true;
    for (const issue of result.issues) {
      const path = issue.path?.map((segment) => String(segment.key)).join('.') ?? '';
      fail(where, `${path ? `${path}: ` : ''}${issue.message}`);
    }
    return false;
  };

  const categoryIds = new Set(plan.categories.map((chunk) => chunk.id));
  const productIds = new Set(plan.products.map((chunk) => chunk.id));
  const specIds = new Set(plan.specs.map((chunk) => chunk.id));
  const specOptionIds = new Set(plan.specs.flatMap((chunk) => chunk.options.map((o) => o.id)));

  for (const chunk of plan.products) {
    const where = `product ${chunk.wpPostId} (${chunk.translation.title.slice(0, 40)})`;
    if (!categoryIds.has(chunk.categoryId))
      fail(where, `categoryId ${chunk.categoryId} not in chunk 01`);

    // The create contract covers every column this loader writes except media
    // and packages, which have schemas of their own.
    check(
      CreateProductSchema,
      {
        baseSku: chunk.baseSku,
        categoryId: chunk.categoryId,
        status: chunk.status,
        brand: chunk.brand,
        pricingMode: chunk.pricingMode,
        basePrice: chunk.basePrice,
        marketingRate: chunk.marketingRate,
        currency: chunk.currency,
        rentalUnit: chunk.rentalUnit,
        rentalPackages: chunk.pricingMode === 'rental' ? chunk.rentalPackages : undefined,
        isFeatured: chunk.isFeatured,
        translations: { it: chunk.translation },
      },
      where,
    );
    /* `RentalPackagesSchema` requires at least one, which is only true of a
       rental — a fixed product's list is legitimately empty. */
    if (chunk.pricingMode === 'rental') {
      check(RentalPackagesSchema, chunk.rentalPackages, `${where} packages`);
    } else if (chunk.rentalPackages.length > 0) {
      fail(where, 'fixed product carries rental packages — the database CHECK will reject it');
    }
  }

  for (const chunk of plan.variantGroups) {
    const where = `variant group ${chunk.key} on product ${chunk.wpPostId}`;
    if (!productIds.has(chunk.productId)) fail(where, 'productId not in chunk 03');
    check(
      VariantGroupInputSchema,
      {
        key: chunk.key,
        label: chunk.label,
        valueType: chunk.valueType,
        unit: chunk.unit,
        isRequired: chunk.isRequired,
        affectsSku: chunk.affectsSku,
        position: chunk.position,
        options: chunk.options.map((option) => ({
          value: option.value,
          label: option.label,
          skuCode: option.skuCode,
          priceModifier: option.priceModifier,
          isDefault: option.isDefault,
          position: option.position,
        })),
      },
      where,
    );
  }

  for (const chunk of plan.specValues) {
    const where = `spec value ${chunk.categoryCode}/${chunk.specKey} on product ${chunk.wpPostId}`;
    if (!productIds.has(chunk.productId)) fail(where, 'productId not in chunk 03');
    if (!specIds.has(chunk.specId)) fail(where, 'specId not in chunk 02');
    for (const optionId of chunk.optionIds) {
      if (!specOptionIds.has(optionId)) fail(where, `optionId ${optionId} not in chunk 02`);
    }
    check(
      SpecValueInputSchema,
      {
        specId: chunk.specId,
        numberValue: chunk.numberValue,
        numberMin: chunk.numberMin,
        numberMax: chunk.numberMax,
        booleanValue: chunk.booleanValue,
        textValue: chunk.textValue,
        optionIds: chunk.optionIds,
      },
      where,
    );
  }

  for (const chunk of plan.media) {
    if (!productIds.has(chunk.productId)) {
      fail(`media ${chunk.wpAttachmentId}`, 'productId not in chunk 03');
    }
  }

  return problems;
}
