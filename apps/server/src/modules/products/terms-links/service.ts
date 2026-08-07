import type { Database } from '@mia/db';
import { eq, inArray } from '@mia/db';
import { productTerms, termsDocuments } from '@mia/db/schema';
import type { ProductTermsInput } from '@mia/validators';

import { httpError, notFound } from '../../../shared/http/errors.ts';
import * as catalogRepo from '../catalog/repo.ts';

/** Which terms documents a product links. Join rows only — content lives in modules/terms. */
export async function replaceTermsLinks(
  db: Database,
  productId: string,
  links: ProductTermsInput,
): Promise<void> {
  const product = await catalogRepo.findRow(db, productId);
  if (!product) throw notFound('Product');

  if (links.length > 0) {
    const ids = links.map((link) => link.termsId);
    const found = await db.query.termsDocuments.findMany({
      where: inArray(termsDocuments.id, ids),
      columns: { id: true },
    });
    if (found.length !== new Set(ids).size) {
      throw httpError(422, 'One of the linked terms documents does not exist.', 'invalid_terms');
    }
  }

  await db.transaction(async (tx) => {
    await tx.delete(productTerms).where(eq(productTerms.productId, productId));
    if (links.length > 0) {
      await tx.insert(productTerms).values(
        links.map((link) => ({
          productId,
          termsId: link.termsId,
          position: link.position,
        })),
      );
    }
  });
}
