import {
  type LocalizedLike,
  type PlanField,
  setTextFor,
  SOURCE_LANGUAGE,
  type TargetLanguageCode,
  textFor,
} from '~/lib/i18n';
import { slugify } from '~/lib/slug';

import { isSelectType, type Localized, type SpecEdit } from './spec-edit';

/**
 * Everything on a category that a translation run can fill, and the way back
 * into the sheet's form.
 *
 * Built from the form the sheet holds, not from the saved DTO: the answers land
 * in that same form and the sheet's own Save writes them, so a run works on a
 * category that does not exist yet and never has to refuse over unsaved edits.
 *
 * Keys are positional (`spec:3.option:7`) — the provider caps a key at 64
 * characters, which two uuids do not fit. Safe because the dialog is modal: the
 * spec list cannot be reordered while a run is open.
 *
 * Not included, deliberately:
 *   · `slug` — derived from the translated name when that language has none
 *   · spec `key`, option `value`, `unit` — machine values, not copy
 *
 * See `docs/code/product-translation.md`.
 */

export interface CategoryForm {
  name: Localized;
  slug: Localized;
  description: Localized;
  specs: SpecEdit[];
}

export type TranslationRows = Partial<Record<TargetLanguageCode, Record<string, string>>>;

const SECTION = {
  details: 'Category details',
  specs: 'Spec fields',
  options: 'Spec options',
} as const;

const DETAILS = 'details';

export function buildPlanFields(form: CategoryForm): PlanField[] {
  const fields: PlanField[] = [];

  /** Caps mirror `CategoryTranslationFields` and `SpecInputSchema` in `@mia/validators`. */
  const details = { section: SECTION.details, group: DETAILS, groupLabel: SECTION.details };
  fields.push(
    {
      ...details,
      key: `${DETAILS}.name`,
      label: 'Name',
      format: 'text',
      maxLength: 120,
      createsRow: true,
      values: form.name,
    },
    {
      ...details,
      key: `${DETAILS}.description`,
      label: 'Description',
      format: 'text',
      maxLength: 5000,
      values: form.description,
    },
  );

  form.specs.forEach((spec, index) => {
    const group = `spec:${index}`;
    const groupLabel = textFor(spec.label, SOURCE_LANGUAGE) || `Spec field ${index + 1}`;
    const base = { section: SECTION.specs, group, groupLabel, format: 'text' as const };
    fields.push(
      { ...base, key: `${group}.label`, label: 'Label', maxLength: 200, values: spec.label },
      {
        ...base,
        key: `${group}.helpText`,
        label: 'Help text',
        maxLength: 500,
        values: spec.helpText,
      },
    );

    // Options of a type that is not a select are dropped on save, so
    // translating them would be work nobody sees.
    if (!isSelectType(spec.valueType)) return;

    // One group per option: a French label written for one choice must not
    // stop the other twenty from being translated.
    spec.options.forEach((option, optionIndex) => {
      const optionGroup = `${group}.option:${optionIndex}`;
      fields.push({
        key: optionGroup,
        label: 'Option label',
        section: SECTION.options,
        group: optionGroup,
        groupLabel: `${groupLabel} · ${textFor(option.label, SOURCE_LANGUAGE) || option.value}`,
        format: 'text',
        maxLength: 200,
        values: option.label,
      });
    });
  });

  return fields;
}

/**
 * Write the accepted answers into the form. Nothing is sent — the sheet's Save
 * does that, with the same payload it builds for typed text.
 */
export function applyTranslations(form: CategoryForm, rows: TranslationRows): void {
  for (const [lang, values] of Object.entries(rows) as [
    TargetLanguageCode,
    Record<string, string>,
  ][]) {
    for (const [key, text] of Object.entries(values)) {
      const target = valueFor(form, key);
      if (target) setTextFor(target, lang, text);
    }

    // A language's row is only sent with a name AND a slug, so a translated
    // name with no slug next to it would be dropped on save. Only an empty slug
    // is filled — one somebody typed is a URL already in use.
    const name = values[`${DETAILS}.name`];
    if (name && !textFor(form.slug, lang).trim()) setTextFor(form.slug, lang, slugify(name));
  }
}

/** The localized value a key names, or `undefined` for a key the form no longer has. */
function valueFor(form: CategoryForm, key: string): LocalizedLike | undefined {
  if (key === `${DETAILS}.name`) return form.name;
  if (key === `${DETAILS}.description`) return form.description;

  const match = /^spec:(\d+)\.(label|helpText|option:(\d+))$/.exec(key);
  if (!match) return undefined;
  const spec = form.specs[Number(match[1])];
  if (!spec) return undefined;
  if (match[2] === 'label') return spec.label;
  if (match[2] === 'helpText') return spec.helpText;
  return spec.options[Number(match[3])]?.label;
}
