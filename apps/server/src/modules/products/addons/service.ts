import type { Database } from '@mia/db';
import { eq, inArray } from '@mia/db';
import { productAddons } from '@mia/db/schema';
import type { AddonInput } from '@mia/validators';

import type { FileUploader } from '../../../infra/storage/port.ts';
import { httpError, notFound } from '../../../shared/http/errors.ts';
import { commitIcon } from '../media/service.ts';
import * as catalogRepo from '../catalog/repo.ts';

/**
 * Product addons — the optional extras. The one rule that matters:
 *
 *   rental product → rental and fixed addons
 *   fixed product  → fixed addons only
 *
 * A rental addon on a sold product is meaningless — nothing comes back and
 * there is no period to bill against. The service rejects it with a message;
 * the CHECK constraint plus composite FK reject it even on a raw INSERT.
 */
export async function replaceAddons(
  db: Database,
  storage: FileUploader,
  productId: string,
  addons: AddonInput[],
): Promise<void> {
  const product = await catalogRepo.findRow(db, productId);
  if (!product) throw notFound('Product');

  if (product.pricingMode === 'fixed' && addons.some((addon) => addon.pricingMode === 'rental')) {
    throw httpError(
      422,
      'A fixed-price product cannot have rental addons — nothing is returned, so there is no period to bill.',
      'invalid_addon_mode',
    );
  }

  const existing = await db.query.productAddons.findMany({
    where: eq(productAddons.productId, productId),
  });
  const existingById = new Map(existing.map((addon) => [addon.id, addon]));

  // Icons commit outside the transaction — object storage has no rollback.
  const iconByIndex = new Map<number, string | null>();
  for (const [index, addon] of addons.entries()) {
    const stored = addon.id ? (existingById.get(addon.id)?.icon ?? null) : null;
    iconByIndex.set(
      index,
      await commitIcon(storage, `addons/${productId}`, stored, addon.icon, 'icon_1024'),
    );
  }

  await db.transaction(async (tx) => {
    const keptIds: string[] = [];
    for (const [index, addon] of addons.entries()) {
      const values = {
        productId,
        name: addon.name,
        description: addon.description ?? null,
        sku: addon.sku ?? null,
        pricingMode: addon.pricingMode,
        productPricingMode: product.pricingMode,
        price: addon.price,
        currency: addon.currency,
        rentalUnit: addon.rentalUnit ?? null,
        minQuantity: addon.minQuantity,
        maxQuantity: addon.maxQuantity ?? null,
        isRequired: addon.isRequired,
        icon: iconByIndex.get(index) ?? null,
        position: addon.position,
      };
      if (addon.id && existingById.has(addon.id)) {
        await tx.update(productAddons).set(values).where(eq(productAddons.id, addon.id));
        keptIds.push(addon.id);
      } else {
        const [inserted] = await tx
          .insert(productAddons)
          .values(values)
          .returning({ id: productAddons.id });
        if (!inserted) throw new Error('Addon insert returned no row.');
        keptIds.push(inserted.id);
      }
    }

    const removed = existing.filter((addon) => !keptIds.includes(addon.id));
    if (removed.length > 0) {
      await tx.delete(productAddons).where(
        inArray(
          productAddons.id,
          removed.map((addon) => addon.id),
        ),
      );
    }
  });

  // Removed addons lose their icon objects — after the rows are gone.
  for (const addon of existing) {
    if (addon.icon && !addons.some((a) => a.id === addon.id)) {
      await storage.delete(addon.icon).catch(() => undefined);
    }
  }
}
