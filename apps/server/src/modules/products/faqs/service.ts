import type { Database } from '@mia/db';
import { eq } from '@mia/db';
import { productFaqs } from '@mia/db/schema';
import type { FaqInput } from '@mia/validators';

import { notFound } from '../../../shared/http/errors.ts';
import * as catalogRepo from '../catalog/repo.ts';

/**
 * FAQs are pure content — nothing references them — so the wholesale replace
 * really is delete-and-insert.
 */
export async function replaceFaqs(
  db: Database,
  productId: string,
  faqs: FaqInput[],
): Promise<void> {
  const product = await catalogRepo.findRow(db, productId);
  if (!product) throw notFound('Product');

  await db.transaction(async (tx) => {
    await tx.delete(productFaqs).where(eq(productFaqs.productId, productId));
    if (faqs.length > 0) {
      await tx.insert(productFaqs).values(
        faqs.map((faq) => ({
          productId,
          question: faq.question,
          answer: faq.answer,
          position: faq.position,
          isActive: faq.isActive,
        })),
      );
    }
  });
}
