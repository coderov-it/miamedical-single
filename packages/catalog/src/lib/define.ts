/**
 * `defineCategory` and `defineTerms` — the two entry points a catalogue file
 * calls.
 *
 * Why a category is defined first and its products added second, rather than
 * one call taking both: object-literal excess-property checking is what turns
 * `shortDesciption` into a compile error, and it is lost whenever the target
 * type is a type parameter inferred from the same argument. Fixing the specs in
 * `defineCategory` means `.rental()` and `.fixed()` receive a CONCRETE type, so
 * every misspelled field and every unknown spec key is reported.
 *
 * The same rule is why neither `rental` nor `fixed` is generic over its
 * argument. Writing `rental<P extends RentalProductInput<S>>(product: P)` reads
 * as stricter and is the opposite: the target adapts to whatever was passed and
 * typos pass silently.
 */
import type {
  Category,
  CategoryInput,
  FixedProductInput,
  ProductInput,
  RentalProductInput,
  SpecMap,
  TermsDocument,
  TermsInput,
} from './types.ts';

export interface CategoryBuilder<S extends SpecMap> {
  readonly input: CategoryInput<S>;
  readonly products: readonly ProductInput<S>[];
  /** Priced by packages. At least one, and no `basePrice`. */
  rental(product: RentalProductInput<S>): RentalProductInput<S>;
  /** Bought outright. A `basePrice`, and no packages. */
  fixed(product: FixedProductInput<S>): FixedProductInput<S>;
  /** Attach the products written in the sibling files. */
  withProducts(products: readonly ProductInput<S>[]): Category<S>;
}

/**
 * ```ts
 * export const wheelchairs = defineCategory({
 *   code: 'wheelchairs',
 *   translations: { it: { name: 'Carrozzine', slug: 'carrozzine' } },
 *   specs: {
 *     'seat-width': spec.number({ label: { it: 'Larghezza seduta' }, unit: 'cm' }),
 *     frame: spec.select({
 *       label: { it: 'Telaio' },
 *       options: { aluminium: { it: 'Alluminio' }, steel: { it: 'Acciaio' } },
 *     }),
 *   },
 * });
 * ```
 *
 * `const S` keeps the spec keys and every option key as literal types. The
 * constraint is a `Record` and not an array on purpose — see the note on
 * `SpecMap`.
 */
export function defineCategory<const S extends SpecMap>(
  input: CategoryInput<S>,
): CategoryBuilder<S> {
  return {
    input,
    products: [],
    rental: (product) => product,
    fixed: (product) => product,
    withProducts: (products) => ({ input, products }),
  };
}

/**
 * A terms & conditions document, linkable from any number of products.
 *
 * ```ts
 * export const generalRental = defineTerms({
 *   code: 'general-rental',
 *   status: 'published',
 *   translations: {
 *     it: { title: 'Condizioni di noleggio', slug: 'condizioni-di-noleggio', body: '…' },
 *   },
 * });
 * ```
 *
 * The `__brand` is what stops a bare object being passed to a product's
 * `terms`: a document has to exist as its own row before anything can link to
 * it, so the only accepted value is one this function returned.
 */
export function defineTerms(input: TermsInput): TermsDocument {
  return { ...input, __brand: 'terms' };
}
