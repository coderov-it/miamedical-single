import type { Database } from '@mia/db';
import { and, eq, inArray, notInArray, sql } from '@mia/db';
import {
  productSkuOptions,
  productSkus,
  productVariantGroups,
  productVariantOptions,
} from '@mia/db/schema';
import type { SkuUpdateInput, VariantGroupInput } from '@mia/validators';

import type { FileUploader } from '../../../infra/storage/port.ts';
import { httpError, notFound } from '../../../shared/http/errors.ts';
import { commitIcon } from '../media/service.ts';
import * as catalogRepo from '../catalog/repo.ts';
import { composeSku, generateCombinations, randomSuffix } from './sku.ts';

/**
 * Variant groups, options and the materialized SKU matrix.
 *
 * The editor PUTs the whole variant tree. Options referenced by existing SKUs
 * must keep their identity, so this is an upsert-by-id + delete-missing —
 * never a blind delete-and-recreate. SKUs whose combination loses an option
 * are deactivated, not deleted: historical SKUs stay resolvable.
 */

export async function replaceVariantGroups(
  db: Database,
  storage: FileUploader,
  productId: string,
  groups: VariantGroupInput[],
): Promise<void> {
  const product = await catalogRepo.findRow(db, productId);
  if (!product) throw notFound('Product');

  const existingGroups = await db.query.productVariantGroups.findMany({
    where: eq(productVariantGroups.productId, productId),
    with: { options: true },
  });
  const existingGroupById = new Map(existingGroups.map((group) => [group.id, group]));
  const existingOptionById = new Map(
    existingGroups.flatMap((group) => group.options.map((option) => [option.id, option])),
  );

  // Icons commit outside the transaction — object storage has no rollback.
  const iconByGroupIndex = new Map<number, string | null>();
  for (const [index, group] of groups.entries()) {
    const stored = group.id ? (existingGroupById.get(group.id)?.icon ?? null) : null;
    iconByGroupIndex.set(
      index,
      await commitIcon(storage, `variants/${productId}`, stored, group.icon, 'icon_256'),
    );
  }

  await db.transaction(async (tx) => {
    const keptGroupIds: string[] = [];
    const keptOptionIds: string[] = [];

    for (const [index, group] of groups.entries()) {
      const values = {
        productId,
        key: group.key,
        label: group.label,
        helpText: group.helpText ?? null,
        valueType: group.valueType,
        unit: group.unit ?? null,
        isRequired: group.isRequired,
        affectsSku: group.affectsSku,
        sourcePresetKey: group.sourcePresetKey ?? null,
        minValue: group.minValue == null ? null : String(group.minValue),
        maxValue: group.maxValue == null ? null : String(group.maxValue),
        stepValue: group.stepValue == null ? null : String(group.stepValue),
        priceModifierPerUnit: group.priceModifierPerUnit ?? null,
        icon: iconByGroupIndex.get(index) ?? null,
        position: group.position,
      };

      let groupId: string;
      if (group.id && existingGroupById.has(group.id)) {
        groupId = group.id;
        await tx
          .update(productVariantGroups)
          .set(values)
          .where(eq(productVariantGroups.id, groupId));
      } else {
        const [inserted] = await tx
          .insert(productVariantGroups)
          .values(values)
          .returning({ id: productVariantGroups.id });
        if (!inserted) throw new Error('Variant group insert returned no row.');
        groupId = inserted.id;
      }
      keptGroupIds.push(groupId);

      for (const option of group.options) {
        const optionValues = {
          groupId,
          value: option.value,
          label: option.label,
          skuCode: option.skuCode ?? null,
          priceModifier: option.priceModifier,
          isDefault: option.isDefault,
          position: option.position,
        };
        if (option.id && existingOptionById.get(option.id)?.groupId === groupId) {
          await tx
            .update(productVariantOptions)
            .set(optionValues)
            .where(eq(productVariantOptions.id, option.id));
          keptOptionIds.push(option.id);
        } else {
          const [inserted] = await tx
            .insert(productVariantOptions)
            .values(optionValues)
            .returning({ id: productVariantOptions.id });
          if (!inserted) throw new Error('Variant option insert returned no row.');
          keptOptionIds.push(inserted.id);
        }
      }
    }

    // Deactivate SKUs that reference an option about to disappear, then let
    // the deletes cascade the join rows.
    const removedOptionIds = [...existingOptionById.keys()].filter(
      (id) => !keptOptionIds.includes(id),
    );
    if (removedOptionIds.length > 0) {
      await tx
        .update(productSkus)
        .set({ isActive: false })
        .where(
          and(
            eq(productSkus.productId, productId),
            sql`${productSkus.id} IN (
              SELECT sku_id FROM ${productSkuOptions}
              WHERE option_id IN ${removedOptionIds}
            )`,
          ),
        );
      await tx
        .delete(productVariantOptions)
        .where(inArray(productVariantOptions.id, removedOptionIds));
    }

    const removedGroupIds = [...existingGroupById.keys()].filter(
      (id) => !keptGroupIds.includes(id),
    );
    if (removedGroupIds.length > 0) {
      await tx
        .delete(productVariantGroups)
        .where(inArray(productVariantGroups.id, removedGroupIds));
    }
  });

  // Delete replaced icons that belonged to removed groups.
  for (const group of existingGroups) {
    if (group.icon && !groups.some((g) => g.id === group.id)) {
      await storage.delete(group.icon).catch(() => undefined);
    }
  }
}

