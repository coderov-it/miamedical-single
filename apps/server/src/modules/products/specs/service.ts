import type { Database } from '@mia/db';
import { eq, inArray } from '@mia/db';
import { categorySpecs, productSpecValueOptions, productSpecValues } from '@mia/db/schema';
import type { SpecValueInput } from '@mia/validators';

import { httpError, notFound } from '../../../shared/http/errors.ts';
import * as catalogRepo from '../catalog/repo.ts';

/**
 * A product's answers to its category's spec definitions. The editor PUTs the
 * whole set; values are validated against the category (a spec from another
 * category is a contract error) and select answers against the spec's options.
 */
export async function replaceSpecValues(
  db: Database,
  productId: string,
  values: SpecValueInput[],
): Promise<void> {
  const product = await catalogRepo.findRow(db, productId);
  if (!product) throw notFound('Product');

  const specs = await db.query.categorySpecs.findMany({
    where: eq(categorySpecs.categoryId, product.categoryId),
    with: { options: true },
  });
  const specById = new Map(specs.map((spec) => [spec.id, spec]));

  for (const value of values) {
    const spec = specById.get(value.specId);
    if (!spec) {
      throw httpError(422, 'Spec does not belong to this product’s category.', 'invalid_spec');
    }
    const optionIds = new Set(spec.options.map((option) => option.id));
    for (const optionId of value.optionIds) {
      if (!optionIds.has(optionId)) {
        throw httpError(422, 'Option does not belong to this spec.', 'invalid_spec');
      }
    }
  }

  await db.transaction(async (tx) => {
    await tx.delete(productSpecValues).where(eq(productSpecValues.productId, productId));
    await tx
      .delete(productSpecValueOptions)
      .where(eq(productSpecValueOptions.productId, productId));

    for (const value of values) {
      const spec = specById.get(value.specId)!;
      const isSelect = spec.valueType === 'single_select' || spec.valueType === 'multi_select';

      if (!isSelect) {
        await tx.insert(productSpecValues).values({
          productId,
          specId: value.specId,
          numberValue: value.numberValue == null ? null : String(value.numberValue),
          numberMin: value.numberMin == null ? null : String(value.numberMin),
          numberMax: value.numberMax == null ? null : String(value.numberMax),
          booleanValue: value.booleanValue ?? null,
          textValue: value.textValue ?? null,
        });
      }
      if (value.optionIds.length > 0) {
        const ids =
          spec.valueType === 'single_select' ? value.optionIds.slice(0, 1) : value.optionIds;
        await tx
          .insert(productSpecValueOptions)
          .values(ids.map((optionId) => ({ productId, specId: value.specId, optionId })));
      }
    }
  });
}

/** After a category change, values pointing at the old category's specs are dropped. */
export async function pruneForCategory(db: Database, productId: string): Promise<void> {
  const product = await catalogRepo.findRow(db, productId);
  if (!product) return;
  const specs = await db.query.categorySpecs.findMany({
    where: eq(categorySpecs.categoryId, product.categoryId),
    columns: { id: true },
  });
  const validIds = specs.map((spec) => spec.id);

  await db.transaction(async (tx) => {
    const values = await tx.query.productSpecValues.findMany({
      where: eq(productSpecValues.productId, productId),
      columns: { id: true, specId: true },
    });
    const links = await tx.query.productSpecValueOptions.findMany({
      where: eq(productSpecValueOptions.productId, productId),
      columns: { specId: true, optionId: true },
    });

    const staleValueIds = values
      .filter((value) => !validIds.includes(value.specId))
      .map((value) => value.id);
    if (staleValueIds.length > 0) {
      await tx.delete(productSpecValues).where(inArray(productSpecValues.id, staleValueIds));
    }
    const staleSpecIds = [
      ...new Set(links.map((l) => l.specId).filter((specId) => !validIds.includes(specId))),
    ];
    if (staleSpecIds.length > 0) {
      await tx
        .delete(productSpecValueOptions)
        .where(inArray(productSpecValueOptions.specId, staleSpecIds));
    }
  });
}
