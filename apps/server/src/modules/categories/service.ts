import type { Database } from '@mia/db';
import { eq, inArray } from '@mia/db';
import type { LanguageCode } from '@mia/db/schema';
import { categorySpecOptions, categorySpecs } from '@mia/db/schema';
import type { CreateCategoryInput, SpecInput, UpdateCategoryInput } from '@mia/validators';

import type { FileUploader } from '../../infra/storage/port.ts';
import { conflict, httpError, notFound } from '../../shared/http/errors.ts';
import { commitIcon } from '../products/media/service.ts';
import * as repo from './repo.ts';
import type { CategoryAggregate } from './types.ts';

export async function listAll(db: Database, activeOnly: boolean): Promise<CategoryAggregate[]> {
  return repo.findAll(db, activeOnly);
}

export async function getById(db: Database, id: string): Promise<CategoryAggregate> {
  const category = await repo.findById(db, id);
  if (!category) throw notFound('Category');
  return category;
}

function normalizeTranslations(input: CreateCategoryInput['translations'] | undefined) {
  const result: Partial<Record<LanguageCode, repo.CategoryTranslationData>> = {};
  for (const lang of ['it', 'en'] as LanguageCode[]) {
    const t = input?.[lang];
    if (!t) continue;
    result[lang] = {
      name: t.name,
      description: t.description ?? null,
      slug: t.slug,
      metaTitle: t.metaTitle ?? null,
      metaDescription: t.metaDescription ?? null,
    };
  }
  return result;
}

export async function create(db: Database, storage: FileUploader, input: CreateCategoryInput) {
  if (await repo.existsByCode(db, input.code)) {
    throw conflict(`A category with code "${input.code}" already exists.`);
  }
  const id = await repo.create(db, {
    code: input.code,
    position: input.position,
    isActive: input.isActive,
    requiresDeposit: input.requiresDeposit,
    translations: normalizeTranslations(input.translations),
  });
  if (input.icon) {
    const icon = await commitIcon(storage, `categories/${id}`, null, input.icon, 'icon_256');
    await repo.update(db, id, { icon });
  }
  return getById(db, id);
}

export async function update(
  db: Database,
  storage: FileUploader,
  id: string,
  input: UpdateCategoryInput,
) {
  const existing = await repo.findById(db, id);
  if (!existing) throw notFound('Category');
  if (input.code && (await repo.existsByCode(db, input.code, id))) {
    throw conflict(`A category with code "${input.code}" already exists.`);
  }

  const data: repo.CategoryData = {};
  if (input.code !== undefined) data.code = input.code;
  if (input.position !== undefined) data.position = input.position;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.requiresDeposit !== undefined) data.requiresDeposit = input.requiresDeposit;
  if (input.translations !== undefined) {
    data.translations = normalizeTranslations(input.translations);
  }
  if (input.icon !== undefined) {
    data.icon = await commitIcon(
      storage,
      `categories/${id}`,
      existing.icon,
      input.icon,
      'icon_256',
    );
  }
  await repo.update(db, id, data);
  return getById(db, id);
}

export async function remove(db: Database, storage: FileUploader, id: string): Promise<void> {
  const existing = await repo.findById(db, id);
  if (!existing) throw notFound('Category');
  if (await repo.hasProducts(db, id)) {
    throw conflict('This category still has products. Move them first.');
  }
  await repo.remove(db, id);
  const icons = [existing.icon, ...existing.specs.map((spec) => spec.icon)].filter(
    (icon): icon is string => icon !== null,
  );
  await Promise.all(icons.map((icon) => storage.delete(icon).catch(() => undefined)));
}

/**
 * Wholesale replace of a category's spec definitions. Upsert-by-id — spec
 * rows are referenced by product values, so identity must survive the save.
 */
export async function replaceSpecs(
  db: Database,
  storage: FileUploader,
  categoryId: string,
  specs: SpecInput[],
): Promise<CategoryAggregate> {
  const existing = await repo.findById(db, categoryId);
  if (!existing) throw notFound('Category');

  const keys = specs.map((spec) => spec.key);
  if (new Set(keys).size !== keys.length) {
    throw httpError(422, 'Spec keys must be unique within the category.', 'validation_failed');
  }

  const existingById = new Map(existing.specs.map((spec) => [spec.id, spec]));
  const existingOptionById = new Map(
    existing.specs.flatMap((spec) => spec.options.map((option) => [option.id, option])),
  );

  // Icons commit outside the transaction — object storage has no rollback.
  const iconByIndex = new Map<number, string | null>();
  for (const [index, spec] of specs.entries()) {
    const stored = spec.id ? (existingById.get(spec.id)?.icon ?? null) : null;
    iconByIndex.set(
      index,
      await commitIcon(storage, `specs/${categoryId}`, stored, spec.icon, 'icon_256'),
    );
  }

  await db.transaction(async (tx) => {
    const keptSpecIds: string[] = [];
    const keptOptionIds: string[] = [];

    for (const [index, spec] of specs.entries()) {
      const values = {
        categoryId,
        key: spec.key,
        label: spec.label,
        helpText: spec.helpText ?? null,
        valueType: spec.valueType,
        unit: spec.unit ?? null,
        isRequired: spec.isRequired,
        isFilterable: spec.isFilterable,
        isComparable: spec.isComparable,
        icon: iconByIndex.get(index) ?? null,
        position: spec.position,
      };

      let specId: string;
      if (spec.id && existingById.has(spec.id)) {
        specId = spec.id;
        await tx.update(categorySpecs).set(values).where(eq(categorySpecs.id, specId));
      } else {
        const [inserted] = await tx
          .insert(categorySpecs)
          .values(values)
          .returning({ id: categorySpecs.id });
        if (!inserted) throw new Error('Spec insert returned no row.');
        specId = inserted.id;
      }
      keptSpecIds.push(specId);

      for (const option of spec.options) {
        const optionValues = {
          specId,
          value: option.value,
          label: option.label,
          position: option.position,
        };
        if (option.id && existingOptionById.get(option.id)?.specId === specId) {
          await tx
            .update(categorySpecOptions)
            .set(optionValues)
            .where(eq(categorySpecOptions.id, option.id));
          keptOptionIds.push(option.id);
        } else {
          const [inserted] = await tx
            .insert(categorySpecOptions)
            .values(optionValues)
            .returning({ id: categorySpecOptions.id });
          if (!inserted) throw new Error('Spec option insert returned no row.');
          keptOptionIds.push(inserted.id);
        }
      }
    }

    const removedOptionIds = [...existingOptionById.keys()].filter(
      (id) => !keptOptionIds.includes(id),
    );
    if (removedOptionIds.length > 0) {
      await tx.delete(categorySpecOptions).where(inArray(categorySpecOptions.id, removedOptionIds));
    }
    const removedSpecIds = [...existingById.keys()].filter((id) => !keptSpecIds.includes(id));
    if (removedSpecIds.length > 0) {
      await tx.delete(categorySpecs).where(inArray(categorySpecs.id, removedSpecIds));
    }
  });

  for (const spec of existing.specs) {
    if (spec.icon && !specs.some((s) => s.id === spec.id)) {
      await storage.delete(spec.icon).catch(() => undefined);
    }
  }

  return getById(db, categoryId);
}
