/**
 * Spec constructors. One per `value_type` in the database enum, so the
 * `valueType` string is never typed by hand and a select cannot be declared
 * without its options.
 *
 * Each one is a function rather than a plain object literal for two reasons:
 * it stamps the `valueType`, and — for the two select kinds — its `const O`
 * type parameter is what keeps the option keys as literal types. Without that
 * `const`, `{ aluminium: …, steel: … }` widens to `Record<string, Localized>`
 * and a product may then claim any option value at all.
 */
import type {
  AnySpec,
  BooleanSpec,
  MultiSelectSpec,
  NumberSpec,
  RangeSpec,
  SelectSpec,
  SpecOptions,
  TextSpec,
} from './types.ts';

type Without<T> = Omit<T, 'valueType'>;

/**
 * A spec that carries its own key, so one definition can be shared by several
 * categories instead of being retyped per category:
 *
 * ```ts
 * // shared/specs.ts
 * export const maxWidth = defineSpec('max-width',
 *   spec.number({ label: { it: 'Larghezza massima' }, unit: 'cm' }));
 * export const frame = defineSpec('frame', spec.select({
 *   label: { it: 'Materiale telaio' },
 *   options: { aluminium: { it: 'Alluminio' }, steel: { it: 'Acciaio' } },
 * }));
 *
 * // a category, mixing shared and inline
 * specs: {
 *   ...maxWidth,
 *   ...frame,
 *   foldable: spec.boolean({ label: { it: 'Pieghevole' } }),
 * }
 * ```
 *
 * It returns a one-entry record rather than a spec with a `key` field, because
 * spreading a record into the `specs` literal is what keeps the key a literal
 * type — the thing an array of `{ key, … }` objects loses. A product writing
 * `'max-widht'` is still a compile error, and so is `frame: 'titanium'`.
 *
 * Reuse is an authoring convenience, not a shared row: `category_specs` is
 * keyed by `(category_id, key)`, so the same spec in three categories is three
 * rows, and each may carry its own `position` and `isFilterable`.
 */
export function defineSpec<const K extends string, const S extends AnySpec>(
  key: K,
  definition: S,
): { [P in K]: S } {
  return { [key]: definition } as { [P in K]: S };
}

/**
 * Several shared specs as one spreadable group — `...mobilityBasics` instead of
 * three spreads. Nothing more than an object, and typed as one so the keys stay
 * literal.
 */
export const specGroup = <const G extends Record<string, AnySpec>>(group: G): G => group;

/**
 * `spec.number({ label: { it: 'Larghezza seduta' }, unit: 'cm' })`
 *
 * The value a product writes is then a `number`, and `'45cm'` is a type error.
 */
export const spec = {
  /** Free text. The one spec kind whose value may be a `{ it, en }` pair. */
  text: (definition: Without<TextSpec>): TextSpec => ({ ...definition, valueType: 'string' }),

  /** A single figure, filterable through an index on `number_value`. */
  number: (definition: Without<NumberSpec>): NumberSpec => ({
    ...definition,
    valueType: 'number',
  }),

  /** `{ min, max }` — a span, for "weighs 14–16 kg". */
  range: (definition: Without<RangeSpec>): RangeSpec => ({
    ...definition,
    valueType: 'number_range',
  }),

  /** Yes/no. Filterable through an index on `boolean_value`. */
  boolean: (definition: Without<BooleanSpec>): BooleanSpec => ({
    ...definition,
    valueType: 'boolean',
  }),

  /**
   * One of a fixed set. Options are keyed by their machine value:
   *
   *   spec.select({ label: …, options: { aluminium: { it: 'Alluminio' } } })
   *
   * so the value is English, cannot repeat, and a product writing
   * `'titanium'` is told which values exist.
   */
  select: <const O extends SpecOptions>(definition: Without<SelectSpec<O>>): SelectSpec<O> => ({
    ...definition,
    valueType: 'single_select',
  }),

  /** Any number of a fixed set. The product writes an array of option keys. */
  multiSelect: <const O extends SpecOptions>(
    definition: Without<MultiSelectSpec<O>>,
  ): MultiSelectSpec<O> => ({ ...definition, valueType: 'multi_select' }),
} as const;
