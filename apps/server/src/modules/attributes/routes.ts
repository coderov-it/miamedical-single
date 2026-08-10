import type { Database } from '@mia/db';
import { asc, eq, inArray } from '@mia/db';
import { attributePresetOptions, attributePresets } from '@mia/db/schema';
import { P } from '@mia/permissions';
import {
  PresetIdParamSchema,
  PresetInputSchema,
  UpdatePresetSchema,
  type PresetInput,
  type UpdatePresetInput,
} from '@mia/validators';
import { Hono } from 'hono';

import { r2FileUploader } from '../../infra/storage/r2.ts';
import { requirePermission } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { conflict, notFound } from '../../shared/http/errors.ts';
import { validate } from '../../shared/http/validate.ts';
import { commitIcon } from '../products/media/service.ts';

/**
 * The attribute preset library — the toggleable "common variants" (height,
 * weight, material, colour, size, brand). A preset is *copied* into a product
 * as a variant group, icon included; nothing references it afterwards.
 */

type PresetAggregate = typeof attributePresets.$inferSelect & {
  options: (typeof attributePresetOptions.$inferSelect)[];
};

async function findById(db: Database, id: string): Promise<PresetAggregate> {
  const row = await db.query.attributePresets.findFirst({
    where: eq(attributePresets.id, id),
    with: { options: true },
  });
  if (!row) throw notFound('Attribute preset');
  return row;
}

function toDto(row: PresetAggregate) {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    valueType: row.valueType,
    unit: row.unit,
    isActive: row.isActive,
    icon: row.icon,
    position: row.position,
    options: row.options
      .sort((a, b) => a.position - b.position)
      .map((option) => ({
        id: option.id,
        value: option.value,
        label: option.label,
        skuCode: option.skuCode,
        position: option.position,
      })),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function replaceOptions(
  db: Database,
  presetId: string,
  options: PresetInput['options'],
  existing: PresetAggregate['options'],
): Promise<void> {
  const existingById = new Map(existing.map((option) => [option.id, option]));
  const keptIds: string[] = [];
  for (const option of options) {
    const values = {
      presetId,
      value: option.value,
      label: option.label,
      skuCode: option.skuCode ?? null,
      position: option.position,
    };
    if (option.id && existingById.has(option.id)) {
      await db
        .update(attributePresetOptions)
        .set(values)
        .where(eq(attributePresetOptions.id, option.id));
      keptIds.push(option.id);
    } else {
      const [inserted] = await db
        .insert(attributePresetOptions)
        .values(values)
        .returning({ id: attributePresetOptions.id });
      if (inserted) keptIds.push(inserted.id);
    }
  }
  const removed = existing.filter((option) => !keptIds.includes(option.id));
  if (removed.length > 0) {
    await db.delete(attributePresetOptions).where(
      inArray(
        attributePresetOptions.id,
        removed.map((option) => option.id),
      ),
    );
  }
}

export const attributeAdminRoutes = new Hono<AppEnv>()
  .get('/', requirePermission(P.ATTRIBUTE_READ), async (c) => {
    const rows = await c.get('db').query.attributePresets.findMany({
      orderBy: asc(attributePresets.position),
      with: { options: true },
    });
    return c.json({ data: rows.map(toDto) });
  })

  .post(
    '/',
    requirePermission(P.ATTRIBUTE_CREATE),
    validate('json', PresetInputSchema),
    async (c) => {
      const db = c.get('db');
      const input: PresetInput = c.req.valid('json');

      const existing = await db.query.attributePresets.findFirst({
        where: eq(attributePresets.key, input.key),
        columns: { id: true },
      });
      if (existing) throw conflict(`A preset with key "${input.key}" already exists.`);

      const [created] = await db
        .insert(attributePresets)
        .values({
          key: input.key,
          label: input.label,
          valueType: input.valueType,
          unit: input.unit ?? null,
          isActive: input.isActive,
          position: input.position,
        })
        .returning({ id: attributePresets.id });
      if (!created) throw new Error('Preset insert returned no row.');

      if (input.icon) {
        const icon = await commitIcon(
          r2FileUploader,
          `presets/${created.id}`,
          null,
          input.icon,
          'icon_256',
        );
        await db.update(attributePresets).set({ icon }).where(eq(attributePresets.id, created.id));
      }
      await replaceOptions(db, created.id, input.options, []);

      return c.json({ data: toDto(await findById(db, created.id)) }, 201);
    },
  )

  .patch(
    '/:id',
    requirePermission(P.ATTRIBUTE_UPDATE),
    validate('param', PresetIdParamSchema),
    validate('json', UpdatePresetSchema),
    async (c) => {
      const db = c.get('db');
      const { id } = c.req.valid('param');
      const input: UpdatePresetInput = c.req.valid('json');
      const existing = await findById(db, id);

      if (input.key !== undefined && input.key !== existing.key) {
        const clash = await db.query.attributePresets.findFirst({
          where: eq(attributePresets.key, input.key),
          columns: { id: true },
        });
        if (clash) throw conflict(`A preset with key "${input.key}" already exists.`);
      }

      const values: Partial<typeof attributePresets.$inferInsert> = {};
      if (input.key !== undefined) values.key = input.key;
      if (input.label !== undefined) values.label = input.label;
      if (input.valueType !== undefined) values.valueType = input.valueType;
      if (input.unit !== undefined) values.unit = input.unit;
      if (input.isActive !== undefined) values.isActive = input.isActive;
      if (input.position !== undefined) values.position = input.position;
      if (input.icon !== undefined) {
        values.icon = await commitIcon(
          r2FileUploader,
          `presets/${id}`,
          existing.icon,
          input.icon,
          'icon_256',
        );
      }
      await db.update(attributePresets).set(values).where(eq(attributePresets.id, id));

      if (input.options !== undefined) {
        await replaceOptions(db, id, input.options, existing.options);
      }
      return c.json({ data: toDto(await findById(db, id)) });
    },
  )

  .delete(
    '/:id',
    requirePermission(P.ATTRIBUTE_DELETE),
    validate('param', PresetIdParamSchema),
    async (c) => {
      const db = c.get('db');
      const { id } = c.req.valid('param');
      const existing = await findById(db, id);
      await db.delete(attributePresets).where(eq(attributePresets.id, id));
      if (existing.icon) await r2FileUploader.delete(existing.icon).catch(() => undefined);
      return c.json({ data: { deleted: true } });
    },
  );
