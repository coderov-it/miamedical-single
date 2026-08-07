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

/** `{ it: '' }` means "no value", which the API stores as null, not as a blank. */
export function localizedOrNull(value: Localized): { it: string; en?: string } | null {
  const it = value.it.trim();
  if (!it) return null;
  const en = value.en?.trim();
  return en ? { it, en } : { it };
}

export function toLocalized(
  it: string | null | undefined,
  en: string | null | undefined,
): Localized {
  return { it: it ?? '', en: en ?? undefined };
}
