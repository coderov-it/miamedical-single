/**
 * The wire format for a rental request, shared by the buy box that writes it and
 * the summary page that reads it back. One module, so a renamed field cannot
 * fail silently and drop a customer's choice.
 *
 * Format and rationale: docs/code/storefront-design-system.md
 */
import type { ProductDetail } from './catalog.ts';

/** `v_<groupKey>` — one variant group selection. Repeats for multi-select. */
export const VARIANT_PREFIX = 'v_';
/** `q_<questionKey>` — one intake answer. Repeats for multi-select. */
export const QUESTION_PREFIX = 'q_';

export const FIELD = {
  product: 'prodotto',
  quantity: 'qta',
  startDate: 'dal',
  addon: 'extra',
} as const;

export const MAX_QUANTITY = 10;

/** Free-text ceiling. Long enough for a delivery note, short enough to render. */
const MAX_FREE_TEXT = 300;

export interface ResolvedEntry {
  label: string;
  value: string;
  /** Price effect, already formatted, when the choice has one. */
  note: string | null;
}

export interface ResolvedRequest {
  selections: ResolvedEntry[];
  answers: ResolvedEntry[];
  addons: ProductDetail['addons'];
  quantity: number;
  /** ISO `YYYY-MM-DD`, or `''`. */
  startDate: string;
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

const BOOLEAN_LABELS: Record<string, string> = { si: 'Sì', sì: 'Sì', no: 'No' };

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

  for (const group of product.variants) {
    const name = `${VARIANT_PREFIX}${group.key}`;
    const raw = params.getAll(name).filter((value) => value.trim().length > 0);
    if (raw.length === 0) continue;

    if (group.options.length > 0) {
      const chosen = group.options.filter((option) => raw.includes(option.value));
      for (const option of chosen) {
        selections.push({
          label: group.label,
          value: option.label,
          note:
            option.priceModifier.amount === '0.00'
              ? null
              : formatModifier(option.priceModifier.amount, option.priceModifier.currency),
        });
      }
      continue;
    }

    const first = raw[0];
    if (first === undefined) continue;

    if (group.valueType === 'number' || group.valueType === 'number_range') {
      const value = cleanNumber(first, group.min, group.max);
      if (value === null) continue;
      selections.push({
        label: group.label,
        value: group.unit ? `${value} ${group.unit}` : value,
        note: group.priceModifierPerUnit
          ? `${formatModifier(
              group.priceModifierPerUnit.amount,
              group.priceModifierPerUnit.currency,
            )} per ${group.unit ?? 'unità'}`
          : null,
      });
      continue;
    }

    const text = cleanFreeText(first);
    if (text) selections.push({ label: group.label, value: text, note: null });
  }

  const answers: ResolvedEntry[] = [];

  for (const question of product.questions) {
    const name = `${QUESTION_PREFIX}${question.key}`;
    const raw = params.getAll(name).filter((value) => value.trim().length > 0);
    if (raw.length === 0) continue;

    if (question.options.length > 0) {
      for (const option of question.options.filter((candidate) => raw.includes(candidate.value))) {
        answers.push({ label: question.prompt, value: option.label, note: null });
      }
      continue;
    }

    const first = raw[0];
    if (first === undefined) continue;

    if (question.valueType === 'boolean') {
      const label = BOOLEAN_LABELS[first.toLowerCase()];
      if (label) answers.push({ label: question.prompt, value: label, note: null });
      continue;
    }

    if (question.valueType === 'number') {
      const value = cleanNumber(first, question.min, question.max);
      if (value !== null) answers.push({ label: question.prompt, value, note: null });
      continue;
    }

    if (question.valueType === 'date') {
      const value = cleanDate(first);
      if (value) {
        answers.push({ label: question.prompt, value: formatDateLabel(value), note: null });
      }
      continue;
    }

    const text = cleanFreeText(first);
    if (text) answers.push({ label: question.prompt, value: text, note: null });
  }

  const requestedAddons = params.getAll(FIELD.addon);
  const addons = product.addons.filter(
    (addon) => addon.isRequired || requestedAddons.includes(addon.id),
  );

  const quantity = Math.min(
    MAX_QUANTITY,
    Math.max(1, Math.trunc(Number(params.get(FIELD.quantity) ?? '1')) || 1),
  );

  return {
    selections,
    answers,
    addons,
    quantity,
    startDate: cleanDate(params.get(FIELD.startDate)?.trim() ?? ''),
  };
}

/** `2026-09-01` → `01/09/2026`, the Italian reading order. */
export function formatDateLabel(isoDate: string): string {
  return isoDate ? isoDate.split('-').reverse().join('/') : '';
}
