/**
 * The wire format for a rental request, shared by the buy box that writes it and
 * the summary page that reads it back. One module, so a renamed field cannot
 * fail silently and drop a customer's choice.
 *
 * Format and rationale: docs/code/storefront-design-system.md
 */
import { MAX_ADDON_QUANTITY, type RentalPeriod, resolvePeriod } from '@mia/pricing';

import type { ProductDetail } from './catalog.ts';
import { t } from './labels.ts';
import { localeForRequest, localeTag } from './i18n.ts';

/**
 * The keys are English because they are code, not content: a wire format is read
 * by a program, never by a customer. Public route paths are the opposite case and
 * stay Italian — see the RULES section of AGENTS.md.
 */

/** `question.<questionKey>` — one intake answer. Repeats for multi-select. */
export const QUESTION_PREFIX = 'question.';
/**
 * `addon.<addonId>` — how many of that add-on, when it may be taken more than
 * once. The tick itself stays `addon=<addonId>`, so an add-on with no stepper
 * needs no second key.
 */
export const ADDON_QUANTITY_PREFIX = 'addon.';

/**
 * There is no return-date field. The chosen package carries the duration and
 * `resolvePeriod` derives the end from it, so a return date on the wire would be
 * a second opinion about a figure the catalogue already settles.
 */
export const FIELD = {
  product: 'product',
  quantity: 'qty',
  startDate: 'from',
  startTime: 'time',
  rentalPackage: 'package',
  addon: 'addon',
} as const;

/** The wire values of a `boolean` intake answer. Displayed via `t('yes'|'no')`. */
export const BOOLEAN_VALUES = { yes: 'yes', no: 'no' } as const;

export const MAX_QUANTITY = 10;

/** Free-text ceiling. Long enough for a delivery note, short enough to render. */
const MAX_FREE_TEXT = 300;

/**
 * One intake answer, as the customer read it. No amount: an answer describes the
 * delivery, never its price — everything that costs money is a package or an
 * add-on, and both are priced from the catalogue.
 */
export interface ResolvedEntry {
  label: string;
  value: string;
}

/** One ticked add-on, with how many of it the customer asked for. */
export interface ResolvedAddon {
  addon: ProductDetail['addons'][number];
  quantity: number;
}

export interface ResolvedRequest {
  answers: ResolvedEntry[];
  addons: ResolvedAddon[];
  /**
   * The answers in the catalogue's OWN values rather than the labels — only the
   * ones that really matched an option.
   *
   * Values and not words because this builds the body `POST /api/orders` is
   * sent, where the server re-resolves every value against the catalogue itself.
   */
  answerValues: Record<string, string[]>;
  quantity: number;
  /** ISO `YYYY-MM-DD`, or `''`. */
  startDate: string;
  /** `HH:MM`, or `''` — asked for only when the chosen package is quoted in hours. */
  startTime: string;
  /**
   * The package, resolved by `code`, and the whole price of a rental. An unknown
   * code is dropped, never echoed; `null` on a rental means nothing can be quoted
   * yet, which is what the buy box's package list is for.
   */
  rentalPackage: ProductDetail['rentalPackages'][number] | null;
  /** The period the package and start place, or `null` while either is missing. */
  period: RentalPeriod | null;
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

/** `HH:MM` only, on a 24-hour clock. */
function cleanTime(raw: string): string {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(raw) ? raw : '';
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
 * Unknown question keys and option values are dropped, never echoed: this text is
 * rendered on the page and pushed into a WhatsApp message, so a value that does
 * not correspond to a real option has no business appearing as if it did.
 */
export function resolveRequest(product: ProductDetail, params: URLSearchParams): ResolvedRequest {
  const answerValues: Record<string, string[]> = {};

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
      });
    }
  }

  const requestedAddons = params.getAll(FIELD.addon);
  const addons: ResolvedAddon[] = product.addons
    .filter((addon) => requestedAddons.includes(addon.id))
    .map((addon) => ({ addon, quantity: addonQuantity(params, addon) }));

  const quantity = Math.min(
    MAX_QUANTITY,
    Math.max(1, Math.trunc(Number(params.get(FIELD.quantity) ?? '1')) || 1),
  );

  const startDate = cleanDate(params.get(FIELD.startDate)?.trim() ?? '');
  const startTime = cleanTime(params.get(FIELD.startTime)?.trim() ?? '');

  const packageCode = params.get(FIELD.rentalPackage)?.trim() ?? '';
  const rentalPackage =
    product.rentalPackages.find((candidate) => candidate.code === packageCode) ?? null;

  /* The return date is DERIVED, never read: the package says how long, the start
     says from when, and `resolvePeriod` is the one place that turns the pair into
     an end — the same function the server writes onto the order. */
  const period =
    rentalPackage && startDate ? resolvePeriod(startDate, startTime || null, rentalPackage) : null;

  return {
    answers,
    addons,
    answerValues,
    quantity,
    startDate,
    startTime,
    rentalPackage,
    period,
  };
}

/**
 * How many of one add-on the URL asks for, held to that add-on's own ceiling.
 *
 * Clamped rather than rejected, unlike the server: this resolver's job is to
 * render what a customer can still act on, and a quantity out of range means the
 * stepper's maximum, not a blank page. The server sees the clamped figure.
 */
function addonQuantity(params: URLSearchParams, addon: ProductDetail['addons'][number]): number {
  const ceiling = addon.maxQuantity ?? MAX_ADDON_QUANTITY;
  const raw = Math.trunc(Number(params.get(`${ADDON_QUANTITY_PREFIX}${addon.id}`) ?? '1'));
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.min(ceiling, raw);
}

/** `2026-09-01` → a date in the current server-rendered locale. */
export function formatDateLabel(isoDate: string): string {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return '';
  return new Intl.DateTimeFormat(localeTag(localeForRequest()), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
