/**
 * One authored spec value → the typed columns `product_spec_values` stores.
 *
 * A data file writes `'seat-width': 45`; the category's spec says that key is a
 * `number` with unit `cm`; this decides that 45 belongs in `number_value` and
 * not in `text_value`. Getting it wrong is not a display bug — a number in the
 * text column is invisible to every numeric facet filter.
 *
 * The authoring API already type-checks all of this WHERE THE FILE IS WRITTEN:
 * `SpecValue<S>` makes `frame: 'titanium'` a compile error against a category
 * that declares aluminium and steel. What survives to runtime is the widening
 * in `data/index.ts` — `readonly Category[]` is `Category<SpecMap>`, so by the
 * time the registry hands a category over, the option keys are back to plain
 * strings. These checks are that boundary, not a second opinion about it.
 *
 * Problems are returned, never thrown: one run reports every bad value in every
 * category, not the first one it meets.
 */
import type { Localized } from '@mia/db/schema';

import type { AnySpec } from '../../lib/types.ts';
import { specOptionId } from './ids.ts';

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
  spec: AnySpec,
  specKey: string,
  categoryCode: string,
  raw: unknown,
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
      return coerceSelect(spec.options, specKey, categoryCode, raw, false);
    case 'multi_select':
      return coerceSelect(spec.options, specKey, categoryCode, raw, true);
  }
}

function coerceNumber(raw: unknown): CoercionResult {
  return isFinite(raw) ? ok({ numberValue: raw }) : fail(`expected a number, got ${describe(raw)}`);
}

/**
 * `{ min, max }` for a span, or a plain number for a single reading — the
 * catalogue's range filter reads `COALESCE(number_value, number_max)`, so one
 * value in `number_value` still matches every band it falls inside.
 */
function coerceRange(raw: unknown): CoercionResult {
  if (isFinite(raw)) return ok({ numberValue: raw });
  if (!isRecord(raw) || !('min' in raw || 'max' in raw)) {
    return fail(`expected a number or { min, max }, got ${describe(raw)}`);
  }

  const min = raw['min'];
  const max = raw['max'];
  if (min != null && !isFinite(min)) return fail(`min is not a number in ${describe(raw)}`);
  if (max != null && !isFinite(max)) return fail(`max is not a number in ${describe(raw)}`);
  if (isFinite(min) && isFinite(max) && min > max) return fail(`min ${min} is above max ${max}`);

  return ok({
    numberMin: isFinite(min) ? min : null,
    numberMax: isFinite(max) ? max : null,
  });
}

function coerceText(raw: unknown): CoercionResult {
  if (typeof raw === 'string') return ok({ textValue: { it: raw } });
  if (isRecord(raw) && typeof raw['it'] === 'string') {
    const en = raw['en'];
    return ok({ textValue: { it: raw['it'], ...(typeof en === 'string' ? { en } : {}) } });
  }
  return fail(`expected text or { it, en }, got ${describe(raw)}`);
}

function coerceSelect(
  options: Record<string, Localized>,
  specKey: string,
  categoryCode: string,
  raw: unknown,
  many: boolean,
): CoercionResult {
  const values: unknown[] = many ? (Array.isArray(raw) ? raw : [raw]) : [raw];
  if ((many && !Array.isArray(raw)) || values.some((entry) => typeof entry !== 'string')) {
    return fail(
      many
        ? `expected an array of option values, got ${describe(raw)}`
        : `expected one option value, got ${describe(raw)}`,
    );
  }

  const chosen = values as string[];
  const declared = new Set(Object.keys(options));
  const unknown = chosen.filter((value) => !declared.has(value));
  if (unknown.length > 0) {
    return fail(
      `option(s) ${unknown.join(', ')} are not declared on spec "${specKey}" ` +
        `(declared: ${[...declared].join(', ') || 'none'})`,
    );
  }

  return ok({ optionIds: chosen.map((value) => specOptionId(categoryCode, specKey, value)) });
}

const isFinite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const describe = (value: unknown): string => JSON.stringify(value) ?? String(value);
