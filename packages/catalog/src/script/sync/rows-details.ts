/**
 * The detail rows a product owns: typed spec values, add-ons, FAQs and intake
 * questions. Each list in the data file replaces the list in the database — see
 * the note on reconciliation in `rows.ts`.
 *
 * Runs after `writeCategories`, because every row here points at a product and
 * at a spec that must already exist.
 */
import type { Database } from '@mia/db';
import { and, eq } from '@mia/db';
import {
  productAddons,
  productFaqs,
  productQuestionOptions,
  productQuestions,
  productSpecValueOptions,
  productSpecValues,
} from '@mia/db/schema';

import { parseSpecNumber } from '../../lib/money.ts';
import type { CatalogPlan, PlannedProduct } from './planned.ts';
import { whereProduct } from './planned.ts';
import { prune } from './rows.ts';

export interface DetailCounts {
  specValues: number;
  addons: number;
  faqs: number;
  questions: number;
  deleted: number;
}

export async function writeDetails(db: Database, plan: CatalogPlan): Promise<DetailCounts> {
  const counts: DetailCounts = { specValues: 0, addons: 0, faqs: 0, questions: 0, deleted: 0 };

  for (const product of plan.products) {
    counts.deleted += await writeSpecValues(db, product);
    counts.specValues += product.specValues.length;

    counts.deleted += await writeAddons(db, product);
    counts.addons += product.addons.length;

    counts.deleted += await writeFaqs(db, product);
    counts.faqs += product.faqs.length;

    counts.deleted += await writeQuestions(db, product);
    counts.questions += product.questions.length;
  }

  return counts;
}

/**
 * Values, plus the option join rows that make select facets index-backed. The
 * value row is keyed on `(product, spec)` rather than its own id, so a product
 * that changes a spec's value updates one row instead of accumulating them.
 */
async function writeSpecValues(db: Database, product: PlannedProduct): Promise<number> {
  let deleted = 0;

  for (const value of product.specValues) {
    /* `numeric(14,4)` rounds a fifth decimal without a word, exactly as the
       money columns do — so a spec number passes the same gate a price does
       rather than `String(…)`, which would let the rounded figure through. */
    const where = `${whereProduct(product.categoryCode, product.code)} \u203a spec "${value.specKey}"`;
    const decimal = (amount: number | null, field: string): string | null =>
      amount === null ? null : parseSpecNumber(amount, `${where} \u203a ${field}`);
    const numbers = {
      numberValue: decimal(value.numberValue, 'value'),
      numberMin: decimal(value.numberMin, 'min'),
      numberMax: decimal(value.numberMax, 'max'),
    };
    await db
      .insert(productSpecValues)
      .values({
        productId: product.id,
        specId: value.specId,
        ...numbers,
        booleanValue: value.booleanValue,
        textValue: value.textValue,
      })
      .onConflictDoUpdate({
        target: [productSpecValues.productId, productSpecValues.specId],
        set: { ...numbers, booleanValue: value.booleanValue, textValue: value.textValue },
      });

    for (const optionId of value.optionIds) {
      await db
        .insert(productSpecValueOptions)
        .values({ productId: product.id, specId: value.specId, optionId })
        .onConflictDoNothing();
    }
    deleted += await prune(
      db,
      productSpecValueOptions,
      and(
        eq(productSpecValueOptions.productId, product.id),
        eq(productSpecValueOptions.specId, value.specId),
      )!,
      productSpecValueOptions.optionId,
      value.optionIds,
    );
  }

  deleted += await prune(
    db,
    productSpecValues,
    eq(productSpecValues.productId, product.id),
    productSpecValues.specId,
    product.specValues.map((value) => value.specId),
  );
  return deleted;
}

async function writeAddons(db: Database, product: PlannedProduct): Promise<number> {
  for (const addon of product.addons) {
    const columns = {
      productId: product.id,
      name: addon.name,
      description: addon.description,
      pricingMode: addon.pricingMode,
      // The denormalised copy the composite FK keeps provably in sync.
      productPricingMode: product.pricingMode,
      price: addon.price,
      currency: addon.currency,
      rentalUnit: addon.rentalUnit,
      minQuantity: addon.minQuantity,
      maxQuantity: addon.maxQuantity,
      position: addon.position,
    };
    await db
      .insert(productAddons)
      .values({ id: addon.id, ...columns })
      // `icon` stays out of the SET list — the media pass owns that column.
      .onConflictDoUpdate({ target: productAddons.id, set: columns });
  }

  return prune(
    db,
    productAddons,
    eq(productAddons.productId, product.id),
    productAddons.id,
    product.addons.map((addon) => addon.id),
  );
}

async function writeFaqs(db: Database, product: PlannedProduct): Promise<number> {
  for (const faq of product.faqs) {
    const columns = {
      productId: product.id,
      question: faq.question,
      answer: faq.answer,
      position: faq.position,
      isActive: faq.isActive,
    };
    await db
      .insert(productFaqs)
      .values({ id: faq.id, ...columns })
      .onConflictDoUpdate({ target: productFaqs.id, set: columns });
  }

  return prune(
    db,
    productFaqs,
    eq(productFaqs.productId, product.id),
    productFaqs.id,
    product.faqs.map((faq) => faq.id),
  );
}

async function writeQuestions(db: Database, product: PlannedProduct): Promise<number> {
  let deleted = 0;

  for (const question of product.questions) {
    const columns = {
      productId: product.id,
      key: question.key,
      prompt: question.prompt,
      helpText: question.helpText,
      questionValueType: question.questionValueType,
      isRequired: question.isRequired,
      minValue: question.minValue === null ? null : String(question.minValue),
      maxValue: question.maxValue === null ? null : String(question.maxValue),
      maxLength: question.maxLength,
      position: question.position,
    };
    await db
      .insert(productQuestions)
      .values({ id: question.id, ...columns })
      .onConflictDoUpdate({ target: productQuestions.id, set: columns });

    for (const option of question.options) {
      const optionColumns = {
        questionId: question.id,
        value: option.value,
        label: option.label,
        position: option.position,
      };
      await db
        .insert(productQuestionOptions)
        .values({ id: option.id, ...optionColumns })
        .onConflictDoUpdate({ target: productQuestionOptions.id, set: optionColumns });
    }
    deleted += await prune(
      db,
      productQuestionOptions,
      eq(productQuestionOptions.questionId, question.id),
      productQuestionOptions.id,
      question.options.map((option) => option.id),
    );
  }

  deleted += await prune(
    db,
    productQuestions,
    eq(productQuestions.productId, product.id),
    productQuestions.id,
    product.questions.map((question) => question.id),
  );
  return deleted;
}
