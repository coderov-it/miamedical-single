import type { LanguageCode, Localized } from '@mia/db/schema';

// --- public ----------------------------------------------------------------

export interface PublicSpecOptionDto {
  id: string;
  value: string;
  label: string;
  position: number;
}

export interface PublicCategorySpecDto {
  id: string;
  key: string;
  label: string;
  helpText: string | null;
  valueType: string;
  unit: string | null;
  isRequired: boolean;
  isFilterable: boolean;
  isComparable: boolean;
  icon: string | null;
  position: number;
  options: PublicSpecOptionDto[];
}

export interface PublicCategoryDto {
  id: string;
  code: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  position: number;
  specs: PublicCategorySpecDto[];
}

// --- admin -----------------------------------------------------------------

export interface AdminCategoryTranslationDto {
  name: string;
  description: string | null;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
}

export interface AdminSpecOptionDto {
  id: string;
  value: string;
  label: Localized;
  position: number;
}

export interface AdminCategorySpecDto {
  id: string;
  key: string;
  label: Localized;
  helpText: Localized | null;
  valueType: string;
  unit: string | null;
  isRequired: boolean;
  isFilterable: boolean;
  isComparable: boolean;
  icon: string | null;
  position: number;
  options: AdminSpecOptionDto[];
}

export interface AdminCategoryDto {
  id: string;
  code: string;
  icon: string | null;
  position: number;
  isActive: boolean;
  translations: Partial<Record<LanguageCode, AdminCategoryTranslationDto>>;
  specs: AdminCategorySpecDto[];
  createdAt: string;
  updatedAt: string;
}
