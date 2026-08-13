/**
 * The wire format for a rental request, shared by the buy box that writes it and
 * the summary page that reads it back. One module, so a renamed field cannot
 * fail silently and drop a customer's choice.
 *
 * Format and rationale: docs/code/storefront-design-system.md
 */
import { mulMoney } from '@mia/pricing';

import type { ProductDetail } from './catalog.ts';
import { t } from './labels.ts';

/**
 * The keys are English because they are code, not content: a wire format is read
 * by a program, never by a customer. Public route paths are the opposite case and
 * stay Italian — see the RULES section of AGENTS.md.
 */

/** `variant.<groupKey>` — one variant group selection. Repeats for multi-select. */
export const VARIANT_PREFIX = 'variant.';
/** `question.<questionKey>` — one intake answer. Repeats for multi-select. */
export const QUESTION_PREFIX = 'question.';

export const FIELD = {
  product: 'product',
  quantity: 'qty',
  startDate: 'from',
  endDate: 'to',
  rentalPackage: 'package',
  addon: 'addon',
} as const;

/** The wire values of a `boolean` intake answer. Displayed via `t('yes'|'no')`. */
export const BOOLEAN_VALUES = { yes: 'yes', no: 'no' } as const;

export const MAX_QUANTITY = 10;

/** Free-text ceiling. Long enough for a delivery note, short enough to render. */
const MAX_FREE_TEXT = 300;

export interface ResolvedEntry {
  label: string;
  value: string;
  /** Price effect, already formatted, when the choice has one. */
  note: string | null;
  /**
   * The same price effect as a two-decimal money string, already multiplied out
   * (a numeric group contributes `value × perUnit`). `"0.00"` when the choice is
   * free.
   *
   * It exists so the checkout estimate can price a resolved request without
   * re-walking the product and re-validating the URL — the validation above
   * already dropped everything that is not a real option, and a second pass
   * would be a second chance to disagree with it. On a rental product this is a
   * PER-UNIT amount, per the owner's rule.
   *
   * A string, not a number, because this amount reaches `@mia/pricing` — the same
   * rules the server prices the stored order with, in bigint hundredths. A float
   * here would be a rounding difference between the figure the customer confirms
   * and the figure the order records.
   */
  amount: string;
  /**
   * The group is part of the SKU matrix, so a matched SKU's price already carries
   * this amount. Only meaningful on a `selections` entry.
   */
  affectsSku: boolean;
}

export interface ResolvedRequest {
  selections: ResolvedEntry[];
  answers: ResolvedEntry[];
  addons: ProductDetail['addons'];
  /**
   * The choices in the catalogue's OWN values rather than the labels — only the
   * ones that really matched an option.
   *
   * Two jobs, both needing values and not words: pinning a SKU (a pinned SKU can
   * carry a price override no sum of modifiers would find), and building the body
   * `POST /api/orders` is sent, where the server re-resolves every value against
   * the catalogue itself.
   */
  variantValues: Record<string, string[]>;
  answerValues: Record<string, string[]>;
  quantity: number;
  /** ISO `YYYY-MM-DD`, or `''`. */
  startDate: string;
  /** ISO `YYYY-MM-DD`, or `''` — open-ended rentals leave the return date unset. */
  endDate: string;
  /** The duration bundle, resolved by `code`. An unknown code is dropped, never echoed. */
  rentalPackage: ProductDetail['rentalPackages'][number] | null;
}

/**
 * Free text is the customer's own words, so it is kept — but control characters
 * and newlines are stripped and the length is capped. It is rendered as escaped
 * text and put into a `wa.me` link, and neither should carry arbitrary
 * whitespace or length from a URL someone else could have crafted.
 */
