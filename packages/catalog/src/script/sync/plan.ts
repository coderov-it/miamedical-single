/**
 * The entry point of the planning phase: every category in the registry becomes
 * one category row, its specs, and the products written against it. Terms
 * documents are planned alongside, not under a product — a document is a row
 * two products may both point at.
 *
 * Position is the order things are written in. A category's place in
 * `data/index.ts`, a spec's place in the `specs` object, a package's place in
 * the list: all of it is the file's own order, and none of it is a field
 * somebody has to keep in step.
 */
import type { Category, SpecMap, TermsDocument } from '../../lib/types.ts';
import { categoryId, specId, specOptionId, termsId } from './ids.ts';
import { planProduct } from './plan-product.ts';
import type { CatalogPlan, PlannedCategory, PlannedSpec, PlannedTerms } from './planned.ts';
import { assetResolverFor, fromCategory, planTranslations, type AssetResolver } from './resolve.ts';

export interface PlanInput {
  categories: readonly Category[];
  terms: readonly TermsDocument[];
  assetsRoot: string;
}

export function planCatalog(input: PlanInput): CatalogPlan {
  const plan: CatalogPlan = { categories: [], products: [], terms: [], problems: [] };

  for (const document of input.terms) plan.terms.push(planTerms(document));

  for (const [index, entry] of input.categories.entries()) {
    const authored = entry.input;
    const id = categoryId(authored.code);
    const asset = assetResolverFor(input.assetsRoot, authored.code);

    plan.categories.push({
      id,
      code: authored.code,
      position: authored.position ?? index,
      isActive: authored.isActive ?? true,
      requiresDeposit: authored.requiresDeposit ?? false,
      icon: asset(authored.icon),
      translations: planTranslations(authored.translations, fromCategory),
      specs: Object.entries(authored.specs as SpecMap).map(([key, spec], specIndex) =>
        planSpec(key, spec, specIndex, id, authored.code, asset),
      ),
    } satisfies PlannedCategory);

    for (const product of entry.products) {
      plan.products.push(planProduct(product, entry, id, input.assetsRoot, plan.problems));
    }
  }

  plan.problems.push(...unlinkedTerms(plan));
  return plan;
}

function planSpec(
  key: string,
  spec: SpecMap[string],
  index: number,
  categoryId: string,
  categoryCode: string,
  asset: AssetResolver,
): PlannedSpec {
  const options = 'options' in spec ? spec.options : {};
  const unit = 'unit' in spec ? spec.unit : undefined;

  return {
    id: specId(categoryCode, key),
    categoryId,
    categoryCode,
    key,
    label: spec.label,
    helpText: spec.helpText ?? null,
    valueType: spec.valueType,
    unit: unit ?? null,
    isRequired: spec.isRequired ?? false,
    isFilterable: spec.isFilterable ?? false,
    isComparable: spec.isComparable ?? false,
    icon: asset(spec.icon),
    position: index,
    options: Object.entries(options).map(([value, label], optionIndex) => ({
      id: specOptionId(categoryCode, key, value),
      value,
      label,
      position: optionIndex,
    })),
  };
}

function planTerms(document: TermsDocument): PlannedTerms {
  return {
    id: termsId(document.code),
    code: document.code,
    status: document.status ?? 'draft',
    version: document.version ?? 1,
    translations: Object.fromEntries(
      Object.entries(document.translations).map(([language, translation]) => [
        language,
        { title: translation.title, body: translation.body, slug: translation.slug },
      ]),
    ),
  };
}

/**
 * A product signing a document the registry does not list. `defineTerms` brands
 * the object so only a real document can be passed, but nothing forces the
 * author to also export it from `data/index.ts` — and an unlisted document has
 * no row, so `product_terms` would fail its foreign key mid-write.
 */
function unlinkedTerms(plan: CatalogPlan): string[] {
  const known = new Set(plan.terms.map((document) => document.id));
  const problems: string[] = [];
  for (const product of plan.products) {
    for (const id of product.termsIds) {
      if (known.has(id)) continue;
      problems.push(
        `${product.categoryCode} › product "${product.code}": links a terms document that ` +
          '`termsDocuments` in data/index.ts does not list',
      );
    }
  }
  return problems;
}
