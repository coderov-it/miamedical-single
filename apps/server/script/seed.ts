import { count, createDatabase, eq } from '@mia/db';
import type { LanguageCode } from '@mia/db/schema';
import {
  attributePresetOptions,
  attributePresets,
  cartItems,
  carts,
  categories,
  categorySpecOptions,
  categorySpecs,
  categoryTranslations,
  orderItems,
  orders,
  orderStatusEvents,
  productAddons,
  productFaqs,
  productQuestionOptions,
  productQuestions,
  productSkuOptions,
  productSkus,
  productSpecValueOptions,
  productSpecValues,
  productTerms,
  productTranslations,
  productVariantGroups,
  productVariantOptions,
  products,
  searchVectorFor,
  termsDocumentTranslations,
  termsDocuments,
} from '@mia/db/schema';

import { env } from '../src/config/env.ts';
import {
  composeSku,
  generateCombinations,
  randomSuffix,
} from '../src/modules/products/variants/sku.ts';
import { applyAdminAccount } from './admin-account.ts';

/**
 * Development seed for the catalog domain: the attribute preset library, two
 * categories with filterable/comparable specs, one FIXED product and one
 * RENTAL (per-day) product covering every variant value type, a generated SKU
 * matrix, addons following the mode rule (rental product → rental + fixed
 * addons; fixed product → fixed only), FAQs, intake questions and a published
 * terms document.
 *
 * Italian is populated everywhere. English is deliberately missing on a
 * subset — on translation rows AND on jsonb labels — so the `en → it`
 * fallback is exercised for both storage styles rather than assumed.
 *
 * Media: without R2 credentials there is nothing to upload, so `media` stays
 * empty and icons stay null — the seed never stores a path whose object does
 * not exist. Upload flows are exercised through the admin.
 */

const db = createDatabase({ url: env.DATABASE_URL, logger: false });

const tr = (
  lang: LanguageCode,
  title: string,
  body: string | null,
): ReturnType<typeof searchVectorFor> => searchVectorFor(lang, title, body);

console.log('Seeding catalog…');

// --- attribute presets ------------------------------------------------------

const PRESETS = [
  {
    key: 'altezza',
    label: { it: 'Altezza', en: 'Height' },
    valueType: 'number' as const,
    unit: 'cm',
    options: [],
  },
  {
    key: 'peso',
    label: { it: 'Peso', en: 'Weight' },
    valueType: 'number' as const,
    unit: 'kg',
    options: [],
  },
  {
    key: 'materiale',
    label: { it: 'Materiale' }, // en missing on purpose — jsonb fallback
    valueType: 'single_select' as const,
    unit: null,
    options: [
      { value: 'acciaio', label: { it: 'Acciaio', en: 'Steel' }, skuCode: 'ACC' },
      { value: 'alluminio', label: { it: 'Alluminio', en: 'Aluminium' }, skuCode: 'ALU' },
    ],
  },
  {
    key: 'colore',
    label: { it: 'Colore', en: 'Colour' },
    valueType: 'single_select' as const,
    unit: null,
    options: [
      { value: 'bianco', label: { it: 'Bianco', en: 'White' }, skuCode: 'BIA' },
      { value: 'grigio', label: { it: 'Grigio' }, skuCode: 'GRI' }, // en missing
      { value: 'blu', label: { it: 'Blu', en: 'Blue' }, skuCode: 'BLU' },
    ],
  },
  {
    key: 'taglia',
    label: { it: 'Taglia', en: 'Size' },
    valueType: 'single_select' as const,
    unit: null,
    options: [
      { value: 's', label: { it: 'S' }, skuCode: 'S' },
      { value: 'm', label: { it: 'M' }, skuCode: 'M' },
      { value: 'l', label: { it: 'L' }, skuCode: 'L' },
    ],
  },
  {
    key: 'marca',
    label: { it: 'Marca', en: 'Brand' },
    valueType: 'string' as const,
    unit: null,
    options: [],
  },
];

for (const [index, preset] of PRESETS.entries()) {
  const [inserted] = await db
    .insert(attributePresets)
    .values({
      key: preset.key,
      label: preset.label,
      valueType: preset.valueType,
      unit: preset.unit,
      position: index,
    })
    .onConflictDoNothing()
    .returning({ id: attributePresets.id });
  if (inserted && preset.options.length > 0) {
    await db.insert(attributePresetOptions).values(
      preset.options.map((option, position) => ({
        presetId: inserted.id,
        value: option.value,
        label: option.label,
        skuCode: option.skuCode,
        position,
      })),
    );
  }
}
console.log(`  ✓ ${PRESETS.length} attribute presets`);

