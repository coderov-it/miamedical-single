import type {
  categories,
  categorySpecOptions,
  categorySpecs,
  categoryTranslations,
} from '@mia/db/schema';

export type CategoryRow = typeof categories.$inferSelect;
export type CategoryTranslationRow = typeof categoryTranslations.$inferSelect;
export type SpecRow = typeof categorySpecs.$inferSelect;
export type SpecOptionRow = typeof categorySpecOptions.$inferSelect;

export interface SpecWithOptions extends SpecRow {
  options: SpecOptionRow[];
}

export interface CategoryAggregate extends CategoryRow {
  translations: CategoryTranslationRow[];
  specs: SpecWithOptions[];
}
