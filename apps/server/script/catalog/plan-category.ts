/**
 * The entry point of the planning phase: every authored file becomes one
 * category, its specs, and the products inside it.
 *
 * Position defaults to the order things appear in the file — writing the specs
 * in the order they should read is enough, and `position` is only there for
 * when it has to disagree.
 */
import type { AuthoredSpec } from './authored.ts';
import { categoryId, specId, specOptionId } from './ids.ts';
import { planProduct } from './plan-product.ts';
import type { CatalogPlan, PlannedCategory, PlannedSpec } from './planned.ts';
import type { CatalogFile } from './read.ts';
import {
  assetResolverFor,
  localized,
  localizedOrNull,
  planTranslations,
  type AssetResolver,
} from './resolve.ts';

export function planCatalog(files: CatalogFile[], assetsRoot: string): CatalogPlan {
  const plan: CatalogPlan = { categories: [], products: [], problems: [] };

  for (const [index, file] of files.entries()) {
    const authored = file.category;
    const id = authored.id ?? categoryId(authored.code);
    const asset = assetResolverFor(assetsRoot, authored.code);

    const category: PlannedCategory = {
      id,
      code: authored.code,
      file: file.name,
      position: authored.position ?? index,
      isActive: authored.isActive ?? true,
      requiresDeposit: authored.requiresDeposit ?? false,
      icon: asset(authored.icon),
      translations: planTranslations(authored.name, authored.slug, {
        shortDescription: null,
        description: authored.description ?? null,
        metaTitle: authored.metaTitle ?? null,
        metaDescription: authored.metaDescription ?? null,
      }),
      specs: (authored.specs ?? []).map((spec, specIndex) =>
        planSpec(spec, specIndex, id, authored.code, asset),
      ),
    };
    plan.categories.push(category);

    for (const product of authored.products ?? []) {
      plan.products.push(planProduct(product, authored, id, file.name, assetsRoot, plan.problems));
    }
  }

  return plan;
}

function planSpec(
  spec: AuthoredSpec,
  index: number,
  categoryId: string,
  categoryCode: string,
  asset: AssetResolver,
): PlannedSpec {
  return {
    id: specId(categoryCode, spec.key),
    categoryId,
    categoryCode,
    key: spec.key,
    label: localized(spec.label),
    helpText: localizedOrNull(spec.helpText),
    valueType: spec.valueType,
    unit: spec.unit ?? null,
    isRequired: spec.isRequired ?? false,
    isFilterable: spec.isFilterable ?? false,
    isComparable: spec.isComparable ?? false,
    icon: asset(spec.icon),
    position: spec.position ?? index,
    options: (spec.options ?? []).map((option, optionIndex) => ({
      id: specOptionId(categoryCode, spec.key, option.value),
      value: option.value,
      label: localized(option.label),
      position: optionIndex,
    })),
  };
}