// --- terms document ---------------------------------------------------------

let termsId: string | undefined;
{
  const [inserted] = await db
    .insert(termsDocuments)
    .values({ code: 'noleggio-standard', status: 'published', version: 3, publishedAt: new Date() })
    .onConflictDoNothing()
    .returning({ id: termsDocuments.id });
  if (inserted) {
    termsId = inserted.id;
    await db.insert(termsDocumentTranslations).values([
      {
        termsId: inserted.id,
        languageCode: 'it',
        title: 'Condizioni generali di noleggio',
        body: 'Il noleggio decorre dalla data di consegna. Il materiale resta di proprietà di MiaMedical…',
        slug: 'condizioni-di-noleggio',
      },
      {
        termsId: inserted.id,
        languageCode: 'en',
        title: 'General rental terms',
        body: 'The rental period starts on the delivery date. All equipment remains the property of MiaMedical…',
        slug: 'rental-terms',
      },
    ]);
    console.log('  ✓ terms document noleggio-standard');
  } else {
    const existing = await db.query.termsDocuments.findFirst({
      where: eq(termsDocuments.code, 'noleggio-standard'),
      columns: { id: true },
    });
    termsId = existing?.id;
    console.log('  · terms document already exists, skipping');
  }
}

// --- categories with specs --------------------------------------------------

interface SpecSeed {
  key: string;
  label: { it: string; en?: string };
  valueType: 'string' | 'number' | 'single_select' | 'multi_select' | 'boolean' | 'number_range';
  unit?: string;
  isRequired?: boolean;
  isFilterable?: boolean;
  isComparable?: boolean;
  options?: { value: string; label: { it: string; en?: string } }[];
}

async function seedCategory(
  code: string,
  position: number,
  translations: Partial<
    Record<LanguageCode, { name: string; description: string | null; slug: string }>
  >,
  specs: SpecSeed[],
): Promise<{
  id: string;
  specIds: Map<string, { id: string; optionIds: Map<string, string> }>;
} | null> {
  const [inserted] = await db
    .insert(categories)
    .values({ code, position })
    .onConflictDoNothing()
    .returning({ id: categories.id });
  if (!inserted) {
    console.log(`  · category ${code} already exists, skipping`);
    return null;
  }

  for (const [lang, t] of Object.entries(translations)) {
    if (!t) continue;
    await db.insert(categoryTranslations).values({
      categoryId: inserted.id,
      languageCode: lang as LanguageCode,
      name: t.name,
      description: t.description,
      slug: t.slug,
      searchVector: tr(lang as LanguageCode, t.name, t.description) as unknown as string,
    });
  }

  const specIds = new Map<string, { id: string; optionIds: Map<string, string> }>();
  for (const [index, spec] of specs.entries()) {
    const [specRow] = await db
      .insert(categorySpecs)
      .values({
        categoryId: inserted.id,
        key: spec.key,
        label: spec.label,
        valueType: spec.valueType,
        unit: spec.unit ?? null,
        isRequired: spec.isRequired ?? false,
        isFilterable: spec.isFilterable ?? false,
        isComparable: spec.isComparable ?? false,
        position: index,
      })
      .returning({ id: categorySpecs.id });
    if (!specRow) continue;

    const optionIds = new Map<string, string>();
    for (const [optIndex, option] of (spec.options ?? []).entries()) {
      const [optionRow] = await db
        .insert(categorySpecOptions)
        .values({
          specId: specRow.id,
          value: option.value,
          label: option.label,
          position: optIndex,
        })
        .returning({ id: categorySpecOptions.id });
      if (optionRow) optionIds.set(option.value, optionRow.id);
    }
    specIds.set(spec.key, { id: specRow.id, optionIds });
  }

  console.log(`  ✓ category ${code} (${specs.length} specs)`);
  return { id: inserted.id, specIds };
}

