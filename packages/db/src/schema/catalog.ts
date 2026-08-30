import { desc, relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { EMPTY_PRODUCT_CHIPS, type ProductChip } from './chip-types.ts';
import { termsDocuments } from './content.ts';
import { pricingMode, productStatus, questionValueType, rentalUnit, valueType } from './enums.ts';
import { languageCode, localized, localizedCheck, optionalLocalizedCheck } from './i18n.ts';
import { EMPTY_PRODUCT_MEDIA, type ProductMedia } from './media-types.ts';
import { EMPTY_RENTAL_PACKAGES, type RentalPackage } from './rental-types.ts';
import { tsvector } from './search.ts';

/**
 * The catalog domain. 15 tables: 12 entity tables (2 of them joins) and 3
 * translation tables (`product_translations`, `category_translations`,
 * `terms_document_translations` — the last in content.ts).
 *
 * i18n rule: a `*_translations` table only where PostgreSQL indexes the text
 * (full-text search, per-locale unique slugs). Every other translated label is
 * an inline `{ it, en }` jsonb column via `localized()`, with a CHECK making
 * Italian mandatory at the database level.
 *
 * Money is `numeric(12, 2)` — exact decimal, surfaced as a string by Drizzle.
 * Never parse an amount into a JS number; arithmetic goes through the server's
 * `money.ts` in bigint hundredths.
 */

// --- taxonomy ---------------------------------------------------------------

export const categories = pgTable(
  'categories',
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Stable machine handle, e.g. `letti-degenza`. Not the public slug. */
    code: text().notNull(),
    /** R2 key of a 256×256 WebP. Null = no icon. */
    icon: text(),
    position: integer().notNull().default(0),
    isActive: boolean().notNull().default(true),
    /**
     * Whether renting an aid of this category takes a security deposit. This is
     * what selects between the two contract families: deposit categories
     * (scooters, electric wheelchairs) sign the scooter contract with its
     * deposit clause, the rest sign the plain carrozzina contract.
     */
    requiresDeposit: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex('categories_code_key').on(t.code)],
);

export const categoryTranslations = pgTable(
  'category_translations',
  {
    categoryId: uuid()
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    languageCode: languageCode().notNull(),
    name: text().notNull(),
    description: text(),
    slug: text().notNull(),
    metaTitle: text(),
    metaDescription: text(),
    /** Written by the repo via `searchVectorFor()` — see search.ts for why. */
    searchVector: tsvector(),
  },
  (t) => [
    primaryKey({ columns: [t.categoryId, t.languageCode] }),
    uniqueIndex('category_translations_lang_slug_key').on(t.languageCode, t.slug),
    index('category_translations_search_idx').using('gin', t.searchVector),
  ],
);

export const categorySpecs = pgTable(
  'category_specs',
  {
    id: uuid().primaryKey().defaultRandom(),
    categoryId: uuid()
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    /** Untranslated machine key — this is what spec filters run on. */
    key: text().notNull(),
    label: localized().notNull(),
    helpText: localized(),
    valueType: valueType().notNull(),
    unit: text(),
    isRequired: boolean().notNull().default(false),
    isFilterable: boolean().notNull().default(false),
    isComparable: boolean().notNull().default(false),
    /** R2 key of a 256×256 WebP. */
    icon: text(),
    position: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('category_specs_category_key_key').on(t.categoryId, t.key),
    localizedCheck('category_specs_label_it_check', t.label),
    optionalLocalizedCheck('category_specs_help_text_it_check', t.helpText),
  ],
);

export const categorySpecOptions = pgTable(
  'category_spec_options',
  {
    id: uuid().primaryKey().defaultRandom(),
    specId: uuid()
      .notNull()
      .references(() => categorySpecs.id, { onDelete: 'cascade' }),
    /** Untranslated machine value, e.g. `acciaio` — what facet filters match. */
    value: text().notNull(),
    label: localized().notNull(),
    position: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('category_spec_options_spec_value_key').on(t.specId, t.value),
    localizedCheck('category_spec_options_label_it_check', t.label),
  ],
);

// --- products ---------------------------------------------------------------