function cleanFreeText(raw: string): string {
  return raw
    .replace(/[\p{Cc}\p{Cf}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_FREE_TEXT);
}

/** `YYYY-MM-DD` only. Anything else is discarded rather than echoed. */
function cleanDate(raw: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : '';
}

function cleanNumber(raw: string, min: number | null, max: number | null): string | null {
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  if (min !== null && value < min) return null;
  if (max !== null && value > max) return null;
  return String(value);
}

/* Wire value → the word the customer saw. The Italian comes from the label
   catalog, so this map holds keys only. */
const BOOLEAN_LABELS: Record<string, string> = {
  yes: t('yes'),
  no: t('no'),
};

/**
 * Resolves a configuration back to the labels the customer actually saw.
 *
 * Unknown group keys and option values are dropped, never echoed: this text is
 * rendered on the page and pushed into a WhatsApp message, so a value that does
 * not correspond to a real option has no business appearing as if it did.
 */
export function resolveRequest(
  product: ProductDetail,
  params: URLSearchParams,
  formatModifier: (amount: string, currency: string) => string,
): ResolvedRequest {
  const selections: ResolvedEntry[] = [];
  const variantValues: Record<string, string[]> = {};
  const answerValues: Record<string, string[]> = {};

  for (const group of product.variants) {
    const name = `${VARIANT_PREFIX}${group.key}`;
    const raw = params.getAll(name).filter((value) => value.trim().length > 0);
    if (raw.length === 0) continue;

    if (group.options.length > 0) {
      const chosen = group.options.filter((option) => raw.includes(option.value));
      // The catalogue's own values, from the options that really matched — a value
      // nobody offers must not reach the SKU matcher, or the order body, any more
      // than it reaches the page.
      if (chosen.length > 0) variantValues[group.key] = chosen.map((option) => option.value);
      for (const option of chosen) {
        selections.push({
          label: group.label,
          value: option.label,
          note:
            option.priceModifier.amount === '0.00'
              ? null
              : formatModifier(option.priceModifier.amount, option.priceModifier.currency),
          amount: option.priceModifier.amount,
          affectsSku: group.affectsSku,
        });
      }
      continue;
    }

    const first = raw[0];
    if (first === undefined) continue;

    if (group.valueType === 'number' || group.valueType === 'number_range') {
      const value = cleanNumber(first, group.min, group.max);
      if (value === null) continue;
      variantValues[group.key] = [value];
      selections.push({
        label: group.label,
        value: group.unit ? `${value} ${group.unit}` : value,
        note: group.priceModifierPerUnit
          ? t('perUnitNote', {
              amount: formatModifier(
                group.priceModifierPerUnit.amount,
                group.priceModifierPerUnit.currency,
              ),
              unit: group.unit ?? t('unitFallback'),
            })
          : null,
        amount: group.priceModifierPerUnit
          ? mulMoney(group.priceModifierPerUnit.amount, value)
          : '0.00',
        // A number has no finite set of combinations, so a numeric group never
        // joins the SKU matrix — its amount is always priced on top.
        affectsSku: false,
      });
      continue;
    }

    const text = cleanFreeText(first);
    if (text) {
      variantValues[group.key] = [text];
      selections.push({
        label: group.label,
        value: text,
        note: null,
        amount: '0.00',
        affectsSku: false,
      });
    }
  }

  const answers: ResolvedEntry[] = [];

  for (const question of product.questions) {
    const name = `${QUESTION_PREFIX}${question.key}`;
    const raw = params.getAll(name).filter((value) => value.trim().length > 0);
    if (raw.length === 0) continue;

    if (question.options.length > 0) {
      const chosen = question.options.filter((candidate) => raw.includes(candidate.value));
      if (chosen.length > 0) answerValues[question.key] = chosen.map((option) => option.value);
      for (const option of chosen) {
        answers.push({
          label: question.prompt,
          value: option.label,
          note: null,
          amount: '0.00',
          affectsSku: false,
        });
      }
      continue;
    }

    const first = raw[0];
    if (first === undefined) continue;

    if (question.valueType === 'boolean') {
      const wire = first.toLowerCase();
      const label = BOOLEAN_LABELS[wire];
      if (label) {
        answerValues[question.key] = [wire];
        answers.push({
          label: question.prompt,
          value: label,
          note: null,
          amount: '0.00',
          affectsSku: false,
        });
      }
      continue;
    }

    if (question.valueType === 'number') {
      const value = cleanNumber(first, question.min, question.max);
      if (value !== null) {
        answerValues[question.key] = [value];
        answers.push({
          label: question.prompt,
          value,
          note: null,
          amount: '0.00',
          affectsSku: false,
        });
      }
      continue;
    }

    if (question.valueType === 'date') {
      const value = cleanDate(first);
      if (value) {
        // The ISO date on the wire; the Italian reading order on the page.
        answerValues[question.key] = [value];
        answers.push({
          label: question.prompt,
          value: formatDateLabel(value),
          note: null,
          amount: '0.00',
          affectsSku: false,
        });
      }
      continue;
    }

    const text = cleanFreeText(first);
    if (text) {
      answerValues[question.key] = [text];
      answers.push({
        label: question.prompt,
        value: text,
        note: null,
        amount: '0.00',
        affectsSku: false,
      });
    }
  }

  const requestedAddons = params.getAll(FIELD.addon);
  const addons = product.addons.filter((addon) => requestedAddons.includes(addon.id));

  const quantity = Math.min(
    MAX_QUANTITY,
    Math.max(1, Math.trunc(Number(params.get(FIELD.quantity) ?? '1')) || 1),
  );

  const startDate = cleanDate(params.get(FIELD.startDate)?.trim() ?? '');
  let endDate = cleanDate(params.get(FIELD.endDate)?.trim() ?? '');
  // ISO dates compare lexicographically. A return before the start is nonsense,
  // so it is dropped rather than shown as if the customer had picked it.
  if (endDate && startDate && endDate < startDate) endDate = '';

  const packageCode = params.get(FIELD.rentalPackage)?.trim() ?? '';
  const rentalPackage =
    product.rentalPackages.find((candidate) => candidate.code === packageCode) ?? null;

  return {
    selections,
    answers,
    addons,
    variantValues,
    answerValues,
    quantity,
    startDate,
    endDate,
    rentalPackage,
  };
}

/** `2026-09-01` → `01/09/2026`, the Italian reading order. */
export function formatDateLabel(isoDate: string): string {
  return isoDate ? isoDate.split('-').reverse().join('/') : '';
}
