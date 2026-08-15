import * as v from 'valibot';

import {
  CurrencySchema,
  MoneySchema,
  PaginationSchema,
  SignedMoneySchema,
  SlugSchema,
  UuidSchema,
} from './common.ts';
import { LocaleQuerySchema, localizedSchema, translationsSchema } from './i18n.ts';
import { MediaPathSchema, ProductMediaSchema } from './media.ts';

export const ProductStatusSchema = v.picklist(['draft', 'active', 'archived']);
export const PricingModeSchema = v.picklist(['fixed', 'rental']);
export const RentalUnitSchema = v.picklist(['hour', 'day']);
export const ValueTypeSchema = v.picklist([
  'string',
  'number',
  'single_select',
  'multi_select',
  'boolean',
  'number_range',
]);
export const QuestionValueTypeSchema = v.picklist([
  'string',
  'text',
  'number',
  'single_select',
  'multi_select',
  'boolean',
  'date',
]);

const KeySchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(64),
  v.regex(/^[a-z0-9]+(?:[_-][a-z0-9]+)*$/, 'Use lowercase letters, numbers, - and _.'),
);

const SkuFragmentSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(64),
  v.regex(/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/i, 'Use letters, numbers and hyphens.'),
  v.toUpperCase(),
);

const FiniteNumberSchema = v.pipe(v.number(), v.finite());
const PositionSchema = v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)), 0);

// --- rental packages -------------------------------------------------------

/**
 * A fixed-duration offer, and the only way a rental is priced. The price is a
 * total the back office typed — nothing here derives it from anything, and no
 * check compares it to `marketingRate`: the headline is copy and the package is
 * money, and the shop means both numbers even when they disagree.
 */
export const RentalPackageSchema = v.strictObject({
  code: KeySchema,
  name: localizedSchema(120),
  price: MoneySchema,
  /** Ten years of days is well past any real rental and still catches a typo. */
  duration: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(3650)),
  unit: RentalUnitSchema,
});

/**
 * The upper bound lives here rather than in a database CHECK, matching how
 * `ProductMediaSchema` caps `gallery`. 15 is the client's stated ceiling.
 *
 * The LOWER bound is a CHECK as well as a rule here, because it is an integrity
 * claim rather than a presentation one: a rental product with no packages has no
 * price, and no path may leave one in the table.
 */
export const RentalPackagesSchema = v.pipe(
  v.array(RentalPackageSchema),
  v.minLength(1, 'A rental product needs at least one package.'),
  v.maxLength(15, 'A product can have at most 15 rental packages.'),
  v.check(
    (packages) => new Set(packages.map((item) => item.code)).size === packages.length,
    'Package codes must be unique within a product.',
  ),
);

// --- chips -----------------------------------------------------------------

/**
 * The card/hero chips. 20 characters is the presentation ceiling, not a
 * storage one: the card gives chips a single cropped line, so anything longer
 * pushes its neighbours out of sight. Five is the ceiling, three reads best —
 * the admin says so next to the field.
 *
 * Blank chips are rejected rather than dropped: a client that renders an empty
 * row must not silently save it as a chip, and `localizedSchema` already makes
 * Italian mandatory per entry.
 */
export const ProductChipSchema = localizedSchema(20);

export const ProductChipsSchema = v.pipe(
  v.array(ProductChipSchema),
  v.maxLength(5, 'A product can show at most 5 chips.'),
  v.check(
    (chips) => new Set(chips.map((chip) => chip.it.toLowerCase())).size === chips.length,
    'Chips must not repeat.',
  ),
);

// --- product ---------------------------------------------------------------

export const ProductTranslationFields = {
  title: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(200)),
  shortDescription: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(500)))),
  /**
   * Rich text (HTML from the admin's editor), so the cap counts markup as well
   * as prose — 20k of tags and 20k of words is still a long product page. The
   * server sanitises it against an allowlist before storing; this only bounds
   * the request body.
   */
  description: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(40_000)))),
  slug: SlugSchema,
  metaTitle: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(200)))),
  metaDescription: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(400)))),
};

export const ProductTranslationsSchema = translationsSchema(ProductTranslationFields);

