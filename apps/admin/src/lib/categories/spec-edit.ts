/**
 * The editor-side shape of a category spec field.
 *
 * It is deliberately not the DTO. The DTO has `id?` for rows that exist and
 * nothing for rows that do not, which is useless as a list key — a brand new
 * row has no identity at all, and keying by index breaks the moment someone
 * reorders. `uid` is a client-only stable key; it is stripped on the way out.
 */

export interface Localized {
  it: string;
  en?: string | undefined;
}

export interface SpecOptionEdit {
  uid: string;
  /** Present only for options the server already knows about. */
  id?: string | undefined;
  value: string;
  label: Localized;
}

export interface SpecEdit {
  uid: string;
  id?: string | undefined;
  key: string;
  label: Localized;
  helpText: Localized;
  valueType: string;
  unit: string;
  isRequired: boolean;
  isFilterable: boolean;
  isComparable: boolean;
  icon: string | null;
  /** Editor-only scratch note; not persisted until the API carries a column. */
  tips: string;
  options: SpecOptionEdit[];
}

export const VALUE_TYPES = [
  { value: 'single_select', label: 'Single select' },
  { value: 'multi_select', label: 'Multiple select' },
  { value: 'boolean', label: 'Yes / No' },
  { value: 'number', label: 'Number' },
  { value: 'number_range', label: 'Number range' },
  { value: 'string', label: 'Free text' },
] as const;

export function isSelectType(valueType: string): boolean {
  return valueType === 'single_select' || valueType === 'multi_select';
}

/* Both helpers moved to `~/lib/i18n`, which builds them from the language
   registry — the two-argument `toLocalized(it, en)` could not take a third
   language without touching every call site. Re-exported here so the category
   editors keep one import. */
export { cloneLocalized, localizedFrom, localizedOrNull } from '~/lib/i18n';
