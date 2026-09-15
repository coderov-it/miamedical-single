/**
 * The legal page editor's form state: the API's shape turned into something a
 * form can bind to, and back.
 *
 * Split out of the component so the "is it dirty?" comparison and the payload
 * shape are one pair of functions rather than two inline object literals that
 * drift — an editor whose dirty check forgets a field silently loses that
 * field's edits to the navigation guard.
 */
import type { LocalizedValue } from '~/lib/i18n';
import { SOURCE_LANGUAGE } from '~/lib/i18n';

export interface Draft {
  title: LocalizedValue;
  body: LocalizedValue;
  metaTitle: LocalizedValue;
  metaDescription: LocalizedValue;
  /** `YYYY-MM-DD` for `<input type="date">`, or `''` for "not set". */
  effectiveAt: string;
}

interface LegalPagePayload {
  title: LocalizedValue | null;
  body: LocalizedValue | null;
  metaTitle: LocalizedValue | null;
  metaDescription: LocalizedValue | null;
  effectiveAt: string | null;
}

/** An untranslated field is still an object — the source language, empty. */
const emptyLocalized = (): LocalizedValue => ({ [SOURCE_LANGUAGE]: '' });

const localizedOr = (value: LocalizedValue | null | undefined): LocalizedValue =>
  value ? { ...value } : emptyLocalized();

export function draftFrom(data: LegalPagePayload): Draft {
  return {
    title: localizedOr(data.title),
    body: localizedOr(data.body),
    metaTitle: localizedOr(data.metaTitle),
    metaDescription: localizedOr(data.metaDescription),
    /* The server stores UTC midnight for a date the operator picked, so the
       date part is the date they picked — see `toPayload`. */
    effectiveAt: data.effectiveAt ? data.effectiveAt.slice(0, 10) : '',
  };
}

/**
 * Compared as JSON rather than field by field, so a field added to `Draft`
 * cannot be left out of the dirty check. Key order is stable: both sides are
 * built by `draftFrom` or mutated in place, never rebuilt from scratch.
 */
export function isSameDraft(a: Draft, b: Draft): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * `2026-09-15` → `2026-09-15T00:00:00.000Z`.
 *
 * UTC midnight, not local: the date is a calendar date ("in effect from the
 * 15th"), and anchoring it to the operator's zone would make it render as the
 * 14th anywhere west of them. The storefront formats it back in UTC for the
 * same reason.
 */
function effectiveAtIso(value: string): string | null {
  if (!value) return null;
  return `${value}T00:00:00.000Z`;
}

export function toPayload(draft: Draft) {
  return {
    title: draft.title,
    body: draft.body,
    metaTitle: draft.metaTitle,
    metaDescription: draft.metaDescription,
    effectiveAt: effectiveAtIso(draft.effectiveAt),
  };
}
