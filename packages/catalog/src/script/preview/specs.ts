/**
 * Specs twice over: one product's values, and the declarations they are read
 * through.
 *
 * Resolving is the point. `'frame-material': 'aluminium'` and `weight: { min:
 * 13, max: 14 }` are correct and unreadable; what a reviewer needs to see is
 * `Materiale telaio — Alluminio` and `Peso — 13–14 kg`, which is only knowable
 * by reading the value THROUGH the spec that declared it.
 *
 * A value whose spec key is unknown, or a select whose option key is not in the
 * declared set, is drawn in red rather than dropped. `tsc --noEmit` makes both
 * unreachable from a data file, so seeing one here means the preview was
 * pointed at something the compiler never checked.
 */
import type { AnySpec, Localized, SpecMap } from '../../lib/types.ts';
import type { AssetResolver } from './assets.ts';
import { decimal, escape, localized } from './html.ts';

const BOOLEAN_LABEL: Record<string, Localized> = {
  true: { it: 'Sì', en: 'Yes' },
  false: { it: 'No', en: 'No' },
};

const bad = (text: string): string => `<span class="bad">${escape(text)}</span>`;

const withUnit = (value: string, spec: AnySpec): string =>
  'unit' in spec && spec.unit ? `${value} <span class="unit">${escape(spec.unit)}</span>` : value;

function optionLabel(spec: AnySpec, value: string): string {
  if (!('options' in spec)) return bad(`${value} — not a select`);
  const option = spec.options[value];
  if (!option) return bad(`${value} — undeclared option`);
  return localized(option);
}

/** One authored value, read through the spec that declared it. */
export function specValue(spec: AnySpec, value: unknown): string {
  switch (spec.valueType) {
    case 'number':
      return typeof value === 'number' ? withUnit(decimal(value), spec) : bad(String(value));
    case 'number_range': {
      if (typeof value !== 'object' || value === null) return bad(String(value));
      const range = value as { min?: number; max?: number };
      const min = typeof range.min === 'number' ? decimal(range.min) : '…';
      const max = typeof range.max === 'number' ? decimal(range.max) : '…';
      return withUnit(`${min}–${max}`, spec);
    }
    case 'boolean':
      return typeof value === 'boolean'
        ? localized(BOOLEAN_LABEL[String(value)] ?? { it: String(value) })
        : bad(String(value));
    case 'single_select':
      return typeof value === 'string' ? optionLabel(spec, value) : bad(String(value));
    case 'multi_select':
      return Array.isArray(value)
        ? value.map((entry: unknown) => optionLabel(spec, String(entry))).join(', ')
        : bad(String(value));
    case 'string':
      if (typeof value === 'string') return escape(value);
      if (typeof value === 'object' && value !== null && 'it' in value)
        return localized(value as Localized);
      return bad(String(value));
  }
}

const flags = (spec: AnySpec): string =>
  [
    spec.isRequired ? 'required' : '',
    spec.isFilterable ? 'filterable' : '',
    spec.isComparable ? 'comparable' : '',
  ]
    .filter(Boolean)
    .map((flag) => `<span class="flag">${flag}</span>`)
    .join('');

/**
 * A product's values. Declared-but-empty specs are listed after the filled ones
 * rather than omitted — "this product never states its folded width" is a fact
 * about the catalogue, and it is invisible if the row is not there.
 */
export function specValues(specs: SpecMap, values: Record<string, unknown> | undefined): string {
  const given = values ?? {};
  const filled = Object.keys(specs).filter((key) => given[key] !== undefined);
  const empty = Object.keys(specs).filter((key) => given[key] === undefined);
  const stray = Object.keys(given).filter((key) => !(key in specs));
  if (filled.length === 0 && stray.length === 0) return '';

  const row = (key: string): string => {
    const spec = specs[key];
    if (!spec)
      return `<tr><td><code>${escape(key)}</code></td><td colspan="2">${bad('key not declared by the category')}</td></tr>`;
    const value = given[key];
    if (value === undefined)
      return `<tr class="unset"><td><code>${escape(key)}</code></td><td>${localized(spec.label)}</td><td class="value muted">not set</td></tr>`;
    return `<tr><td><code>${escape(key)}</code></td><td>${localized(spec.label)}</td><td class="value">${specValue(spec, value)}</td></tr>`;
  };

  return `<table class="spec-values">
    <thead><tr><th>Key</th><th>Label</th><th>Value</th></tr></thead>
    <tbody>${[...stray, ...filled, ...empty].map(row).join('')}</tbody>
    <tfoot><tr><td colspan="3">${filled.length.toString()} of ${Object.keys(specs).length.toString()} declared specs carry a value</td></tr></tfoot>
  </table>`;
}

/** Every spec a category declares, in declaration order — which is `position`. */
export function specTable(specs: SpecMap, resolve: AssetResolver): string {
  const body = Object.entries(specs)
    .map(([key, spec]) => {
      const icon = spec.icon ? resolve(spec.icon) : null;
      const iconCell = icon?.exists
        ? `<img class="spec-icon" src="${icon.href}" alt="" loading="lazy">`
        : icon
          ? bad(`icon missing: ${icon.ref}`)
          : '';
      const options =
        'options' in spec
          ? Object.entries(spec.options)
              .map(
                ([value, label]) =>
                  `<span class="option"><code>${escape(value)}</code> ${localized(label)}</span>`,
              )
              .join('')
          : '<span class="muted">—</span>';

      return `<tr>
        <td><code>${escape(key)}</code></td>
        <td>${iconCell}${localized(spec.label)}${spec.helpText ? `<span class="help">${localized(spec.helpText)}</span>` : ''}</td>
        <td class="type"><code>${escape(spec.valueType)}</code>${'unit' in spec && spec.unit ? ` <span class="unit">${escape(spec.unit)}</span>` : ''}${flags(spec)}</td>
        <td class="options">${options}</td>
      </tr>`;
    })
    .join('');

  return `<table class="specs">
    <thead><tr><th>Key</th><th>Label</th><th>Type</th><th>Options</th></tr></thead>
    <tbody>${body}</tbody>
  </table>`;
}