export const products = pgTable(
  'products',
  {
    id: uuid().primaryKey().defaultRandom(),
    status: productStatus().notNull().default('draft'),
    categoryId: uuid()
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    brand: text(),
    /** Write-once: set at creation, never listed in an UPDATE. */
    pricingMode: pricingMode().notNull(),
    /**
     * What a fixed product costs. NULL exactly when `pricingMode` is `rental`
     * (CHECK below): a rental has no rate of its own, only packages.
     */
    basePrice: numeric({ precision: 12, scale: 2 }),
    /**
     * Copy, not money. The headline under a rental product's title — "da 1,10 €
     * al giorno" — typed by the back office and never derived from a package,
     * because a 3-day package at 25,00 is not three times any daily figure. No
     * total anywhere reads this column; `rentalPackages` is the whole price.
     */
    marketingRate: numeric({ precision: 12, scale: 2 }),
    currency: text().notNull().default('EUR'),
    /** NULL exactly when `pricingMode` is `fixed` (CHECK below). */
    rentalUnit: rentalUnit(),
    /**
     * THE price of a rental product — see rental-types.ts. At least one on a
     * rental product, always `[]` on a fixed one (CHECK below).
     */
    rentalPackages: jsonb().$type<RentalPackage[]>().notNull().default(EMPTY_RENTAL_PACKAGES),
    /**
     * How many are on the shelf. A product IS its stock-keeping unit — there is
     * no variant axis to count separately — so this one integer is the whole of
     * availability, and `stock > 0` is what makes a product sellable.
     *
     * Point-in-time, not a reservation: nothing decrements it at checkout and
     * nothing knows which dates a rental unit is already out on. Real
     * availability is still settled on the phone.
     */
    stock: integer().notNull().default(0),
    isFeatured: boolean().notNull().default(false),
    /**
     * How many orders have ever included this product — one per order line, not
     * per unit, so a cart of three counts once. Denormalised on purpose: it is
     * the sort key behind the catalogue's "più richiesti", and a GROUP BY over
     * `order_items` on every page of every catalogue would be a full scan of the
     * order history to paint a grid. Bumped when an order is placed, and never
     * decremented — this ranks demand, it is not a live count of open orders.
     */
    orderCount: integer().notNull().default(0),
    /**
     * Short display claims for the card and the hero — see chip-types.ts.
     * Never indexed, never searched: presentation text, not data.
     */
    chips: jsonb().$type<ProductChip[]>().notNull().default(EMPTY_PRODUCT_CHIPS),
    media: jsonb().$type<ProductMedia>().notNull().default(EMPTY_PRODUCT_MEDIA),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index('products_status_idx').on(t.status),
    index('products_category_idx').on(t.categoryId),
    index('products_created_at_idx').on(t.createdAt),
    /** Backs the `popular` sort; DESC because nothing ever asks for the least. */
    index('products_order_count_idx').on(desc(t.orderCount)),
    /**
     * FK target for `product_addons`' composite key — makes the denormalised
     * `product_pricing_mode` provably in sync with no trigger.
     */
    unique('products_id_pricing_mode_key').on(t.id, t.pricingMode),
    check(
      'products_rental_unit_check',
      sql`(${t.pricingMode} = 'rental') = (${t.rentalUnit} IS NOT NULL)`,
    ),
    /** A rate belongs to the mode that bills one. A rental bills packages. */
    check(
      'products_base_price_check',
      sql`(${t.pricingMode} = 'fixed') = (${t.basePrice} IS NOT NULL)`,
    ),
    /** Nothing to advertise a rate for on something you buy outright. */
    check(
      'products_marketing_rate_check',
      sql`${t.marketingRate} IS NULL OR ${t.pricingMode} = 'rental'`,
    ),
    /**
     * Packages ARE the rental price, so a rental product has at least one — a
     * rental with none could not be ordered, and a duration bundle on something
     * you buy outright means nothing.
     */
    check(
      'products_rental_packages_check',
      sql`CASE WHEN ${t.pricingMode} = 'rental'
                 THEN jsonb_array_length(${t.rentalPackages}) >= 1
                 ELSE ${t.rentalPackages} = '[]'::jsonb END`,
    ),
  ],
);

export const productTranslations = pgTable(
  'product_translations',
  {
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    languageCode: languageCode().notNull(),
    title: text().notNull(),
    shortDescription: text(),
    description: text(),
    slug: text().notNull(),
    metaTitle: text(),
    metaDescription: text(),
    /** Written by the repo via `searchVectorFor()` — see search.ts for why. */
    searchVector: tsvector(),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.languageCode] }),
    uniqueIndex('product_translations_lang_slug_key').on(t.languageCode, t.slug),
    index('product_translations_search_idx').using('gin', t.searchVector),
    // A GIN trigram index on `title` for admin type-to-find is hand-added in
    // the migration — drizzle-kit cannot express `gin_trgm_ops`.
  ],
);

