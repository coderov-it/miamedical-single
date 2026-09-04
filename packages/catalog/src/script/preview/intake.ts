/**
 * What the product asks and answers: intake questions, and FAQs.
 *
 * A question's constraints sit in their own column — `number`, `required`,
 * `0–30` — because those are the bounds a customer hits at checkout, and a
 * maximum floor of 3 is only visible as a mistake when the number is on the
 * page beside the prompt that asks for it.
 *
 * FAQs stay collapsed. A product with eight of them would otherwise push the
 * metadata off the bottom of the page, and the question text alone is what a
 * reviewer scans.
 */
import type { AnyQuestion, FaqInput, ProductInput, SpecMap } from '../../lib/types.ts';
import { escape, localized } from './html.ts';

function constraints(question: AnyQuestion): string {
  const parts: string[] = [];
  if (question.isRequired) parts.push('<span class="flag required">required</span>');

  if (question.questionValueType === 'number') {
    const min = question.minValue;
    const max = question.maxValue;
    if (min !== undefined || max !== undefined)
      parts.push(`<span class="flag">${min?.toString() ?? '…'}–${max?.toString() ?? '…'}</span>`);
  }
  if (
    (question.questionValueType === 'string' || question.questionValueType === 'text') &&
    question.maxLength !== undefined
  ) {
    parts.push(`<span class="flag">max ${question.maxLength.toString()}</span>`);
  }
  return parts.join('') || '<span class="muted">—</span>';
}

function options(question: AnyQuestion): string {
  if (!('options' in question)) return '';
  return `<div class="options">${Object.entries(question.options)
    .map(
      ([value, label]) =>
        `<span class="option"><code>${escape(value)}</code> ${localized(label)}</span>`,
    )
    .join('')}</div>`;
}

export function questionsTable(product: ProductInput<SpecMap>): string {
  const list = product.questions ?? [];
  if (list.length === 0) return '';

  const body = list
    .map(
      (question) => `<tr>
        <td><code>${escape(question.key)}</code></td>
        <td>${localized(question.prompt)}${question.helpText ? `<span class="help">${localized(question.helpText)}</span>` : ''}${options(question)}</td>
        <td><code>${escape(question.questionValueType)}</code></td>
        <td>${constraints(question)}</td>
      </tr>`,
    )
    .join('');

  return `<table class="questions">
    <thead><tr><th>Key</th><th>Prompt</th><th>Type</th><th>Constraints</th></tr></thead>
    <tbody>${body}</tbody>
  </table>`;
}

export function renderFaqs(faqs: readonly FaqInput[] | undefined): string {
  const list = faqs ?? [];
  if (list.length === 0) return '';

  return list
    .map(
      (faq) => `<details class="faq">
        <summary>${localized(faq.question)}${faq.isActive === false ? '<span class="flag off">inactive</span>' : ''}</summary>
        <div class="answer">${localized(faq.answer)}</div>
      </details>`,
    )
    .join('');
}