const letti = await seedCategory(
  'letti-degenza',
  0,
  {
    it: {
      name: 'Letti da degenza',
      description: 'Letti elettrici e manuali per assistenza domiciliare.',
      slug: 'letti-da-degenza',
    },
    en: {
      name: 'Hospital beds',
      description: 'Electric and manual beds for home care.',
      slug: 'hospital-beds',
    },
  },
  [
    {
      key: 'larghezza-rete',
      label: { it: 'Larghezza rete', en: 'Base width' },
      valueType: 'number',
      unit: 'cm',
      isRequired: true,
      isFilterable: true,
      isComparable: true,
    },
    {
      key: 'portata-massima',
      label: { it: 'Portata massima', en: 'Maximum load' },
      valueType: 'number',
      unit: 'kg',
      isFilterable: true,
      isComparable: true,
    },
    {
      key: 'materiale-struttura',
      label: { it: 'Materiale struttura' }, // en missing on purpose
      valueType: 'single_select',
      isFilterable: true,
      isComparable: true,
      options: [
        { value: 'acciaio', label: { it: 'Acciaio verniciato', en: 'Powder-coated steel' } },
        { value: 'alluminio', label: { it: 'Alluminio' } },
      ],
    },
    {
      key: 'certificazione-ce',
      label: { it: 'Certificazione CE', en: 'CE certification' },
      valueType: 'boolean',
      isFilterable: true,
    },
  ],
);

const carrozzine = await seedCategory(
  'carrozzine',
  1,
  {
    it: {
      name: 'Carrozzine',
      description: 'Carrozzine pieghevoli e superleggere.',
      slug: 'carrozzine',
    },
    en: {
      name: 'Wheelchairs',
      description: 'Folding and ultralight wheelchairs.',
      slug: 'wheelchairs',
    },
  },
  [
    {
      key: 'peso',
      label: { it: 'Peso', en: 'Weight' },
      valueType: 'number',
      unit: 'kg',
      isFilterable: true,
      isComparable: true,
    },
    {
      key: 'larghezza-seduta',
      label: { it: 'Larghezza seduta', en: 'Seat width' },
      valueType: 'number_range',
      unit: 'cm',
      isFilterable: true,
      isComparable: true,
    },
    {
      key: 'pieghevole',
      label: { it: 'Pieghevole', en: 'Foldable' },
      valueType: 'boolean',
      isFilterable: true,
      isComparable: true,
    },
  ],
);

// --- products ---------------------------------------------------------------

interface VariantSeed {
  key: string;
  label: { it: string; en?: string };
  helpText?: { it: string; en?: string };
  valueType: 'string' | 'number' | 'single_select' | 'multi_select' | 'boolean' | 'number_range';
  unit?: string;
  isRequired?: boolean;
  affectsSku?: boolean;
  sourcePresetKey?: string;
  minValue?: number;
  maxValue?: number;
  stepValue?: number;
  priceModifierPerUnit?: string;
  options?: {
    value: string;
    label: { it: string; en?: string };
    skuCode?: string;
    priceModifier?: string;
    isDefault?: boolean;
  }[];
}

async function seedVariants(productId: string, variants: VariantSeed[]) {
  const groups = [];
  for (const [index, variant] of variants.entries()) {
    const [group] = await db
      .insert(productVariantGroups)
      .values({
        productId,
        key: variant.key,
        label: variant.label,
        helpText: variant.helpText ?? null,
        valueType: variant.valueType,
        unit: variant.unit ?? null,
        isRequired: variant.isRequired ?? false,
        affectsSku: variant.affectsSku ?? false,
        sourcePresetKey: variant.sourcePresetKey ?? null,
        minValue: variant.minValue === undefined ? null : String(variant.minValue),
        maxValue: variant.maxValue === undefined ? null : String(variant.maxValue),
        stepValue: variant.stepValue === undefined ? null : String(variant.stepValue),
        priceModifierPerUnit: variant.priceModifierPerUnit ?? null,
        position: index,
      })
      .returning();
    if (!group) continue;

    const options = [];
    for (const [optIndex, option] of (variant.options ?? []).entries()) {
      const [optionRow] = await db
        .insert(productVariantOptions)
        .values({
          groupId: group.id,
          value: option.value,
          label: option.label,
          skuCode: option.skuCode ?? null,
          priceModifier: option.priceModifier ?? '0.00',
          isDefault: option.isDefault ?? false,
          position: optIndex,
        })
        .returning();
      if (optionRow) options.push(optionRow);
    }
    groups.push({ ...group, options });
  }
  return groups;
}

