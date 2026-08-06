import { createDatabase } from '@mia/db';
import { categories, productCategories, productVariants, products, users } from '@mia/db/schema';

import { env } from '../src/config/env.ts';

const db = createDatabase({ url: env.DATABASE_URL, logger: false });

const CATEGORIES = [
  { slug: 'diagnostics', name: 'Diagnostics' },
  { slug: 'ppe', name: 'Personal Protective Equipment' },
  { slug: 'consumables', name: 'Consumables' },
];

const PRODUCTS = [
  {
    slug: 'digital-thermometer-dt100',
    name: 'Digital Thermometer DT-100',
    brand: 'MediTech',
    category: 'diagnostics',
    description: 'Fast-read clinical thermometer with ±0.1°C accuracy.',
    variants: [{ sku: 'DT100-STD', name: 'Standard', priceCents: 2499, stock: 150 }],
  },
  {
    slug: 'pulse-oximeter-po2',
    name: 'Fingertip Pulse Oximeter PO-2',
    brand: 'MediTech',
    category: 'diagnostics',
    description: 'SpO2 and pulse rate readings with an OLED display.',
    variants: [
      { sku: 'PO2-BLU', name: 'Blue', priceCents: 3899, stock: 80 },
      { sku: 'PO2-WHT', name: 'White', priceCents: 3899, stock: 42 },
    ],
  },
  {
    slug: 'nitrile-examination-gloves',
    name: 'Nitrile Examination Gloves',
    brand: 'SafeGuard',
    category: 'ppe',
    description: 'Powder-free, latex-free. Box of 100.',
    variants: [
      { sku: 'NG-S', name: 'Small', priceCents: 1299, stock: 500 },
      { sku: 'NG-M', name: 'Medium', priceCents: 1299, stock: 640 },
      { sku: 'NG-L', name: 'Large', priceCents: 1299, stock: 310 },
    ],
  },
  {
    slug: 'sterile-gauze-pads',
    name: 'Sterile Gauze Pads 10x10cm',
    brand: 'SafeGuard',
    category: 'consumables',
    description: 'Individually wrapped, 12-ply absorbent gauze. Pack of 50.',
    variants: [{ sku: 'SGP-50', name: 'Pack of 50', priceCents: 899, stock: 220 }],
  },
];

console.log('Seeding…');

const insertedCategories = await db
  .insert(categories)
  .values(CATEGORIES)
  .onConflictDoNothing()
  .returning();

const categoryBySlug = new Map(insertedCategories.map((row) => [row.slug, row.id]));

for (const spec of PRODUCTS) {
  const [product] = await db
    .insert(products)
    .values({
      slug: spec.slug,
      name: spec.name,
      brand: spec.brand,
      description: spec.description,
      status: 'active',
    })
    .onConflictDoNothing()
    .returning();

  if (!product) {
    console.log(`  · ${spec.slug} already exists, skipping`);
    continue;
  }

  await db.insert(productVariants).values(
    spec.variants.map((variant, index) => ({
      ...variant,
      productId: product.id,
      isDefault: index === 0,
    })),
  );

  const categoryId = categoryBySlug.get(spec.category);
  if (categoryId) {
    await db.insert(productCategories).values({ productId: product.id, categoryId });
  }

  console.log(`  ✓ ${spec.name}`);
}

// A staff account for the admin panel. Replace the hash with a real one
// (argon2id) before using this anywhere but local development.
await db
  .insert(users)
  .values({
    email: 'admin@miamedical.local',
    fullName: 'Admin',
    role: 'admin',
    passwordHash: null,
  })
  .onConflictDoNothing();

console.log('Done.');
process.exit(0);