export interface GenerateResult {
  created: number;
  deactivated: number;
  total: number;
}

/**
 * Materialize the matrix: cartesian product of `affectsSku` groups, skipping
 * combinations already present, deactivating rows whose combination vanished.
 * Never deletes — a printed label must still resolve years later.
 */
export async function generateSkus(db: Database, productId: string): Promise<GenerateResult> {
  const product = await catalogRepo.findRow(db, productId);
  if (!product) throw notFound('Product');

  const groups = await db.query.productVariantGroups.findMany({
    where: eq(productVariantGroups.productId, productId),
    with: { options: true },
  });

  const combinations = generateCombinations(groups);
  if (combinations.length > 500) {
    throw httpError(422, 'The variant matrix exceeds 500 combinations.', 'matrix_too_large');
  }

  return db.transaction(async (tx) => {
    const existing = await tx.query.productSkus.findMany({
      where: eq(productSkus.productId, productId),
    });
    const existingByCombo = new Map(existing.map((sku) => [sku.comboKey, sku]));
    const currentCombos = new Set(combinations.map((combo) => combo.comboKey));

    let created = 0;
    for (const [index, combo] of combinations.entries()) {
      const present = existingByCombo.get(combo.comboKey);
      if (present) {
        // Reactivate a combination that came back.
        if (!present.isActive) {
          await tx
            .update(productSkus)
            .set({ isActive: true })
            .where(eq(productSkus.id, present.id));
        }
        continue;
      }

      // Suffix collision with the global unique(sku) is retried, not fatal.
      for (let attempt = 0; ; attempt++) {
        const suffix = randomSuffix();
        const sku = composeSku(product.baseSku, combo.codes, suffix);
        try {
          const [inserted] = await tx
            .insert(productSkus)
            .values({
              productId,
              sku,
              suffix,
              comboKey: combo.comboKey,
              position: index,
            })
            .returning({ id: productSkus.id });
          if (!inserted) throw new Error('SKU insert returned no row.');
          // The base combination has no options at all, and drizzle refuses an
          // empty VALUES list — there is simply nothing to link.
          if (combo.optionIds.length > 0) {
            const optionGroup = new Map(
              groups.flatMap((group) => group.options.map((option) => [option.id, group.id])),
            );
            await tx.insert(productSkuOptions).values(
              combo.optionIds.map((optionId) => ({
                skuId: inserted.id,
                optionId,
                groupId: optionGroup.get(optionId)!,
              })),
            );
          }
          created++;
          break;
        } catch (error) {
          if (attempt >= 4 || !isUniqueViolation(error)) throw error;
        }
      }
    }

    const [deactivated] = combinations.length
      ? await tx
          .update(productSkus)
          .set({ isActive: false })
          .where(
            and(
              eq(productSkus.productId, productId),
              notInArray(productSkus.comboKey, [...currentCombos]),
              eq(productSkus.isActive, true),
            ),
          )
          .returning({ id: productSkus.id })
          .then((rows) => [rows.length])
      : await tx
          .update(productSkus)
          .set({ isActive: false })
          .where(and(eq(productSkus.productId, productId), eq(productSkus.isActive, true)))
          .returning({ id: productSkus.id })
          .then((rows) => [rows.length]);

    return {
      created,
      deactivated: deactivated ?? 0,
      total: combinations.length,
    };
  });
}

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string })?.code === '23505';
}

export async function updateSku(
  db: Database,
  productId: string,
  skuId: string,
  input: SkuUpdateInput,
): Promise<void> {
  const [updated] = await db
    .update(productSkus)
    .set(input)
    .where(and(eq(productSkus.id, skuId), eq(productSkus.productId, productId)))
    .returning({ id: productSkus.id });
  if (!updated) throw notFound('SKU');
}