export const productSpecValues = pgTable(
  'product_spec_values',
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    specId: uuid()
      .notNull()
      .references(() => categorySpecs.id, { onDelete: 'cascade' }),
    /** Typed columns so numeric/boolean facet filters hit a real index. */
    numberValue: numeric({ precision: 14, scale: 4 }),
    numberMin: numeric({ precision: 14, scale: 4 }),
    numberMax: numeric({ precision: 14, scale: 4 }),
    booleanValue: boolean(),
    /** Only for `string`-type specs. */
    textValue: localized(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('product_spec_values_product_spec_key').on(t.productId, t.specId),
    index('product_spec_values_spec_number_idx').on(t.specId, t.numberValue),
    index('product_spec_values_spec_boolean_idx').on(t.specId, t.booleanValue),
    optionalLocalizedCheck('product_spec_values_text_value_it_check', t.textValue),
  ],
);

/** Select-spec facets become `option_id IN (…)` — index-backed, no scan. */
export const productSpecValueOptions = pgTable(
  'product_spec_value_options',
  {
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    specId: uuid()
      .notNull()
      .references(() => categorySpecs.id, { onDelete: 'cascade' }),
    /**
     * FK named explicitly below. The derived name would be 64 bytes, and
     * PostgreSQL truncates identifiers at 63 — so the constraint landed in the
     * database one character short of what drizzle expected, and every `push`
     * saw it as missing and tried to add it again.
     */
    optionId: uuid().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.specId, t.optionId] }),
    index('product_spec_value_options_option_idx').on(t.optionId),
    foreignKey({
      columns: [t.optionId],
      foreignColumns: [categorySpecOptions.id],
      name: 'product_spec_value_options_option_fk',
    }).onDelete('cascade'),
  ],
);

// --- addons, FAQs, intake questions ----------------------------------------

export const productAddons = pgTable(
  'product_addons',
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid().notNull(),
    name: localized().notNull(),
    description: localized(),
    /** The addon's own mode — bounded by the product's (CHECK below). */
    pricingMode: pricingMode().notNull(),
    /**
     * Denormalised copy of `products.pricing_mode`, kept provably in sync by
     * the composite FK below. Safe because the parent column is write-once.
     */
    productPricingMode: pricingMode().notNull(),
    /** One-off in `fixed` mode; per `rentalUnit` in `rental` mode. */
    price: numeric({ precision: 12, scale: 2 }).notNull(),
    currency: text().notNull().default('EUR'),
    /**
     * The unit a `rental` add-on's price is quoted in. It is the add-on's own,
     * not the package's: a 3,00 €/giorno add-on on a 12-hour package bills one
     * day, because a part-day of insurance is still a day of insurance.
     */
    rentalUnit: rentalUnit(),
    minQuantity: integer().notNull().default(0),
    /**
     * How many of this add-on one line may carry. `1` is the back office
     * saying "not multiple selectable" — the storefront then offers a tick and
     * no stepper. NULL means the shared `MAX_ADDON_QUANTITY` ceiling.
     */
    maxQuantity: integer(),
    /*
      There is no `is_required` here, and that is a rule rather than an omission.
      An ADD-ON IS ALWAYS OPTIONAL — it is the extra a customer chooses on top of
      the thing they came for, so one that cannot be declined is not an add-on, it
      is part of the price of the product and belongs in the product's own rate.

      The column existed and produced exactly that confusion: a "Consegna e
      installazione" row at 60,00 € arrived pre-ticked and disabled, so the
      storefront showed a delivery charge nobody could remove on a product whose
      own description said delivery was included. Dropped in
      `0004_drop_addon_is_required`.

      Intake questions keep their own `is_required` and should — "which floor?"
      has to be answered. That constrains a CHOICE. This one constrained a
      PURCHASE.
    */
    /** R2 key of a square WebP, up to 1024×1024. */
    icon: text(),
    position: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    foreignKey({
      name: 'product_addons_product_mode_fk',
      columns: [t.productId, t.productPricingMode],
      foreignColumns: [products.id, products.pricingMode],
    }).onDelete('cascade'),
    index('product_addons_product_idx').on(t.productId),
    localizedCheck('product_addons_name_it_check', t.name),
    optionalLocalizedCheck('product_addons_description_it_check', t.description),
    /**
     * A rental addon on a sold product is meaningless — nothing comes back and
     * there is no period to bill against. Rental products may carry both modes.
     */
    check(
      'product_addons_mode_check',
      sql`${t.productPricingMode} = 'rental' OR ${t.pricingMode} = 'fixed'`,
    ),
    check(
      'product_addons_rental_unit_check',
      sql`(${t.pricingMode} = 'rental') = (${t.rentalUnit} IS NOT NULL)`,
    ),
  ],
);

export const productFaqs = pgTable(
  'product_faqs',
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    question: localized().notNull(),
    answer: localized().notNull(),
    position: integer().notNull().default(0),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('product_faqs_product_idx').on(t.productId),
    localizedCheck('product_faqs_question_it_check', t.question),
    localizedCheck('product_faqs_answer_it_check', t.answer),
  ],
);

