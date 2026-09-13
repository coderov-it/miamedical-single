import {
  LANGUAGE_CODES,
  type LanguageCode,
  type LocalizedLike,
  languageOf,
  SOURCE_LANGUAGE,
  TARGET_LANGUAGE_CODES,
  type TargetLanguageCode,
  textFor,
} from './languages.ts';

/**
 * Who gets translated, and who must be left alone.
 *
 * A product is not one text, it is many: the translation row, each chip, each
 * photo's alt text, each spec's text value, each add-on's name and description,
 * each FAQ's question and answer. So the unit of planning is a **field**, and
 * fields are gathered into two hierarchies with different jobs:
 *
 *   section  what the operator sees — "Product details", "FAQs", "Media alt text"
 *   group    what is protected — one translation row, one chip, one photo, one
 *            add-on, one FAQ
 *
 * ── The protection rule, and why its unit is the group ─────────────────────
 * A group the operator has written ANYTHING in is never touched, in that
 * language. The unit matters: per-language would let one hand-written French
 * chip cancel the entire French run, which with forty fields is the same as
 * having no feature; per-field would fill in the rest of an item around a
 * word somebody chose deliberately, leaving a FAQ that is half theirs and half
 * the machine's with nothing on screen saying which half is which.
 *
 * There is no provenance column behind this — the catalogue does not record
 * whether a value was typed or generated — so a group a previous run filled
 * reads as hand-written on the next one. That is the safe direction: re-running
 * never overwrites what it already produced.
 *
 * See `docs/code/product-translation.md`.
 */

/** One translated value, plus everything the dialog and the saver need to place it. */
export interface PlanField {
  /** Globally unique, e.g. `faq:<id>.answer`. The provider echoes it back. */
  key: string;
  /** What the field is called: "Answer", "Alt text", "Title". */
  label: string;
  /** Display grouping: "Product details", "FAQs". */
  section: string;
  /** Protection unit, e.g. `faq:<id>`. */
  group: string;
  /** What the group is called in the review: "FAQ 2", "Gallery photo 3". */
  groupLabel: string;
  /** `html` must come back as html — the server sanitises rich text on write. */
  format: 'text' | 'html';
  /**
   * The server's cap for this field. A longer answer is refused rather than
   * truncated: silently cutting a translated chip to 20 characters produces
   * copy nobody wrote, which is worse than leaving the chip untranslated.
   */
  maxLength?: number;
  /**
   * Marks the field a language's translation row cannot exist without — the
   * title. A group holding one is only generated when the source has it.
   */
  createsRow?: boolean;
  /**
   * Fill this field from another one in the SAME language when the source has
   * nothing to translate — a meta title is the title, a meta description is the
   * short description. The key is another field's `key`.
   *
   * A derived field is not translated and not protected: there is nothing to
   * translate it from, and it is only ever written when it is empty, so no
   * operator's wording is at risk.
   */
  deriveFrom?: string;
  /** `{ it, en, … }` for this one field. */
  values: LocalizedLike;
}

export interface PlannedGroup {
  id: string;
  label: string;
  section: string;
  /** Empty here, filled in the source: what a run would write. */
  gaps: PlanField[];
  /** Written by a person: why this group is skipped. */
  authored: PlanField[];
  /** Set when the group cannot be generated for a reason other than protection. */
  blockedReason: string | null;
}

export interface LanguagePlan {
  code: TargetLanguageCode;
  /** Endonym, for the checkbox and the log line. */
  label: string;
  groups: PlannedGroup[];
  /** Every gap across every group — what a run would send. */
  gaps: PlanField[];
  /** Filled from another field in this language instead of being translated. */
  derived: PlanField[];
  /** Groups the operator has written in, across the whole record. */
  kept: PlannedGroup[];
}

export interface SectionSummary {
  name: string;
  count: number;
}

export interface TranslateFieldPayload {
  key: string;
  label: string;
  text: string;
  format: 'text' | 'html';
}

/** One line of the run log the dialog shows while it works. */
export interface TranslationLogLine {
  id: number;
  tone: 'pending' | 'done' | 'skipped' | 'error';
  text: string;
}

const hasText = (values: LocalizedLike, code: LanguageCode): boolean =>
  (values[code] ?? '').trim() !== '';

/** Languages carrying enough text to be a source — Italian plus whatever else was written. */
export function sourceLanguages(fields: PlanField[]): LanguageCode[] {
  return LANGUAGE_CODES.filter((code) => fields.some((field) => hasText(field.values, code)));
}

