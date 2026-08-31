/**
 * One authored spec value → the typed columns `product_spec_values` stores.
 *
 * The JSON says `"seat-width": 45`; the category's spec says that key is a
 * `number` with unit `cm`; this decides that 45 belongs in `number_value` and
 * not in `text_value`. Getting it wrong is not a display bug — a number in the
 * text column is invisible to every numeric facet filter.
 *
 * Problems are returned, never thrown: one run reports every bad value in every
 * file, not the first one it meets.
 */
import type { Localized } from '@mia/db/schema';

import { specOptionId } from './ids.ts';
import type { AuthoredSpec, AuthoredSpecValue } from './authored.ts';

export interface CoercedSpecValue {
  numberValue: number | null;
  numberMin: number | null;
  numberMax: number | null;
  booleanValue: boolean | null;
  textValue: Localized | null;
  optionIds: string[];
}

export type CoercionResult = { ok: true; value: CoercedSpecValue } | { ok: false; error: string };

const EMPTY: CoercedSpecValue = {
  numberValue: null,
  numberMin: null,
  numberMax: null,
  booleanValue: null,
  textValue: null,
  optionIds: [],
};

const fail = (error: string): CoercionResult => ({ ok: false, error });
const ok = (value: Partial<CoercedSpecValue>): CoercionResult => ({
  ok: true,
  value: { ...EMPTY, ...value },
});

export function coerceSpecValue(
  spec: AuthoredSpec,
  categoryCode: string,
  raw: AuthoredSpecValue,
): CoercionResult {
  switch (spec.valueType) {
    case 'number':
      return coerceNumber(raw);
    case 'number_range':
      return coerceRange(raw);
    case 'boolean':
      return typeof raw === 'boolean'
        ? ok({ booleanValue: raw })
        : fail(`expected true or false, got ${describe(raw)}`);
    case 'string':
      return coerceText(raw);
    case 'single_select':
      return coerceSelect(spec, categoryCode, raw, false);
    case 'multi_select':
      return coerceSelect(spec, categoryCode, raw, true);
  }
}

function coerceNumber(raw: unknown): CoercionResult {
  const value = asNumber(raw);
  return value === null
    ? fail(`expected a number, got ${describe(raw)}`)
    : ok({ numberValue: value });
}

/**
 * `{ min, max }` for a span, or a plain number for a single reading — the
 * catalogue's range filter reads `COALESCE(number_value, number_max)`, so one
 * value in `number_value` still matches every band it falls inside.
 */
function coerceRange(raw: unknown): CoercionResult {
  const single = asNumber(raw);
  if (single !== null) return ok({ numberValue: single });

  if (Array.isArray(raw) && raw.length === 2) {
    const min = asNumber(raw[0]);
    const max = asNumber(raw[1]);
    if (min === null || max === null) {
      return fail(`expected [min, max] numbers, got ${describe(raw)}`);
    }
    if (min > max) return fail(`min ${min} is above max ${max}`);
    return ok({ numberMin: min, numberMax: max });
  }

  if (isRecord(raw) && ('min' in raw || 'max' in raw)) {
    const min = raw['min'] == null ? null : asNumber(raw['min']);
    const max = raw['max'] == null ? null : asNumber(raw['max']);
    if (raw['min'] != null && min === null) return fail(`min is not a number in ${describe(raw)}`);
    if (raw['max'] != null && max === null) return fail(`max is not a number in ${describe(raw)}`);
    if (min !== null && max !== null && min > max) return fail(`min ${min} is above max ${max}`);
    return ok({ numberMin: min, numberMax: max });
  }

  return fail(`expected a number or { "min": …, "max": … }, got ${describe(raw)}`);
}

function coerceText(raw: unknown): CoercionResult {
  if (typeof raw === 'string') return ok({ textValue: { it: raw } });
  if (isRecord(raw) && typeof raw['it'] === 'string') {
    const en = raw['en'];
    return ok({
      textValue: { it: raw['it'], ...(typeof en === 'string' ? { en } : {}) },
    });
  }
  return fail(`expected text or { "it": …, "en": … }, got ${describe(raw)}`);
}

function coerceSelect(
  spec: AuthoredSpec,
  categoryCode: string,
  raw: unknown,
  many: boolean,
): CoercionResult {
  const values = many ? raw : [raw];
  if (!Array.isArray(values) || values.some((entry) => typeof entry !== 'string')) {
    return fail(
      many
        ? `expected an array of option values, got ${describe(raw)}`
        : `expected one option value, got ${describe(raw)}`,
    );
  }

  const declared = new Set((spec.options ?? []).map((option) => option.value));
  const unknown = (values as string[]).filter((value) => !declared.has(value));
  if (unknown.length > 0) {
    return fail(
      `option(s) ${unknown.join(', ')} are not declared on spec "${spec.key}" ` +
        `(declared: ${[...declared].join(', ') || 'none'})`,
    );
  }

  return ok({
    optionIds: (values as string[]).map((value) => specOptionId(categoryCode, spec.key, value)),
  });
}

/** A JSON number, or a decimal string — `"45"` and `"12.5"` both read as numbers. */
function asNumber(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() !== '') {
    const parsed = Number(raw.replace(',', '.'));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const describe = (value: unknown): string => JSON.stringify(value) ?? String(value);
