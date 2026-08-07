import type { Database } from '@mia/db';
import { eq } from '@mia/db';
import { productQuestionOptions, productQuestions } from '@mia/db/schema';
import type { QuestionInput } from '@mia/validators';

import { notFound } from '../../../shared/http/errors.ts';
import * as catalogRepo from '../catalog/repo.ts';

/**
 * Intake questions the customer answers at order time. Order answers snapshot
 * the question text (orders module, later pass), so until then a wholesale
 * delete-and-insert is safe.
 */
export async function replaceQuestions(
  db: Database,
  productId: string,
  questions: QuestionInput[],
): Promise<void> {
  const product = await catalogRepo.findRow(db, productId);
  if (!product) throw notFound('Product');

  await db.transaction(async (tx) => {
    await tx.delete(productQuestions).where(eq(productQuestions.productId, productId));
    for (const question of questions) {
      const [inserted] = await tx
        .insert(productQuestions)
        .values({
          productId,
          key: question.key,
          prompt: question.prompt,
          helpText: question.helpText ?? null,
          questionValueType: question.questionValueType,
          isRequired: question.isRequired,
          minValue: question.minValue == null ? null : String(question.minValue),
          maxValue: question.maxValue == null ? null : String(question.maxValue),
          maxLength: question.maxLength ?? null,
          position: question.position,
        })
        .returning({ id: productQuestions.id });
      if (!inserted) throw new Error('Question insert returned no row.');

      if (question.options.length > 0) {
        await tx.insert(productQuestionOptions).values(
          question.options.map((option) => ({
            questionId: inserted.id,
            value: option.value,
            label: option.label,
            position: option.position,
          })),
        );
      }
    }
  });
}