/** Where a run starts when nobody has chosen: the source language, or the first one with text. */
export function defaultSource(fields: PlanField[]): LanguageCode {
  if (fields.some((field) => hasText(field.values, SOURCE_LANGUAGE))) return SOURCE_LANGUAGE;
  return sourceLanguages(fields)[0] ?? SOURCE_LANGUAGE;
}

/**
 * Group the flat field list, preserving the order the builder emitted — the
 * dialog should read in the same order as the tabs, not in hash order.
 */
function groupsOf(
  fields: PlanField[],
): Array<{ id: string; label: string; section: string; fields: PlanField[] }> {
  const byId = new Map<
    string,
    { id: string; label: string; section: string; fields: PlanField[] }
  >();
  for (const field of fields) {
    const existing = byId.get(field.group);
    if (existing) {
      existing.fields.push(field);
    } else {
      byId.set(field.group, {
        id: field.group,
        label: field.groupLabel,
        section: field.section,
        fields: [field],
      });
    }
  }
  return [...byId.values()];
}

/**
 * One entry per other language. A language with no gaps anywhere still appears,
 * carrying its `kept` groups so the dialog can say why it will do nothing.
 */
export function planTranslations(fields: PlanField[], source: LanguageCode): LanguagePlan[] {
  return TARGET_LANGUAGE_CODES.filter((code) => code !== source).map((code) => {
    const groups: PlannedGroup[] = groupsOf(fields).map((group) => {
      const authored = group.fields.filter((field) => hasText(field.values, code));
      const missingTitle = group.fields.find(
        (field) => field.createsRow && !hasText(field.values, source),
      );

      if (authored.length > 0) {
        return { ...group, gaps: [], authored, blockedReason: null };
      }
      if (missingTitle) {
        return {
          ...group,
          gaps: [],
          authored,
          blockedReason: `no ${languageOf(source).label} ${missingTitle.label.toLowerCase()}`,
        };
      }
      return {
        ...group,
        authored,
        gaps: group.fields.filter((field) => hasText(field.values, source)),
        blockedReason: null,
      };
    });

    const gaps = groups.flatMap((group) => group.gaps);
    const gapKeys = new Set(gaps.map((field) => field.key));

    /*
      Derived fields sit OUTSIDE the protection rule, on purpose.

      A group an operator has written in is skipped whole — but that would also
      skip a meta title that is empty in every language, and a second run would
      never fill it: after the first run the group reads as hand-written. That
      is fine for text that exists and wrong for text that does not.

      A derived field is only ever written when it is empty in the target, so
      there is nothing of the operator's to lose — which is exactly why it does
      not need the protection that exists to prevent overwriting.
    */
    const derived = fields.filter(
      (field) =>
        field.deriveFrom !== undefined &&
        !hasText(field.values, source) &&
        !hasText(field.values, code) &&
        // Something to copy from: either already there in this language, or
        // about to be translated in this same run.
        (hasText(fields.find((entry) => entry.key === field.deriveFrom)?.values ?? {}, code) ||
          gapKeys.has(field.deriveFrom)),
    );

    return {
      code,
      label: languageOf(code).label,
      groups,
      gaps,
      derived,
      kept: groups.filter((group) => group.authored.length > 0),
    };
  });
}

/**
 * Fields a run would actually write for this language: translated from the
 * source, plus the ones derived from another field in the same language.
 */
export function fillableCount(plan: LanguagePlan): number {
  return plan.gaps.length + plan.derived.length;
}

/** The gaps as the provider request wants them — text read from the source language. */
export function fieldPayload(gaps: PlanField[], source: LanguageCode): TranslateFieldPayload[] {
  return gaps.map((field) => ({
    key: field.key,
    label: field.label,
    text: textFor(field.values, source),
    format: field.format,
  }));
}

/** Field counts per section, in builder order — the confirm step's summary. */
export function summariseSections(fields: PlanField[]): SectionSummary[] {
  const order: string[] = [];
  const counts = new Map<string, number>();
  for (const field of fields) {
    if (!counts.has(field.section)) order.push(field.section);
    counts.set(field.section, (counts.get(field.section) ?? 0) + 1);
  }
  return order.map((name) => ({ name, count: counts.get(name)! }));
}

/** `"2 add-ons"` — the wording the dialog uses for a group's authored fields. */
export function authoredSummary(group: PlannedGroup): string {
  return group.authored.map((field) => field.label.toLowerCase()).join(', ');
}