async function seedSkuMatrix(
  productId: string,
  baseSku: string,
  groups: Awaited<ReturnType<typeof seedVariants>>,
  stocks: number[],
) {
  const combos = generateCombinations(groups);
  const optionGroup = new Map(groups.flatMap((g) => g.options.map((o) => [o.id, g.id])));
  for (const [index, combo] of combos.entries()) {
    const suffix = randomSuffix();
    const [sku] = await db
      .insert(productSkus)
      .values({
        productId,
        sku: composeSku(baseSku, combo.codes, suffix),
        suffix,
        comboKey: combo.comboKey,
        stock: stocks[index % stocks.length] ?? 0,
        position: index,
      })
      .returning({ id: productSkus.id });
    if (!sku) continue;
    await db.insert(productSkuOptions).values(
      combo.optionIds.map((optionId) => ({
        skuId: sku.id,
        optionId,
        groupId: optionGroup.get(optionId)!,
      })),
    );
  }
  return combos.length;
}

// -- the RENTAL product (per day) --------------------------------------------

if (letti) {
  const [product] = await db
    .insert(products)
    .values({
      baseSku: 'MIA-LTE',
      status: 'active',
      categoryId: letti.id,
      brand: 'MiaMedical',
      pricingMode: 'rental',
      /* No base price: a rental IS its packages. `marketingRate` is the headline
         under the title, and the packages below are what anything costs — note
         that 3 × 35,00 is not 89,00, which is the whole point of typing both. */
      basePrice: null,
      marketingRate: '35.00',
      currency: 'EUR',
      rentalUnit: 'day',
      rentalPackages: [
        {
          code: '3-day',
          name: { it: '3 giorni', en: '3 days' },
          price: '89.00',
          duration: 3,
          unit: 'day',
        },
        {
          code: '7-day',
          name: { it: '7 giorni', en: '7 days' },
          price: '180.00',
          duration: 7,
          unit: 'day',
        },
        {
          code: '30-day',
          name: { it: '30 giorni', en: '30 days' },
          price: '600.00',
          duration: 30,
          unit: 'day',
        },
      ],
      isFeatured: true,
      /** Three claims, ≤20 characters each — what the chip rule looks like applied. */
      chips: [
        { it: 'Portata 170 kg', en: 'Holds 170 kg' },
        { it: '3 snodi elettrici', en: '3 electric joints' },
        { it: 'Consegna in 48 h', en: 'Delivery in 48 h' },
      ],
    })
    .onConflictDoNothing()
    .returning({ id: products.id });

  if (product) {
    await db.insert(productTranslations).values([
      {
        productId: product.id,
        languageCode: 'it',
        title: 'Letto da degenza elettrico a 3 snodi',
        shortDescription: 'Letto elettrico regolabile per assistenza domiciliare.',
        description:
          '<p>Struttura in acciaio verniciato a polveri, rete a doghe in faggio, movimentazione elettrica a 3 snodi con pulsantiera. Ideale per il noleggio a domicilio.</p><h2>Cosa comprende il noleggio</h2><ul><li><p>Consegna, montaggio e ritiro a fine periodo</p></li><li><p>Sanificazione certificata prima di ogni consegna</p></li><li><p>Assistenza telefonica per tutta la durata</p></li></ul>',
        slug: 'letto-degenza-elettrico',
        metaTitle: 'Letto da degenza elettrico | MiaMedical',
        metaDescription: 'Noleggio letto da degenza elettrico a 3 snodi.',
        searchVector: tr(
          'it',
          'Letto da degenza elettrico a 3 snodi',
          'Letto elettrico regolabile per assistenza domiciliare. Struttura in acciaio verniciato a polveri.',
        ) as unknown as string,
      },
      {
        // English row is deliberately partial: no description, no meta.
        productId: product.id,
        languageCode: 'en',
        title: '3-section electric hospital bed',
        shortDescription: 'Adjustable electric bed for home care.',
        description: null,
        slug: 'hospital-electric-bed',
        metaTitle: null,
        metaDescription: null,
        searchVector: tr(
          'en',
          '3-section electric hospital bed',
          'Adjustable electric bed for home care.',
        ) as unknown as string,
      },
    ]);

    const groups = await seedVariants(product.id, [
      {
        key: 'colore',
        label: { it: 'Colore', en: 'Colour' },
        valueType: 'single_select',
        isRequired: true,
        affectsSku: true,
        sourcePresetKey: 'colore',
        options: [
          {
            value: 'bianco',
            label: { it: 'Bianco', en: 'White' },
            skuCode: 'BIA',
            isDefault: true,
          },
          { value: 'grigio', label: { it: 'Grigio' }, skuCode: 'GRI', priceModifier: '4.00' },
        ],
      },
      {
        key: 'sponde',
        label: { it: 'Sponde laterali', en: 'Side rails' },
        valueType: 'boolean',
        isRequired: true,
        affectsSku: true,
        options: [
          {
            value: 'no',
            label: { it: 'Senza sponde', en: 'Without rails' },
            skuCode: 'NS',
            isDefault: true,
          },
          { value: 'si', label: { it: 'Con sponde' }, skuCode: 'CS', priceModifier: '6.00' },
        ],
      },
      {
        key: 'altezza-materasso',
        label: { it: 'Altezza materasso', en: 'Mattress height' },
        helpText: { it: 'Da 10 a 22 cm, a passi di 2.' },
        valueType: 'number_range',
        unit: 'cm',
        minValue: 10,
        maxValue: 22,
        stepValue: 2,
        priceModifierPerUnit: '0.25',
      },
      {
        key: 'accessori',
        label: { it: 'Accessori inclusi', en: 'Included accessories' },
        valueType: 'multi_select',
        options: [
          { value: 'asta-sollevamento', label: { it: 'Asta di sollevamento', en: 'Lifting pole' } },
          { value: 'porta-flebo', label: { it: 'Porta flebo' } },
        ],
      },
      {
        key: 'note-consegna',
        label: { it: 'Note per la consegna', en: 'Delivery notes' },
        valueType: 'string',
      },
    ]);
    const skuCount = await seedSkuMatrix(product.id, 'MIA-LTE', groups, [6, 0, 3, 2]);

    // Spec values: 90 cm, 170 kg, acciaio, CE.
    const spec = (key: string) => letti.specIds.get(key)!;
    await db.insert(productSpecValues).values([
      { productId: product.id, specId: spec('larghezza-rete').id, numberValue: '90' },
      { productId: product.id, specId: spec('portata-massima').id, numberValue: '170' },
      { productId: product.id, specId: spec('certificazione-ce').id, booleanValue: true },
    ]);
    await db.insert(productSpecValueOptions).values({
      productId: product.id,
      specId: spec('materiale-struttura').id,
      optionId: spec('materiale-struttura').optionIds.get('acciaio')!,
    });

    // Addons — the rental product carries BOTH legal modes.
    await db.insert(productAddons).values([
      {
        productId: product.id,
        name: { it: 'Materasso antidecubito', en: 'Anti-decubitus mattress' },
        description: { it: "Materasso a bolle d'aria con compressore." }, // en missing
        sku: 'MIA-ADD-MAT',
        pricingMode: 'rental',
        productPricingMode: 'rental',
        price: '9.00',
        rentalUnit: 'day',
        minQuantity: 0,
        /* Above 1, so the storefront offers a stepper rather than a bare tick —
           the "multiple selectable" case. The delivery add-on below is the other. */
        maxQuantity: 3,
        position: 0,
      },
      {
        productId: product.id,
        name: { it: 'Consegna e installazione', en: 'Delivery and setup' },
        description: {
          it: 'Consegna a domicilio con montaggio.',
          en: 'Home delivery with assembly.',
        },
        sku: 'MIA-ADD-DEL',
        pricingMode: 'fixed',
        productPricingMode: 'rental',
        price: '60.00',
        rentalUnit: null,
        /* 0, not 1: a minimum of one would re-impose by quantity exactly what
           `isRequired` used to impose by flag. The customer ticks it or does not. */
        minQuantity: 0,
        maxQuantity: 1,
        position: 1,
      },
    ]);

    // Intake questions.
    const [floorQ] = await db
      .insert(productQuestions)
      .values({
        productId: product.id,
        key: 'piano-installazione',
        prompt: {
          it: 'A che piano deve essere installato il letto?',
          en: 'Which floor should the bed be installed on?',
        },
        helpText: { it: 'Serve a pianificare il trasporto.' },
        questionValueType: 'number',
        isRequired: true,
        minValue: '0',
        maxValue: '30',
        position: 0,
      })
      .returning({ id: productQuestions.id });
    void floorQ;
    await db.insert(productQuestions).values({
      productId: product.id,
      key: 'ascensore',
      prompt: { it: "E' presente un ascensore?", en: 'Is a lift available?' },
      questionValueType: 'boolean',
      isRequired: true,
      position: 1,
    });
    const [slotQ] = await db
      .insert(productQuestions)
      .values({
        productId: product.id,
        key: 'fascia-oraria',
        prompt: { it: 'Fascia oraria preferita per la consegna' },
        questionValueType: 'single_select',
        position: 2,
      })
      .returning({ id: productQuestions.id });
    if (slotQ) {
      await db.insert(productQuestionOptions).values([
        {
          questionId: slotQ.id,
          value: 'mattino',
          label: { it: 'Mattino (8-13)', en: 'Morning (8-13)' },
          position: 0,
        },
        {
          questionId: slotQ.id,
          value: 'pomeriggio',
          label: { it: 'Pomeriggio (14-19)' },
          position: 1,
        },
      ]);
    }

    await db.insert(productFaqs).values([
      {
        productId: product.id,
        question: {
          it: "Il montaggio e' incluso nel noleggio?",
          en: 'Is assembly included in the rental?',
        },
        answer: {
          it: "Il montaggio e' disponibile come extra a prezzo fisso.",
          en: 'Assembly is available as a fixed-price extra.',
        },
        position: 0,
      },
      {
        // Italian-only FAQ — jsonb fallback exercised.
        productId: product.id,
        question: { it: 'Posso cambiare il materasso durante il noleggio?' },
        answer: { it: "Sì, contattando l'assistenza il cambio avviene entro 48 ore." },
        position: 1,
      },
    ]);

    if (termsId) {
      await db.insert(productTerms).values({ productId: product.id, termsId, position: 0 });
    }

    console.log(`  ✓ rental product letto-degenza-elettrico (${skuCount} SKUs)`);
  } else {
    console.log('  · rental product already exists, skipping');
  }
}