export const CreateProductSchema = v.pipe(
  v.strictObject({
    baseSku: SkuFragmentSchema,
    categoryId: UuidSchema,
    status: v.optional(ProductStatusSchema, 'draft'),
    brand: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(120)))),
    /** Write-once. `UpdateProductSchema` deliberately omits it. */
    pricingMode: PricingModeSchema,
    /** Fixed products only — a rental is priced by its packages. */
    basePrice: v.optional(v.nullable(MoneySchema)),
    /** Rental products only, and display copy even there. */
    marketingRate: v.optional(v.nullable(MoneySchema)),
    currency: v.optional(CurrencySchema, 'EUR'),
    rentalUnit: v.optional(v.nullable(RentalUnitSchema)),
    /**
     * Required at creation on a rental, unlike every other pricing detail that
     * can be filled in later: without one the product has no price at all, and
     * the CHECK on `products` would refuse the INSERT anyway.
     */
    rentalPackages: v.optional(RentalPackagesSchema),
    isFeatured: v.optional(v.boolean(), false),
    chips: v.optional(ProductChipsSchema, []),
    translations: ProductTranslationsSchema,
  }),
  v.forward(
    v.partialCheck(
      [['pricingMode'], ['rentalUnit']],
      (input) => (input.pricingMode === 'rental') === (input.rentalUnit != null),
      'Rental products need a rental unit; fixed-price ones must not have one.',
    ),
    ['rentalUnit'],
  ),
  v.forward(
    v.partialCheck(
      [['pricingMode'], ['basePrice']],
      (input) => (input.pricingMode === 'fixed') === (input.basePrice != null),
      'Fixed-price products need a base price; rental ones are priced by their packages.',
    ),
    ['basePrice'],
  ),
  v.forward(
    v.partialCheck(
      [['pricingMode'], ['marketingRate']],
      (input) => input.marketingRate == null || input.pricingMode === 'rental',
      'Only rental products carry a marketing rate.',
    ),
    ['marketingRate'],
  ),
  v.forward(
    v.partialCheck(
      [['pricingMode'], ['rentalPackages']],
      (input) => (input.pricingMode === 'rental') === (input.rentalPackages != null),
      'Rental products need at least one package; fixed-price ones must not have any.',
    ),
    ['rentalPackages'],
  ),
);

/**
 * `pricingMode` is not here — immutability is expressed in the contract, and
 * the repo's UPDATE never lists the column either.
 */
export const UpdateProductSchema = v.pipe(
  v.partial(
    v.strictObject({
      baseSku: SkuFragmentSchema,
      categoryId: UuidSchema,
      status: ProductStatusSchema,
      brand: v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(120))),
      /** Rejected on a rental product by the service, which has no rate to set. */
      basePrice: MoneySchema,
      /** Rejected on a fixed product by the service. Display copy, never priced. */
      marketingRate: v.nullable(MoneySchema),
      currency: CurrencySchema,
      /** hour ↔ day is legal on a rental product; the service rejects it on fixed. */
      rentalUnit: RentalUnitSchema,
      isFeatured: v.boolean(),
      /** Replaces the whole list, like `rentalPackages` — `[]` clears it. */
      chips: ProductChipsSchema,
      translations: ProductTranslationsSchema,
      media: ProductMediaSchema,
      /**
       * Replaces the whole list and may never empty it: `RentalPackagesSchema`
       * requires one. Rejected on a fixed product by the service, as `rentalUnit` is.
       */
      rentalPackages: RentalPackagesSchema,
    }),
  ),
);

export const ProductQuerySchema = v.object({
  ...PaginationSchema.entries,
  locale: LocaleQuerySchema,
  q: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(120))),
  /** Category `code`. */
  category: v.optional(KeySchema),
  status: v.optional(ProductStatusSchema),
  featured: v.optional(
    v.pipe(
      v.picklist(['true', 'false']),
      v.transform((value) => value === 'true'),
    ),
  ),
  sort: v.optional(v.picklist(['newest', 'price_asc', 'price_desc', 'title']), 'newest'),
  /**
   * Spec facet filters, `key:value|value;key:value`. Keys are validated
   * against the category's `is_filterable` specs in the service.
   */
  specs: v.optional(v.pipe(v.string(), v.maxLength(500))),
});

