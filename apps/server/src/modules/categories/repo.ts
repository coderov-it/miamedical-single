import type { Database } from '@mia/db';
import { asc, eq } from '@mia/db';
import type { LanguageCode } from '@mia/db/schema';
import {
  categories,
  categorySpecOptions,
  categorySpecs,
  categoryTranslations,
  products,
  searchVectorFor,
} from '@mia/db/schema';

import type { CategoryAggregate } from './types.ts';

export interface CategoryTranslationData {
  name: string;
  description: string | null;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
}

const AGGREGATE_WITH = {
  translations: true,
  specs: { with: { options: true } },
} as const;

export async function findAll(db: Database, activeOnly: boolean): Promise<CategoryAggregate[]> {
  const rows = await db.query.categories.findMany({
    where: activeOnly ? eq(categories.isActive, true) : undefined,
    orderBy: asc(categories.position),
    with: AGGREGATE_WITH,
  });
  return rows as CategoryAggregate[];
}

export async function findById(db: Database, id: string): Promise<CategoryAggregate | undefined> {
  const row = await db.query.categories.findFirst({
    where: eq(categories.id, id),
    with: AGGREGATE_WITH,
  });
  return row as CategoryAggregate | undefined;
}

export async function existsByCode(
  db: Database,
  code: string,
  excludeId?: string,
): Promise<boolean> {
  const row = await db.query.categories.findFirst({
    where: eq(categories.code, code),
    columns: { id: true },
  });
  return row !== undefined && row.id !== excludeId;
}

export async function hasProducts(db: Database, categoryId: string): Promise<boolean> {
  const row = await db.query.products.findFirst({
    where: eq(products.categoryId, categoryId),
    columns: { id: true },
  });
  return row !== undefined;
}

function translationInsert(
  categoryId: string,
  languageCode: LanguageCode,
  data: CategoryTranslationData,
) {
  return {
    categoryId,
    languageCode,
    name: data.name,
    description: data.description,
    slug: data.slug,
    metaTitle: data.metaTitle,
    metaDescription: data.metaDescription,
    searchVector: searchVectorFor(languageCode, data.name, data.description) as unknown as string,
  };
}

export interface CategoryData {
  code?: string;
  icon?: string | null;
  position?: number;
  isActive?: boolean;
  requiresDeposit?: boolean;
  translations?: Partial<Record<LanguageCode, CategoryTranslationData>>;
}

export async function create(
  db: Database,
  data: Required<Pick<CategoryData, 'code'>> & CategoryData,
): Promise<string> {
  return db.transaction(async (tx) => {
    const [category] = await tx
      .insert(categories)
      .values({
        code: data.code,
        icon: data.icon ?? null,
        position: data.position ?? 0,
        isActive: data.isActive ?? true,
        requiresDeposit: data.requiresDeposit ?? false,
      })
      .returning({ id: categories.id });
    if (!category) throw new Error('Category insert returned no row.');

    for (const [lang, translation] of Object.entries(data.translations ?? {})) {
      if (!translation) continue;
      await tx
        .insert(categoryTranslations)
        .values(translationInsert(category.id, lang as LanguageCode, translation));
    }
    return category.id;
  });
}

export async function update(db: Database, id: string, data: CategoryData): Promise<void> {
  await db.transaction(async (tx) => {
    const { translations, ...columns } = data;
    if (Object.keys(columns).length > 0) {
      await tx.update(categories).set(columns).where(eq(categories.id, id));
    } else {
      await tx.update(categories).set({ updatedAt: new Date() }).where(eq(categories.id, id));
    }
    for (const [lang, translation] of Object.entries(translations ?? {})) {
      if (!translation) continue;
      const values = translationInsert(id, lang as LanguageCode, translation);
      await tx
        .insert(categoryTranslations)
        .values(values)
        .onConflictDoUpdate({
          target: [categoryTranslations.categoryId, categoryTranslations.languageCode],
          set: {
            name: values.name,
            description: values.description,
            slug: values.slug,
            metaTitle: values.metaTitle,
            metaDescription: values.metaDescription,
            searchVector: values.searchVector,
          },
        });
    }
  });
}

export async function remove(db: Database, id: string): Promise<void> {
  await db.delete(categories).where(eq(categories.id, id));
}

export { categorySpecOptions, categorySpecs };