// -- the FIXED product -------------------------------------------------------

if (carrozzine) {
  const [product] = await db
    .insert(products)
    .values({
      baseSku: 'MIA-CRZ',
      status: 'active',
      categoryId: carrozzine.id,
      brand: 'MiaMedical',
      pricingMode: 'fixed',
      basePrice: '289.00',
      currency: 'EUR',
      rentalUnit: null,
      chips: [
        { it: 'Peso 11,5 kg', en: 'Weighs 11.5 kg' },
        { it: 'Pieghevole', en: 'Folding frame' },
      ],
    })
    .onConflictDoNothing()
    .returning({ id: products.id });

  if (product) {
    await db.insert(productTranslations).values([
      {
        productId: product.id,
        languageCode: 'it',
        title: 'Carrozzina pieghevole superleggera',
        shortDescription: 'Telaio in alluminio da 11 kg, pieghevole in un gesto.',
        description:
          "<p>Carrozzina in alluminio con crociera pieghevole, ruote ad estrazione rapida e pedane regolabili.</p><h2>Adatta a</h2><ul><li><p>Spostamenti quotidiani in casa e all'esterno</p></li><li><p>Trasporto in auto: si piega in un gesto</p></li></ul>",
        slug: 'carrozzina-pieghevole-superleggera',
        metaTitle: 'Carrozzina pieghevole superleggera | MiaMedical',
        metaDescription: 'Vendita carrozzina superleggera in alluminio.',
        searchVector: tr(
          'it',
          'Carrozzina pieghevole superleggera',
          'Carrozzina in alluminio con crociera pieghevole, ruote ad estrazione rapida.',
        ) as unknown as string,
      },
      // No English row at all — translation-table fallback exercised.
    ]);

    const groups = await seedVariants(product.id, [
      {
        key: 'taglia',
        label: { it: 'Larghezza seduta', en: 'Seat width' },
        valueType: 'single_select',
        isRequired: true,
        affectsSku: true,
        sourcePresetKey: 'taglia',
        options: [
          { value: '40', label: { it: '40 cm' }, skuCode: '40', isDefault: true },
          { value: '45', label: { it: '45 cm' }, skuCode: '45', priceModifier: '15.00' },
          { value: '48', label: { it: '48 cm' }, skuCode: '48', priceModifier: '25.00' },
        ],
      },
      {
        key: 'colore',
        label: { it: 'Colore', en: 'Colour' },
        valueType: 'single_select',
        isRequired: true,
        affectsSku: true,
        sourcePresetKey: 'colore',
        options: [
          { value: 'blu', label: { it: 'Blu', en: 'Blue' }, skuCode: 'BLU', isDefault: true },
          { value: 'grigio', label: { it: 'Grigio', en: 'Grey' }, skuCode: 'GRI' },
        ],
      },
      {
        key: 'lunghezza-pedana',
        label: { it: 'Lunghezza pedana', en: 'Footrest length' },
        valueType: 'number',
        unit: 'cm',
        minValue: 38,
        maxValue: 50,
        priceModifierPerUnit: '1.50',
      },
    ]);
    const skuCount = await seedSkuMatrix(product.id, 'MIA-CRZ', groups, [4, 2, 0, 5, 1, 3]);

    const spec = (key: string) => carrozzine.specIds.get(key)!;
    await db.insert(productSpecValues).values([
      { productId: product.id, specId: spec('peso').id, numberValue: '11' },
      {
        productId: product.id,
        specId: spec('larghezza-seduta').id,
        numberMin: '40',
        numberMax: '48',
      },
      { productId: product.id, specId: spec('pieghevole').id, booleanValue: true },
    ]);

    // Fixed product → FIXED addons only. Never a rental one.
    await db.insert(productAddons).values([
      {
        productId: product.id,
        name: { it: 'Cuscino antidecubito', en: 'Anti-decubitus cushion' },
        sku: 'MIA-ADD-CUS',
        pricingMode: 'fixed',
        productPricingMode: 'fixed',
        price: '45.00',
        minQuantity: 0,
        maxQuantity: 1,
        position: 0,
      },
      {
        productId: product.id,
        name: { it: 'Borsa portaoggetti' }, // en missing
        sku: 'MIA-ADD-BOR',
        pricingMode: 'fixed',
        productPricingMode: 'fixed',
        price: '25.00',
        minQuantity: 0,
        maxQuantity: 2,
        position: 1,
      },
    ]);

    await db.insert(productQuestions).values([
      {
        productId: product.id,
        key: 'data-consegna',
        prompt: { it: 'Data di consegna preferita', en: 'Preferred delivery date' },
        questionValueType: 'date',
        position: 0,
      },
      {
        productId: product.id,
        key: 'note',
        prompt: { it: 'Note aggiuntive' },
        questionValueType: 'text',
        maxLength: 500,
        position: 1,
      },
    ]);

    await db.insert(productFaqs).values({
      productId: product.id,
      question: {
        it: 'La carrozzina è omologata per il trasporto in auto?',
        en: 'Is the wheelchair approved for car transport?',
      },
      answer: {
        it: 'Sì, con il kit di ancoraggio opzionale.',
        en: 'Yes, with the optional tie-down kit.',
      },
      position: 0,
    });

    console.log(`  ✓ fixed product carrozzina-pieghevole (${skuCount} SKUs)`);
  } else {
    console.log('  · fixed product already exists, skipping');
  }
}

