import type { LanguageCode } from '@mia/db/schema';

import { pick, pickOptional, pickTranslation } from '../products/i18n.ts';
import type {
  AdminCategoryDto,
  AdminCategoryTranslationDto,
  PublicCategoryDto,
  PublicCategorySummaryDto,
} from './dto.ts';
import type { CategorySummaryRow } from './repo.ts';
import type { CategoryAggregate } from './types.ts';

/** A category nothing has been published into yet — zero products, no price. */
const EMPTY_SUMMARY: PublicCategorySummaryDto = {
  productCount: 0,
  fromPrice: null,
  currency: null,
  pricingMode: null,
  rentalUnit: null,
};

export function toPublicCategory(
  row: CategoryAggregate,
  locale: LanguageCode,
  summary?: CategorySummaryRow,
): PublicCategoryDto {
  const translation = pickTranslation(row.translations, locale);
  return {
    id: row.id,
    code: row.code,
    slug: translation?.slug ?? row.code,
    name: translation?.name ?? row.code,
    description: translation?.description ?? null,
    icon: row.icon,
    position: row.position,
    summary: summary
      ? {
          productCount: summary.productCount,
          fromPrice: summary.fromPrice,
          currency: summary.currency,
          pricingMode: summary.pricingMode,
          rentalUnit: summary.rentalUnit,
        }
      : EMPTY_SUMMARY,
    specs: row.specs
      .sort((a, b) => a.position - b.position)
      .map((spec) => ({
        id: spec.id,
        key: spec.key,
        label: pick(spec.label, locale),
        helpText: pickOptional(spec.helpText, locale),
        valueType: spec.valueType,
        unit: spec.unit,
        isRequired: spec.isRequired,
        isFilterable: spec.isFilterable,
        isComparable: spec.isComparable,
        icon: spec.icon,
        position: spec.position,
        options: spec.options
          .sort((a, b) => a.position - b.position)
          .map((option) => ({
            id: option.id,
            value: option.value,
            label: pick(option.label, locale),
            position: option.position,
          })),
      })),
  };
}

export function toAdminCategory(row: CategoryAggregate): AdminCategoryDto {
  const translations: Partial<Record<LanguageCode, AdminCategoryTranslationDto>> = {};
  for (const t of row.translations) {
    translations[t.languageCode] = {
      name: t.name,
      description: t.description,
      slug: t.slug,
      metaTitle: t.metaTitle,
      metaDescription: t.metaDescription,
    };
  }
  return {
    id: row.id,
    code: row.code,
    icon: row.icon,
    position: row.position,
    isActive: row.isActive,
    requiresDeposit: row.requiresDeposit,
    translations,
    specs: row.specs
      .sort((a, b) => a.position - b.position)
      .map((spec) => ({
        id: spec.id,
        key: spec.key,
        label: spec.label,
        helpText: spec.helpText,
        valueType: spec.valueType,
        unit: spec.unit,
        isRequired: spec.isRequired,
        isFilterable: spec.isFilterable,
        isComparable: spec.isComparable,
        icon: spec.icon,
        position: spec.position,
        options: spec.options
          .sort((a, b) => a.position - b.position)
          .map((option) => ({
            id: option.id,
            value: option.value,
            label: option.label,
            position: option.position,
          })),
      })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