export const ProductSlugParamSchema = v.object({ slug: SlugSchema });
export const LocaleOnlyQuerySchema = v.object({ locale: LocaleQuerySchema });

// --- variants --------------------------------------------------------------

export const VariantOptionInputSchema = v.strictObject({
  id: v.optional(UuidSchema),
  value: KeySchema,
  label: localizedSchema(120),
  skuCode: v.optional(v.nullable(SkuFragmentSchema)),
  priceModifier: v.optional(SignedMoneySchema, '0.00'),
  isDefault: v.optional(v.boolean(), false),
  position: PositionSchema,
});

export const VariantGroupInputSchema = v.pipe(
  v.strictObject({
    id: v.optional(UuidSchema),
    key: KeySchema,
    label: localizedSchema(120),
    helpText: v.optional(v.nullable(localizedSchema(500))),
    valueType: ValueTypeSchema,
    unit: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(20)))),
    isRequired: v.optional(v.boolean(), false),
    affectsSku: v.optional(v.boolean(), false),
    sourcePresetKey: v.optional(v.nullable(KeySchema)),
    minValue: v.optional(v.nullable(FiniteNumberSchema)),
    maxValue: v.optional(v.nullable(FiniteNumberSchema)),
    stepValue: v.optional(v.nullable(FiniteNumberSchema)),
    priceModifierPerUnit: v.optional(v.nullable(SignedMoneySchema)),
    icon: v.optional(v.nullable(MediaPathSchema)),
    position: PositionSchema,
    options: v.optional(v.pipe(v.array(VariantOptionInputSchema), v.maxLength(50)), []),
  }),
  v.forward(
    v.partialCheck(
      [['valueType'], ['affectsSku']],
      (input) => !input.affectsSku || ['single_select', 'boolean'].includes(input.valueType),
      'Only single-select and yes/no variants can join the SKU matrix.',
    ),
    ['affectsSku'],
  ),
  v.forward(
    v.partialCheck(
      [['valueType'], ['options']],
      (input) =>
        ['single_select', 'multi_select'].includes(input.valueType)
          ? (input.options?.length ?? 0) > 0
          : true,
      'Select variants need at least one option.',
    ),
    ['options'],
  ),
);

export const SkuUpdateSchema = v.partial(
  v.strictObject({
    priceOverride: v.nullable(MoneySchema),
    stock: v.pipe(v.number(), v.integer(), v.minValue(0)),
    isActive: v.boolean(),
    position: v.pipe(v.number(), v.integer(), v.minValue(0)),
  }),
);

// --- spec values -----------------------------------------------------------

export const SpecValueInputSchema = v.strictObject({
  specId: UuidSchema,
  numberValue: v.optional(v.nullable(FiniteNumberSchema)),
  numberMin: v.optional(v.nullable(FiniteNumberSchema)),
  numberMax: v.optional(v.nullable(FiniteNumberSchema)),
  booleanValue: v.optional(v.nullable(v.boolean())),
  textValue: v.optional(v.nullable(localizedSchema(500))),
  optionIds: v.optional(v.pipe(v.array(UuidSchema), v.maxLength(50)), []),
});

export const SpecValuesInputSchema = v.pipe(v.array(SpecValueInputSchema), v.maxLength(100));

// --- addons ----------------------------------------------------------------

export const AddonInputSchema = v.pipe(
  v.strictObject({
    id: v.optional(UuidSchema),
    name: localizedSchema(200),
    description: v.optional(v.nullable(localizedSchema(2000))),
    sku: v.optional(v.nullable(SkuFragmentSchema)),
    /**
     * The addon's own mode. Schema checks internal consistency; the service
     * and a DB CHECK enforce the product-mode bound (fixed product → fixed
     * addons only).
     */
    pricingMode: PricingModeSchema,
    price: MoneySchema,
    currency: v.optional(CurrencySchema, 'EUR'),
    rentalUnit: v.optional(v.nullable(RentalUnitSchema)),
    minQuantity: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)), 0),
    maxQuantity: v.optional(v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1)))),
    icon: v.optional(v.nullable(MediaPathSchema)),
    position: PositionSchema,
  }),
  v.forward(
    v.partialCheck(
      [['pricingMode'], ['rentalUnit']],
      (input) => (input.pricingMode === 'rental') === (input.rentalUnit != null),
      'Rental addons need a rental unit; fixed-price ones must not have one.',
    ),
    ['rentalUnit'],
  ),
  v.forward(
    v.partialCheck(
      [['minQuantity'], ['maxQuantity']],
      (input) => input.maxQuantity == null || input.maxQuantity >= input.minQuantity,
      'Maximum quantity cannot be below the minimum.',
    ),
    ['maxQuantity'],
  ),
);