if (!env.R2_BUCKET) {
  console.log('  · R2 not configured — media and icons left empty (never dangling paths)');
}

// --- orders and carts ---------------------------------------------------------
//
// One order per status, so the queue's filter bar and the detail page's action
// set can both be exercised without hand-crafting rows. Lines snapshot the SKU
// exactly as checkout would: the order stays readable after the product moves.

{
  const [existingOrder] = await db.select({ id: orders.id }).from(orders).limit(1);

  if (existingOrder) {
    console.log('  · orders already exist, skipping');
  } else {
    const skuRows = await db
      .select({
        id: productSkus.id,
        sku: productSkus.sku,
        productId: productSkus.productId,
        basePrice: products.basePrice,
        rentalPackages: products.rentalPackages,
      })
      .from(productSkus)
      .innerJoin(products, eq(productSkus.productId, products.id))
      .limit(6);

    if (skuRows.length === 0) {
      console.log('  · no SKUs to build orders from, skipping');
    } else {
      const titles = new Map(
        (
          await db
            .select({ productId: productTranslations.productId, title: productTranslations.title })
            .from(productTranslations)
            .where(eq(productTranslations.languageCode, 'it'))
        ).map((row) => [row.productId, row.title]),
      );

      const address = (name: string) => ({
        fullName: name,
        line1: 'Via Roma 12',
        line2: null,
        city: 'Milano',
        region: 'MI',
        postalCode: '20121',
        country: 'IT',
        phone: '+39 02 1234567',
      });

      /** `pending` first so the queue's "waiting" count is non-zero on a fresh seed. */
      const PLAN = [
        { status: 'pending', paymentStatus: 'unpaid', days: 0 },
        { status: 'pending', paymentStatus: 'authorized', days: 1 },
        { status: 'paid', paymentStatus: 'paid', days: 3 },
        { status: 'fulfilled', paymentStatus: 'paid', days: 9 },
        { status: 'cancelled', paymentStatus: 'failed', days: 14 },
        { status: 'refunded', paymentStatus: 'refunded', days: 21 },
      ] as const;

      const cents = (value: string) => Math.round(Number(value) * 100);
      const money = (value: number) => (value / 100).toFixed(2);

      /* What one of this line costs. A fixed product has its own rate; a rental
         has no rate at all, so its cheapest package stands in — the same figure
         the storefront would quote for the shortest stay. */
      const linePrice = (row: (typeof skuRows)[number]): string =>
        row.basePrice ??
        row.rentalPackages.reduce(
          (cheapest, pkg) => (cents(pkg.price) < cents(cheapest) ? pkg.price : cheapest),
          row.rentalPackages[0]?.price ?? '0.00',
        );

      for (const [index, plan] of PLAN.entries()) {
        const line = skuRows[index % skuRows.length]!;
        const quantity = (index % 3) + 1;
        const unitCents = cents(linePrice(line));
        const subtotalCents = unitCents * quantity;
        const shippingCents = plan.status === 'cancelled' ? 0 : 990;
        const totalCents = subtotalCents + shippingCents;

        const placedAt = new Date(Date.now() - plan.days * 24 * 60 * 60 * 1000);
        const number = `MIA-2026-${String(index + 1).padStart(6, '0')}`;

        const [order] = await db
          .insert(orders)
          .values({
            number,
            email: `cliente${index + 1}@example.com`,
            status: plan.status,
            paymentStatus: plan.paymentStatus,
            subtotal: money(subtotalCents),
            shippingTotal: money(shippingCents),
            total: money(totalCents),
            shippingAddress: address(`Cliente ${index + 1}`),
            billingAddress: address(`Cliente ${index + 1}`),
            notes: index === 0 ? 'Consegna al piano, citofono Rossi.' : null,
            placedAt,
          })
          .returning({ id: orders.id });
        if (!order) continue;

        await db.insert(orderItems).values({
          orderId: order.id,
          skuId: line.id,
          productTitle: titles.get(line.productId) ?? line.sku,
          skuLabel: line.sku,
          sku: line.sku,
          quantity,
          unitPrice: money(unitCents),
          total: money(subtotalCents),
        });

        // Backfill the timeline so a seeded order reads like one that actually
        // moved, rather than one that appeared in its final state.
        const trail: { from: string; to: string }[] =
          plan.status === 'pending'
            ? []
            : plan.status === 'cancelled'
              ? [{ from: 'pending', to: 'cancelled' }]
              : plan.status === 'refunded'
                ? [
                    { from: 'pending', to: 'paid' },
                    { from: 'paid', to: 'refunded' },
                  ]
                : plan.status === 'fulfilled'
                  ? [
                      { from: 'pending', to: 'paid' },
                      { from: 'paid', to: 'fulfilled' },
                    ]
                  : [{ from: 'pending', to: 'paid' }];

        for (const [step, move] of trail.entries()) {
          await db.insert(orderStatusEvents).values({
            orderId: order.id,
            field: 'status',
            fromValue: move.from,
            toValue: move.to,
            note: null,
            createdAt: new Date(placedAt.getTime() + (step + 1) * 60 * 60 * 1000),
          });
        }
      }

      // One live cart and one long expired, so the Carts view has both states.
      for (const [index, offsetDays] of [1, -3].entries()) {
        const [cart] = await db
          .insert(carts)
          .values({
            token: `seed-cart-${index + 1}`,
            expiresAt: new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000),
          })
          .returning({ id: carts.id });
        if (!cart) continue;

        const line = skuRows[index % skuRows.length]!;
        await db.insert(cartItems).values({
          cartId: cart.id,
          skuId: line.id,
          quantity: index + 1,
          unitPrice: linePrice(line),
        });
      }

      console.log(`  ✓ ${PLAN.length} orders and 2 carts`);
    }
  }
}

// --- development super admin ------------------------------------------------
// Production accounts are created with `pnpm admin:seed` or, interactively,
// `pnpm --filter @mia/server admin:create`. Same `SUPERADMIN_*` variables as
// those two — one account named one way, whichever script writes it — with
// local-dev fallbacks so `db:seed` still works on an empty environment.

if (env.NODE_ENV === 'production') {
  console.log('  · skipping the development super admin (NODE_ENV=production)');
} else {
  const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase() ?? 'admin@miamedical.local';
  await applyAdminAccount(db, {
    email,
    password: process.env.SUPERADMIN_PASSWORD || 'localdev-password',
    fullName: process.env.SUPERADMIN_NAME?.trim() ?? 'Super Admin',
    isSuperuser: true,
    permissions: [],
  });
  console.log(`  ✓ super admin ${email}`);
}

console.log('Done.');
process.exit(0);