export const productQuestions = pgTable(
  'product_questions',
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    key: text().notNull(),
    prompt: localized().notNull(),
    helpText: localized(),
    questionValueType: questionValueType().notNull(),
    isRequired: boolean().notNull().default(false),
    minValue: numeric({ precision: 14, scale: 4 }),
    maxValue: numeric({ precision: 14, scale: 4 }),
    maxLength: integer(),
    position: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('product_questions_product_key_key').on(t.productId, t.key),
    localizedCheck('product_questions_prompt_it_check', t.prompt),
    optionalLocalizedCheck('product_questions_help_text_it_check', t.helpText),
  ],
);

export const productQuestionOptions = pgTable(
  'product_question_options',
  {
    id: uuid().primaryKey().defaultRandom(),
    questionId: uuid()
      .notNull()
      .references(() => productQuestions.id, { onDelete: 'cascade' }),
    value: text().notNull(),
    label: localized().notNull(),
    position: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('product_question_options_question_value_key').on(t.questionId, t.value),
    localizedCheck('product_question_options_label_it_check', t.label),
  ],
);

// --- terms links ------------------------------------------------------------

export const productTerms = pgTable(
  'product_terms',
  {
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    /** `restrict` — a document in use cannot be deleted out from under a product. */
    termsId: uuid()
      .notNull()
      .references(() => termsDocuments.id, { onDelete: 'restrict' }),
    position: integer().notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.termsId] }),
    index('product_terms_terms_idx').on(t.termsId),
  ],
);

// --- relations --------------------------------------------------------------

export const categoriesRelations = relations(categories, ({ many }) => ({
  translations: many(categoryTranslations),
  specs: many(categorySpecs),
  products: many(products),
}));

export const categoryTranslationsRelations = relations(categoryTranslations, ({ one }) => ({
  category: one(categories, {
    fields: [categoryTranslations.categoryId],
    references: [categories.id],
  }),
}));

export const categorySpecsRelations = relations(categorySpecs, ({ one, many }) => ({
  category: one(categories, {
    fields: [categorySpecs.categoryId],
    references: [categories.id],
  }),
  options: many(categorySpecOptions),
}));

export const categorySpecOptionsRelations = relations(categorySpecOptions, ({ one }) => ({
  spec: one(categorySpecs, {
    fields: [categorySpecOptions.specId],
    references: [categorySpecs.id],
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  translations: many(productTranslations),
  specValues: many(productSpecValues),
  specValueOptions: many(productSpecValueOptions),
  addons: many(productAddons),
  faqs: many(productFaqs),
  questions: many(productQuestions),
  terms: many(productTerms),
}));

export const productTermsRelations = relations(productTerms, ({ one }) => ({
  product: one(products, { fields: [productTerms.productId], references: [products.id] }),
  terms: one(termsDocuments, {
    fields: [productTerms.termsId],
    references: [termsDocuments.id],
  }),
}));

export const productTranslationsRelations = relations(productTranslations, ({ one }) => ({
  product: one(products, {
    fields: [productTranslations.productId],
    references: [products.id],
  }),
}));

export const productSpecValuesRelations = relations(productSpecValues, ({ one }) => ({
  product: one(products, { fields: [productSpecValues.productId], references: [products.id] }),
  spec: one(categorySpecs, {
    fields: [productSpecValues.specId],
    references: [categorySpecs.id],
  }),
}));

export const productSpecValueOptionsRelations = relations(productSpecValueOptions, ({ one }) => ({
  product: one(products, {
    fields: [productSpecValueOptions.productId],
    references: [products.id],
  }),
  spec: one(categorySpecs, {
    fields: [productSpecValueOptions.specId],
    references: [categorySpecs.id],
  }),
  option: one(categorySpecOptions, {
    fields: [productSpecValueOptions.optionId],
    references: [categorySpecOptions.id],
  }),
}));

export const productAddonsRelations = relations(productAddons, ({ one }) => ({
  product: one(products, { fields: [productAddons.productId], references: [products.id] }),
}));

export const productFaqsRelations = relations(productFaqs, ({ one }) => ({
  product: one(products, { fields: [productFaqs.productId], references: [products.id] }),
}));

export const productQuestionsRelations = relations(productQuestions, ({ one, many }) => ({
  product: one(products, { fields: [productQuestions.productId], references: [products.id] }),
  options: many(productQuestionOptions),
}));

export const productQuestionOptionsRelations = relations(productQuestionOptions, ({ one }) => ({
  question: one(productQuestions, {
    fields: [productQuestionOptions.questionId],
    references: [productQuestions.id],
  }),
}));