// --- FAQs ------------------------------------------------------------------

export const FaqInputSchema = v.strictObject({
  id: v.optional(UuidSchema),
  question: localizedSchema(500),
  answer: localizedSchema(5000),
  position: PositionSchema,
  isActive: v.optional(v.boolean(), true),
});

// --- intake questions ------------------------------------------------------

export const QuestionOptionInputSchema = v.strictObject({
  id: v.optional(UuidSchema),
  value: KeySchema,
  label: localizedSchema(200),
  position: PositionSchema,
});

export const QuestionInputSchema = v.pipe(
  v.strictObject({
    id: v.optional(UuidSchema),
    key: KeySchema,
    prompt: localizedSchema(500),
    helpText: v.optional(v.nullable(localizedSchema(1000))),
    questionValueType: QuestionValueTypeSchema,
    isRequired: v.optional(v.boolean(), false),
    minValue: v.optional(v.nullable(FiniteNumberSchema)),
    maxValue: v.optional(v.nullable(FiniteNumberSchema)),
    maxLength: v.optional(v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1)))),
    position: PositionSchema,
    options: v.optional(v.pipe(v.array(QuestionOptionInputSchema), v.maxLength(50)), []),
  }),
  v.forward(
    v.partialCheck(
      [['questionValueType'], ['options']],
      (input) =>
        ['single_select', 'multi_select'].includes(input.questionValueType)
          ? (input.options?.length ?? 0) > 0
          : true,
      'Select questions need at least one option.',
    ),
    ['options'],
  ),
);

// --- terms links -----------------------------------------------------------

export const ProductTermsInputSchema = v.pipe(
  v.array(v.strictObject({ termsId: UuidSchema, position: PositionSchema })),
  v.maxLength(20),
);

/**
 * The enum unions, named. These are machine tokens — never translated in the
 * database. Their display strings live in `@mia/i18n`, which keys its label
 * catalogs off exactly these types so a new member fails the build until it
 * has been labelled in both languages.
 */
export type ProductStatus = v.InferOutput<typeof ProductStatusSchema>;
export type PricingMode = v.InferOutput<typeof PricingModeSchema>;
export type RentalUnit = v.InferOutput<typeof RentalUnitSchema>;
export type ValueType = v.InferOutput<typeof ValueTypeSchema>;
export type QuestionValueType = v.InferOutput<typeof QuestionValueTypeSchema>;

export type RentalPackageInput = v.InferOutput<typeof RentalPackageSchema>;
export type ProductChipInput = v.InferOutput<typeof ProductChipSchema>;

export type CreateProductInput = v.InferOutput<typeof CreateProductSchema>;
export type UpdateProductInput = v.InferOutput<typeof UpdateProductSchema>;
export type ProductQuery = v.InferOutput<typeof ProductQuerySchema>;
export type VariantGroupInput = v.InferOutput<typeof VariantGroupInputSchema>;
export type VariantOptionInput = v.InferOutput<typeof VariantOptionInputSchema>;
export type SkuUpdateInput = v.InferOutput<typeof SkuUpdateSchema>;
export type SpecValueInput = v.InferOutput<typeof SpecValueInputSchema>;
export type AddonInput = v.InferOutput<typeof AddonInputSchema>;
export type FaqInput = v.InferOutput<typeof FaqInputSchema>;
export type QuestionInput = v.InferOutput<typeof QuestionInputSchema>;
export type ProductTermsInput = v.InferOutput<typeof ProductTermsInputSchema>;
