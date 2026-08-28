import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Localized, RentalPackage } from '@mia/db/schema';
import mysql from 'mysql2/promise';

import { addonId, categoryId, productId, specId, specOptionId } from './ids.ts';
import {
  COMPARE_GROUP_TO_CATEGORY,
  RENTAL_ROOT_TERM_ID,
  SALE_ROOT_TERM_ID,
  asBoolean,
  asNumber,
  asRange,
  inferSpec,
  isFilterableType,
  matchModelToProducts,
  specKey,
  stripSalesMode,
  type ValueType,
} from './mapping.ts';
import { sanitizeRichText } from '../../src/shared/html/rich-text.ts';
import {
  cleanBlockHtml,
  htmlToText,
  parseDailyRate,
  parseDuration,
  parsePriceFromLabel,
  slugify,
  stripTrailingPrice,
  toMoney,
  truncate,
  tryPhpUnserialize,
  uniquify,
} from './parse.ts';
import type {
  AddonChunk,
  CategoryChunk,
  MediaChunk,
  MediaRole,
  ProductChunk,
  Report,
  ReportEntry,
  SpecChunk,
  SpecOptionChunk,
  SpecValueChunk,
} from './types.ts';

/**
 * Phase one of the WordPress migration: read MySQL, write reviewable JSON.
 *
 * Writes nothing to PostgreSQL and nothing to R2 — see load.ts for that. The
 * split exists because too much of this data needs a human eye before it lands:
 * no product has a stock count, some rental rates are junk, and specs are inferred from
 * free text. Full walkthrough in docs/code/wp-migration.md.
 *
 *   pnpm --filter @mia/server wp:extract
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, '../../../../docs/migration/wp');

/** Read-only, and only ever this one script — so not in the app's env schema. */
const MYSQL = {
  host: process.env.WP_MYSQL_HOST ?? '127.0.0.1',
  port: Number(process.env.WP_MYSQL_PORT ?? 3306),
  user: process.env.WP_MYSQL_USER ?? 'root',
  password: process.env.WP_MYSQL_PASSWORD ?? '',
  database: process.env.WP_MYSQL_DATABASE ?? 'default',
};
const PREFIX = process.env.WP_TABLE_PREFIX ?? 'wp_';
/** Where the live site still serves `wp-content/uploads`. */
const MEDIA_BASE = (process.env.WP_MEDIA_BASE_URL ?? 'https://www.miamedicalitalia.it').replace(
  /\/$/,
  '',
);
const DEFAULT_CURRENCY = process.env.DEFAULT_CURRENCY ?? 'EUR';

const report: ReportEntry[] = [];
const note = (kind: string, wpId: number | null, subject: string, detail: string): void => {
  report.push({ kind, wpId, subject, detail });
};

type Row = Record<string, unknown>;

const str = (value: unknown): string =>
  value === null || value === undefined ? '' : String(value);
const int = (value: unknown): number => Number.parseInt(str(value), 10) || 0;

async function main(): Promise<void> {
  const db = await mysql.createConnection({ ...MYSQL, charset: 'utf8mb4' });
  const q = async (sql: string, params: unknown[] = []): Promise<Row[]> => {
    const [rows] = await db.query(sql.replaceAll('{p}', PREFIX), params);
    return rows as Row[];
  };

  console.log(`Reading ${MYSQL.user}@${MYSQL.host}:${MYSQL.port}/${MYSQL.database} (${PREFIX}*)\n`);

  // --- categories -----------------------------------------------------------

  const termRows = await q(`
    SELECT t.term_id, t.name, t.slug, tt.parent, tt.description, tt.count
    FROM {p}terms t
    JOIN {p}term_taxonomy tt ON tt.term_id = t.term_id
    WHERE tt.taxonomy = 'product_cat'
    ORDER BY tt.parent, t.name
  `);

  const modeByTermId = new Map<number, 'fixed' | 'rental'>();
  /** Every term that resolves to a category, merged terms included. */
  const categoryByTermId = new Map<number, CategoryChunk>();
  const categories: CategoryChunk[] = [];
  const codesTaken = new Set<string>();
  const catSlugsTaken = new Set<string>();

  for (const row of termRows) {
    const termId = int(row.term_id);
    const parent = int(row.parent);

    // The two roots become `pricing_mode`, not categories — the new schema's
    // category list is flat.
    if (termId === RENTAL_ROOT_TERM_ID || termId === SALE_ROOT_TERM_ID) {
      note('category', termId, str(row.name), 'root term → pricing mode, not a category');
      continue;
    }
    if (parent !== RENTAL_ROOT_TERM_ID && parent !== SALE_ROOT_TERM_ID) {
      note('category', termId, str(row.name), `unexpected parent ${parent} — skipped`);
      continue;
    }

    const mode: 'fixed' | 'rental' = parent === RENTAL_ROOT_TERM_ID ? 'rental' : 'fixed';
    modeByTermId.set(termId, mode);

    /**
     * The name is the cleaned name and the code follows it — never the
     * WordPress slug. Every rental slug in the dump is prefixed with how the
     * thing was sold (`Carrozzine` sat at `affitto-e-noleggio-carrozzina`) and
     * three names repeat it outright, and that is precisely what
     * `pricing_mode` now carries. See `stripSalesMode`.
     */
    const name = stripSalesMode(str(row.name));
    const code = slugify(name || str(row.slug), `cat-${termId}`);
    if (name !== str(row.name).trim() || slugify(str(row.slug), '') !== code) {
      note(
        'category',
        termId,
        str(row.name),
        `→ "${name}" / "${code}" (WordPress: name "${str(row.name)}", url "${str(row.slug)}" — redirect that url if it is worth keeping)`,
      );
    }

    /**
     * Two terms cleaning to one name are one category sold two ways — the
     * second-hand pair, "Occasione usato" in the rental tree and "Occasione
     * Usato in Vendita" in the sale tree. They merge onto the first, and the
     * products keep their own `pricing_mode`, which is the whole point: a
     * category holds a product family, not a price list.
     */
    const merged = categoryByTermId.get(termId) ?? categories.find((item) => item.code === code);
    if (merged) {
      categoryByTermId.set(termId, merged);
      note(
        'category',
        termId,
        str(row.name),
        `same family as term ${merged.wpTermId} ("${merged.name.it}") → merged, products keep ${mode} pricing`,
      );
      continue;
    }

    const category: CategoryChunk = {
      id: categoryId(termId),
      wpTermId: termId,
      code: uniquify(code, codesTaken),
      treePricingMode: mode,
      position: categories.length,
      isActive: true,
      icon: null,
      iconSource: null,
      name: { it: name },
      slug: uniquify(code, catSlugsTaken),
      description: htmlToText(str(row.description)),
    };
    categories.push(category);
    categoryByTermId.set(termId, category);
  }

  const categoryByCode = new Map(categories.map((category) => [category.code, category]));

  const attachments = await loadAttachments(q);
  const thumbnailRows = await q(`
    SELECT tm.term_id, tm.meta_value
    FROM {p}termmeta tm
    JOIN {p}term_taxonomy tt ON tt.term_id = tm.term_id AND tt.taxonomy = 'product_cat'
    WHERE tm.meta_key = 'thumbnail_id'
  `);
  attachCategoryIcons(
    categories,
    attachments,
    new Map(thumbnailRows.map((row) => [int(row.term_id), int(row.meta_value)])),
  );

  const withIcon = categories.filter((category) => category.iconSource !== null).length;
  console.log(`categories        ${categories.length} (${withIcon} with a category image)`);

  // --- products -------------------------------------------------------------

  const STATUS_MAP: Record<string, 'draft' | 'active' | 'archived'> = {
    publish: 'active',
    draft: 'draft',
    private: 'draft',
    pending: 'draft',
    trash: 'archived',
  };

  const postRows = await q(`
    SELECT ID, post_title, post_name, post_status, post_content, post_excerpt, post_date
    FROM {p}posts
    WHERE post_type = 'product' AND post_status IN ('publish','draft','private','pending','trash')
    ORDER BY ID
  `);

  const metaRows = await q(`
    SELECT pm.post_id, pm.meta_key, pm.meta_value
    FROM {p}postmeta pm
    JOIN {p}posts p ON p.ID = pm.post_id
    WHERE p.post_type IN ('product','product_variation')
      AND (
        pm.meta_key IN (
          '_price','_regular_price','_thumbnail_id','_product_image_gallery',
          '_product_attributes','prodotto_prezzo_a_partire_da','_yoast_wpseo_title',
          '_yoast_wpseo_metadesc','_stock','_manage_stock'
        )
        OR pm.meta_key LIKE 'attribute\\_%'
      )
  `);

  const meta = new Map<number, Map<string, string>>();
  for (const row of metaRows) {
    const postId = int(row.post_id);
    let bucket = meta.get(postId);
    if (!bucket) meta.set(postId, (bucket = new Map()));
    bucket.set(str(row.meta_key), str(row.meta_value));
  }
  const metaOf = (postId: number, key: string): string => meta.get(postId)?.get(key) ?? '';

  // Product → its categories, so the single `category_id` can be chosen.
  const relRows = await q(`
    SELECT tr.object_id, tt.term_id, tt.parent
    FROM {p}term_relationships tr
    JOIN {p}term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
    WHERE tt.taxonomy = 'product_cat'
  `);
  const termsOfPost = new Map<number, number[]>();
  for (const row of relRows) {
    const postId = int(row.object_id);
    const termId = int(row.term_id);
    if (!modeByTermId.has(termId)) continue;
    const list = termsOfPost.get(postId) ?? [];
    list.push(termId);
    termsOfPost.set(postId, list);
  }

  // Variations, grouped under their parent.
  const variationRows = await q(`
    SELECT ID, post_parent, menu_order
    FROM {p}posts
    WHERE post_type = 'product_variation'
    ORDER BY post_parent, menu_order, ID
  `);
  const variationsOf = new Map<number, number[]>();
  for (const row of variationRows) {
    const parent = int(row.post_parent);
    const list = variationsOf.get(parent) ?? [];
    list.push(int(row.ID));
    variationsOf.set(parent, list);
  }

  const products: ProductChunk[] = [];
  /** Addons discovered from variation options on rental products. */
  const derivedAddons: AddonChunk[] = [];
  const productSlugsTaken = new Set<string>();

  for (const row of postRows) {
    const postId = int(row.ID);
    const title = str(row.post_title).trim() || `Prodotto ${postId}`;
    const needsReview: string[] = [];

    // --- category and pricing mode
    const termIds = termsOfPost.get(postId) ?? [];
    if (termIds.length === 0) {
      note('product', postId, title, 'no product_cat under either root — SKIPPED');
      continue;
    }
    const modes = new Set(termIds.map((id) => modeByTermId.get(id)!));

    // Duration tiers are the tell: a product that sells rental periods is a
    // rental product regardless of which trees it also sits in.
    const variationIds = variationsOf.get(postId) ?? [];
    const tierBearing = variationIds.some((id) =>
      [...(meta.get(id)?.entries() ?? [])].some(
        ([key, value]) => key.startsWith('attribute_') && parseDuration(value) !== null,
      ),
    );

    let mode: 'fixed' | 'rental';
    if (modes.size > 1) {
      mode = tierBearing ? 'rental' : 'fixed';
      needsReview.push('pricingMode', 'categoryId');
      note(
        'product',
        postId,
        title,
        `in both trees — chose ${mode} (${tierBearing ? 'has duration tiers' : 'no duration tiers'})`,
      );
    } else {
      mode = [...modes][0]!;
      if (mode === 'fixed' && tierBearing) {
        needsReview.push('pricingMode');
        note('product', postId, title, 'in the sale tree but has duration tiers — kept fixed');
      }
    }

    const termId = termIds.find((id) => modeByTermId.get(id) === mode) ?? termIds[0]!;
    const category = categoryByTermId.get(termId);
    if (!category) {
      note('product', postId, title, `category term ${termId} not extracted — SKIPPED`);
      continue;
    }

    // --- variations: duration tiers become packages, the rest become options
    const packages: RentalPackage[] = [];
    const packageCodes = new Set<string>();

    /**
     * Options are collected keyed by attribute *and* value, because a product
     * with two variation axes repeats every option once per tier — ten rows for
     * two real choices. `product_variant_options` has `unique(group_id, value)`,
     * so the duplicates have to collapse here rather than fail on load.
     */
    interface RawOption {
      value: string;
      label: string;
      /** What the option itself costs, absolute. */
      absolute: string | null;
      firstSeen: number;
    }
    const optionsByAttr = new Map<string, Map<string, RawOption>>();
    const multiAxis = new Set<number>();

    for (const variationId of variationIds) {
      const variationPrice = toMoney(metaOf(variationId, '_price'));
      const attrs = [...(meta.get(variationId)?.entries() ?? [])].filter(
        ([key, value]) => key.startsWith('attribute_') && value.trim() !== '',
      );

      const durationAttrs = attrs.filter(([, value]) => parseDuration(value) !== null);
      const optionAttrs = attrs.filter(([, value]) => parseDuration(value) === null);
      if (durationAttrs.length > 0 && optionAttrs.length > 0) multiAxis.add(variationId);

      for (const [key, rawLabel] of durationAttrs) {
        void key;
        const label = rawLabel.trim();
        const duration = parseDuration(label)!;
        if (mode !== 'rental') continue;
        // On a two-axis variation the price is the combined total, so the tier
        // is recorded once (from whichever variation came first) and the option
        // price is read from its own label instead.
        const code = `${duration.duration}-${duration.unit}`;
        if (packageCodes.has(code)) continue;
        const price = variationPrice;
        if (!price) {
          note('package', variationId, `${title} → ${label}`, 'variation has no _price — SKIPPED');
          continue;
        }
        packageCodes.add(code);
        packages.push({
          code,
          name: { it: stripTrailingPrice(label) },
          price,
          duration: duration.duration,
          unit: duration.unit,
        });
      }

      for (const [key, rawLabel] of optionAttrs) {
        const attrName = key.slice('attribute_'.length);
        const label = rawLabel.trim();
        const value = slugify(stripTrailingPrice(label), `opt-${variationId}`);
        const bucket = optionsByAttr.get(attrName) ?? new Map<string, RawOption>();
        if (!bucket.has(value)) {
          bucket.set(value, {
            value,
            label,
            // The label's own price beats the variation total, which on a
            // two-axis product includes the duration tier.
            absolute: parsePriceFromLabel(label) ?? (durationAttrs.length ? null : variationPrice),
            firstSeen: bucket.size,
          });
        }
        optionsByAttr.set(attrName, bucket);
      }

      if (attrs.length === 0) {
        note('variation', variationId, title, 'variation carries no attribute_* meta — ignored');
      }
    }

    if (multiAxis.size > 0) {
      note(
        'variation',
        postId,
        title,
        `${multiAxis.size} variations carry a duration AND an option — option prices read from their labels`,
      );
    }

    if (packages.length > 15) {
      note(
        'package',
        postId,
        title,
        `${packages.length} tiers exceeds the 15 cap — extra ones dropped, review`,
      );
      needsReview.push('rentalPackages');
      packages.length = 15;
    }

    // --- base price
    let basePrice: string | null = null;
    let marketingRate: string | null = null;
    let rentalUnit: 'hour' | 'day' | null = null;

    if (mode === 'rental') {
      rentalUnit = packages[0]?.unit ?? 'day';
      /* A rental has no rate of its own — its packages above are its price. The
         old site's "a partire da" figure is advertising, so it lands on
         `marketingRate`, where nothing computes a total from it. An unparseable
         one is simply left unset: the card falls back to the cheapest package,
         which is a real figure rather than a placeholder 0,00. */
      marketingRate = parseDailyRate(metaOf(postId, 'prodotto_prezzo_a_partire_da'));
      if (!marketingRate) {
        needsReview.push('marketingRate');
        const raw = metaOf(postId, 'prodotto_prezzo_a_partire_da');
        note(
          'price',
          postId,
          title,
          raw
            ? `per-${rentalUnit} headline unparseable from "${raw}" — left unset, card shows the cheapest package`
            : `no per-${rentalUnit} headline on the product — left unset, card shows the cheapest package`,
        );
      }
    } else {
      /**
       * On a fixed product with a variation axis, every option label states an
       * absolute price. The cheapest becomes the base, and each option lands as
       * an add-on priced at its own figure — see the option loop below.
       */
      const absolutes = [...optionsByAttr.values()]
        .flatMap((bucket) => [...bucket.values()])
        .map((option) => option.absolute)
        .filter((value): value is string => value !== null);
      const cheapest = absolutes.length
        ? absolutes.reduce((min, value) => (Number(value) < Number(min) ? value : min))
        : null;
      const wooPrice = toMoney(metaOf(postId, '_price'));
      basePrice = cheapest ?? wooPrice;
      if (!basePrice) {
        basePrice = '0.00';
        needsReview.push('basePrice');
        note('price', postId, title, 'no _price on a fixed product — set 0.00, FILL IN');
      } else if (cheapest && wooPrice && cheapest !== wooPrice) {
        // Exact for every option, but no longer the number the old shop showed.
        // Usually means one option is a spare part rather than a configuration.
        needsReview.push('basePrice');
        note(
          'price',
          postId,
          title,
          `base taken from the cheapest option (${cheapest}) not WooCommerce's _price (${wooPrice}) — check the options are configurations, not spare parts`,
        );
      }
    }

    /**
     * A non-duration option is an EXTRA, in either mode: "Acquista gli
     * elettrodi" is something you add to what you came for, priced once.
     *
     * It used to split either way — a fixed product's options became a
     * single_select variant group, a rental product's became add-ons. Products
     * have no variant axes any more (one product is one stock-keeping unit), so
     * both sides land as `product_addons` in fixed mode, which the schema
     * permits on a rental product as well as a fixed one.
     */
    for (const [attrName, bucket] of optionsByAttr) {
      const options = [...bucket.values()].sort((a, b) => a.firstSeen - b.firstSeen);
      const groupLabel = attrName.replaceAll('-', ' ').replace(/^./, (char) => char.toUpperCase());

      for (const [index, option] of options.entries()) {
        const price = option.absolute;
        derivedAddons.push({
          id: addonId(postId * 100 + index),
          productIds: [productId(postId)],
          name: { it: stripTrailingPrice(option.label).slice(0, 200) },
          description: { it: groupLabel },
          pricingMode: 'fixed',
          price: price ?? '0.00',
          minQuantity: 0,
          maxQuantity: 1,
          position: index,
          needsReview: price ? [] : ['price'],
        });
      }
      note('addon', postId, title, `"${groupLabel}" (${options.length} choices) → fixed addons`);
    }

    /* WooCommerce only keeps a count on products it was managing stock for;
       everything else reports availability through `_stock_status` and has no
       number at all. An unmanaged product lands at 0 and is flagged, because
       "we never counted these" and "there are none left" must not look the same
       to whoever reviews the import. */
    const managesStock = metaOf(postId, '_manage_stock') === 'yes';
    const rawStock = Number.parseInt(metaOf(postId, '_stock'), 10);
    const stock = managesStock && Number.isFinite(rawStock) ? Math.max(0, rawStock) : 0;
    if (!managesStock) {
      needsReview.push('stock');
      note('stock', postId, title, 'WooCommerce did not manage stock — set 0, FILL IN');
    }

    // `description` is rich text on the storefront (`set:html`), so WordPress
    // markup passes the same allowlist an admin edit would — here rather than in
    // load.ts, so the reviewable JSON is what actually lands.
    const description = sanitizeRichText(cleanBlockHtml(str(row.post_content)));
    const excerpt = htmlToText(str(row.post_excerpt));
    const seoTitle = metaOf(postId, '_yoast_wpseo_title').trim() || null;
    const seoDesc = metaOf(postId, '_yoast_wpseo_metadesc').trim() || null;

    products.push({
      id: productId(postId),
      wpPostId: postId,
      status: STATUS_MAP[str(row.post_status)] ?? 'draft',
      categoryId: category.id,
      categoryCode: category.code,
      brand: null,
      pricingMode: mode,
      basePrice,
      marketingRate,
      currency: DEFAULT_CURRENCY,
      rentalUnit,
      stock,
      isFeatured: false,
      rentalPackages: packages,
      translation: {
        title: title.slice(0, 200),
        slug: uniquify(
          slugify(str(row.post_name) || title, `prodotto-${postId}`),
          productSlugsTaken,
        ),
        shortDescription: truncate(excerpt, 500),
        description,
        metaTitle: truncate(seoTitle, 200),
        metaDescription: truncate(seoDesc ?? excerpt, 400),
      },
      needsReview,
    });
  }

  const productsByWpId = new Map(products.map((product) => [product.wpPostId, product]));
  console.log(`products          ${products.length}`);
  console.log(
    `  with packages   ${products.filter((product) => product.rentalPackages.length).length}`,
  );

  // --- specs ----------------------------------------------------------------

  const { specs, specValues } = await extractSpecs(q, categories, products, metaOf);
  console.log(`category specs    ${specs.length}`);
  console.log(`spec values       ${specValues.length}`);

  // --- media ----------------------------------------------------------------

  const media = extractMedia(products, metaOf, attachments);
  console.log(`media items       ${media.length}`);

  // --- addons ---------------------------------------------------------------

  const addons = [...derivedAddons, ...(await extractAddons(q))].map((addon, position) => ({
    ...addon,
    position,
  }));
  console.log(
    `addons            ${addons.length} (${derivedAddons.length} from variation options)`,
  );

  // --- write ----------------------------------------------------------------

  mkdirSync(OUT_DIR, { recursive: true });
  const write = (name: string, payload: unknown): void => {
    writeFileSync(join(OUT_DIR, name), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  };

  write('01-categories.json', { categories });
  write('02-category-specs.json', { specs });
  write('03-products.json', { products });
  write('04-product-specs.json', { specValues });
  write('06-media.json', { mediaBaseUrl: MEDIA_BASE, media });
  write('07-addons.json', { addons });

  const reviewCount = products.filter((product) => product.needsReview.length > 0).length;
  const fullReport: Report = {
    generatedAt: new Date().toISOString(),
    source: { host: `${MYSQL.host}:${MYSQL.port}`, database: MYSQL.database },
    counts: {
      categories: categories.length,
      categoryIcons: categories.filter((category) => category.iconSource !== null).length,
      products: products.length,
      productsNeedingReview: reviewCount,
      productsWithPackages: products.filter((product) => product.rentalPackages.length).length,
      rentalPackages: products.reduce((sum, product) => sum + product.rentalPackages.length, 0),
      categorySpecs: specs.length,
      specValues: specValues.length,
      mediaItems: media.length,
      addons: addons.length,
      reportEntries: report.length,
    },
    entries: report,
  };
  write('report.json', fullReport);

  await db.end();

  console.log(`\nWrote 8 files to ${OUT_DIR}`);
  console.log(`${reviewCount} products flagged for review, ${report.length} report entries.`);
  console.log(
    'Read report.json, fix what matters, then: pnpm --filter @mia/server wp:load --dry-run',
  );
}

// --- specs ------------------------------------------------------------------

type Query = (sql: string, params?: unknown[]) => Promise<Row[]>;

/**
 * Two sources, curated first.
 *
 * `wp_mia_compare_excel_*` is hand-built for comparison, so its fields become
 * `is_comparable` specs on the categories its groups describe. WooCommerce
 * attributes fill the rest: local ones carry proper Italian labels in
 * `_product_attributes`, taxonomy ones only English machine names.
 */
async function extractSpecs(
  q: Query,
  categories: CategoryChunk[],
  products: ProductChunk[],
  metaOf: (postId: number, key: string) => string,
): Promise<{ specs: SpecChunk[]; specValues: SpecValueChunk[] }> {
  const specs: SpecChunk[] = [];
  const specValues: SpecValueChunk[] = [];
  const byCategoryKey = new Map<string, SpecChunk>();

  const ensureSpec = (
    categoryCode: string,
    key: string,
    label: Localized,
    source: string,
  ): SpecChunk | null => {
    const category = categories.find((item) => item.code === categoryCode);
    if (!category) return null;
    const mapKey = `${categoryCode}::${key}`;
    const existing = byCategoryKey.get(mapKey);
    if (existing) return existing;
    const spec: SpecChunk = {
      id: specId(categoryCode, key),
      categoryId: category.id,
      categoryCode,
      key,
      label,
      valueType: 'string',
      unit: null,
      isRequired: false,
      isFilterable: false,
      isComparable: source.startsWith('mia_compare'),
      position: specs.filter((item) => item.categoryCode === categoryCode).length,
      source,
      inferenceReason: 'pending',
      options: [],
    };
    specs.push(spec);
    byCategoryKey.set(mapKey, spec);
    return spec;
  };

  /** Raw text per spec, so the shape can be inferred from the whole column. */
  const raw = new Map<string, Array<{ productId: string; wpPostId: number; value: string }>>();
  const collect = (spec: SpecChunk, productChunk: ProductChunk, value: string): void => {
    const list = raw.get(spec.id) ?? [];
    list.push({ productId: productChunk.id, wpPostId: productChunk.wpPostId, value });
    raw.set(spec.id, list);
  };

  // --- curated comparison tables
  const compareRows = await q(`
    SELECT g.group_slug, f.field_key, f.field_label, f.sort_order,
           m.model_label, m.tokens, v.field_value
    FROM {p}mia_compare_excel_values v
    JOIN {p}mia_compare_excel_models m ON m.id = v.model_id
    JOIN {p}mia_compare_excel_fields f ON f.id = v.field_id
    JOIN {p}mia_compare_excel_groups g ON g.id = m.group_id
    ORDER BY g.sort_order, m.sort_order, f.sort_order
  `);

  const titleIndex = products.map((product) => ({
    id: product.id,
    title: product.translation.title,
  }));
  const modelMatchCache = new Map<string, string[]>();
  let compareMatched = 0;
  let compareUnmatched = 0;

  for (const row of compareRows) {
    const groupSlug = str(row.group_slug);
    const categoryCode = COMPARE_GROUP_TO_CATEGORY[groupSlug];
    if (!categoryCode) {
      note('spec', null, groupSlug, 'compare group maps to no category — its fields are unused');
      continue;
    }
    const value = str(row.field_value).trim();
    if (!value) continue;

    const modelLabel = str(row.model_label);
    const cacheKey = `${groupSlug}::${modelLabel}`;
    let matches = modelMatchCache.get(cacheKey);
    if (!matches) {
      const tokens = (tryPhpUnserialize(str(row.tokens)) ?? safeJsonArray(str(row.tokens))) as
        string[] | null;
      matches = matchModelToProducts(
        Array.isArray(tokens) ? tokens.map(String) : modelLabel.split(/\s+/),
        titleIndex,
      );
      modelMatchCache.set(cacheKey, matches);
      if (matches.length === 0) {
        compareUnmatched++;
        note('spec', null, `${groupSlug} / ${modelLabel}`, 'model matches no product title');
      } else {
        compareMatched++;
        if (matches.length > 3) {
          note(
            'spec',
            null,
            `${groupSlug} / ${modelLabel}`,
            `model matches ${matches.length} products — check it is not too loose`,
          );
        }
      }
    }
    if (matches.length === 0) continue;

    const key = specKey(str(row.field_label));
    const spec = ensureSpec(
      categoryCode,
      key,
      { it: str(row.field_label) },
      `mia_compare:${groupSlug}`,
    );
    if (!spec) continue;

    for (const matchedId of matches) {
      const productChunk = products.find((product) => product.id === matchedId);
      // A model can match a product outside the group's category; that value
      // has no spec to live in, so it is dropped rather than misfiled.
      if (!productChunk || productChunk.categoryCode !== categoryCode) continue;
      collect(spec, productChunk, value);
    }
  }
  note(
    'spec',
    null,
    'mia_compare coverage',
    `${compareMatched} models matched a product, ${compareUnmatched} did not`,
  );

  // --- WooCommerce attributes
  const attrLabels = new Map<string, string>();
  for (const row of await q(
    `SELECT attribute_name, attribute_label FROM {p}woocommerce_attribute_taxonomies`,
  )) {
    attrLabels.set(`pa_${str(row.attribute_name)}`, str(row.attribute_label));
  }

  // Taxonomy attribute values live in term relationships.
  const paRows = await q(`
    SELECT tr.object_id, tt.taxonomy, t.name
    FROM {p}term_relationships tr
    JOIN {p}term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
    JOIN {p}terms t ON t.term_id = tt.term_id
    WHERE tt.taxonomy LIKE 'pa\\_%'
  `);
  const paByPost = new Map<number, Array<{ taxonomy: string; value: string }>>();
  for (const row of paRows) {
    const postId = int(row.object_id);
    const list = paByPost.get(postId) ?? [];
    list.push({ taxonomy: str(row.taxonomy), value: str(row.name) });
    paByPost.set(postId, list);
  }

  for (const productChunk of products) {
    // Local attributes: Italian label and value, both inline.
    const parsed = tryPhpUnserialize(metaOf(productChunk.wpPostId, '_product_attributes'));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      for (const [attrKey, entry] of Object.entries(parsed)) {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
        const record = entry as Record<string, unknown>;
        if (int(record.is_variation) === 1) continue; // handled as variants
        if (int(record.is_taxonomy) === 1) continue; // handled from terms below

        const label = str(record.name).trim() || attrKey;
        const value = str(record.value).trim();
        if (!value) continue;

        const spec = ensureSpec(
          productChunk.categoryCode,
          specKey(label),
          { it: label },
          'wc_attribute:local',
        );
        if (!spec) continue;
        // WooCommerce stores multiple local values pipe-separated.
        for (const part of value
          .split('|')
          .map((piece) => piece.trim())
          .filter(Boolean)) {
          collect(spec, productChunk, part);
        }
      }
    }

    // Taxonomy attributes: English machine label is all there is.
    for (const { taxonomy, value } of paByPost.get(productChunk.wpPostId) ?? []) {
      const label = attrLabels.get(taxonomy) ?? taxonomy.replace(/^pa_/, '');
      const spec = ensureSpec(
        productChunk.categoryCode,
        specKey(label),
        { it: label },
        `wc_attribute:${taxonomy}`,
      );
      if (!spec) continue;
      collect(spec, productChunk, value);
    }
  }

  // --- infer each spec's shape from its whole column, then coerce values
  for (const spec of specs) {
    const entries = raw.get(spec.id) ?? [];
    const inferred = inferSpec(entries.map((entry) => entry.value));
    spec.valueType = inferred.valueType;
    spec.unit = inferred.unit;
    spec.inferenceReason = inferred.reason;
    spec.isFilterable = isFilterableType(inferred.valueType);

    const optionIdByValue = new Map<string, string>();
    if (inferred.options.length > 0) {
      spec.options = inferred.options.map((value, index): SpecOptionChunk => {
        const machine = slugify(value, `opt-${index}`);
        const id = specOptionId(spec.categoryCode, spec.key, machine);
        optionIdByValue.set(value, id);
        return { id, value: machine, label: { it: value }, position: index };
      });
    }

    if (entries.length === 0) {
      note('spec', null, `${spec.categoryCode} / ${spec.key}`, 'no values — spec kept, empty');
      continue;
    }

    for (const entry of entries) {
      const value = entry.value;
      const chunk: SpecValueChunk = {
        productId: entry.productId,
        wpPostId: entry.wpPostId,
        specId: spec.id,
        categoryCode: spec.categoryCode,
        specKey: spec.key,
        rawValue: value,
        numberValue: null,
        numberMin: null,
        numberMax: null,
        booleanValue: null,
        textValue: null,
        optionIds: [],
        source: spec.source,
      };

      switch (inferred.valueType) {
        case 'boolean':
          chunk.booleanValue = asBoolean(value);
          break;
        case 'number':
          chunk.numberValue = asNumber(value)?.value ?? null;
          break;
        case 'number_range': {
          const range = asRange(value);
          chunk.numberMin = range?.min ?? null;
          chunk.numberMax = range?.max ?? null;
          break;
        }
        case 'single_select':
        case 'multi_select': {
          const id = optionIdByValue.get(value.trim().toLowerCase().replace(/\s+/g, ' '));
          if (id) chunk.optionIds = [id];
          else chunk.textValue = { it: value };
          break;
        }
        default:
          chunk.textValue = { it: value.slice(0, 500) };
      }
      specValues.push(chunk);
    }
  }

  // One row per (product, spec) — the table has a unique index on the pair.
  const seen = new Set<string>();
  const deduped = specValues.filter((value) => {
    const key = `${value.productId}::${value.specId}`;
    if (seen.has(key)) {
      note(
        'spec',
        value.wpPostId,
        `${value.categoryCode} / ${value.specKey}`,
        `duplicate value "${value.rawValue}" for one product — kept the first`,
      );
      return false;
    }
    seen.add(key);
    return true;
  });

  return { specs, specValues: deduped };
}

/** `["1","piazza","90","cm"]` — the plugin writes JSON, not PHP, for tokens. */
function safeJsonArray(raw: string): string[] | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : null;
  } catch {
    return null;
  }
}

// --- media ------------------------------------------------------------------

interface Attachment {
  id: number;
  mimeType: string;
  path: string;
  alt: string | null;
  title: string;
}

/**
 * Every attachment in the library, by id. One query for the whole run: both
 * product media and category icons resolve their ids against this map, and the
 * dump has few enough attachments that holding them all costs nothing.
 */
async function loadAttachments(q: Query): Promise<Map<number, Attachment>> {
  const rows = await q(`
    SELECT p.ID, p.post_mime_type, p.post_title, pm.meta_value AS path,
           alt.meta_value AS alt
    FROM {p}posts p
    JOIN {p}postmeta pm ON pm.post_id = p.ID AND pm.meta_key = '_wp_attached_file'
    LEFT JOIN {p}postmeta alt ON alt.post_id = p.ID AND alt.meta_key = '_wp_attachment_image_alt'
    WHERE p.post_type = 'attachment'
  `);

  const attachments = new Map<number, Attachment>();
  for (const row of rows) {
    attachments.set(int(row.ID), {
      id: int(row.ID),
      mimeType: str(row.post_mime_type),
      path: str(row.path),
      alt: str(row.alt).trim() || null,
      title: str(row.post_title),
    });
  }
  return attachments;
}

/** Absolute URL of an attachment on the live site. */
const urlOf = (attachment: Attachment): string =>
  `${MEDIA_BASE}/wp-content/uploads/${attachment.path}`;

/**
 * WooCommerce keeps a category's image in `wp_termmeta.thumbnail_id`. It is the
 * only imagery a `categories` row has (`icon`), so it is read here and
 * downloaded by `load` — never left for the back office to re-upload by hand.
 *
 * Vectors and rasters both pass: `icon_256` stores SVG as-is and squares
 * everything else, so the only rejection here is a mime that is not an image.
 */
function attachCategoryIcons(
  categories: CategoryChunk[],
  attachments: Map<number, Attachment>,
  thumbnailIdByTermId: Map<number, number>,
): void {
  for (const category of categories) {
    const attachmentId = thumbnailIdByTermId.get(category.wpTermId);
    if (!attachmentId) {
      note('category-icon', category.wpTermId, category.code, 'no thumbnail_id — icon stays null');
      continue;
    }
    const attachment = attachments.get(attachmentId);
    if (!attachment) {
      note('category-icon', category.wpTermId, category.code, `thumbnail ${attachmentId} missing`);
      continue;
    }
    if (!attachment.mimeType.startsWith('image/')) {
      note(
        'category-icon',
        category.wpTermId,
        category.code,
        `thumbnail ${attachmentId} is ${attachment.mimeType}, not an image — skipped`,
      );
      continue;
    }
    category.iconSource = {
      wpAttachmentId: attachment.id,
      url: urlOf(attachment),
      mimeType: attachment.mimeType,
      alt: attachment.alt ?? attachment.title ?? null,
    };
  }
}

function extractMedia(
  products: ProductChunk[],
  metaOf: (postId: number, key: string) => string,
  attachments: Map<number, Attachment>,
): MediaChunk[] {
  const roleFor = (mimeType: string, preferred: MediaRole): MediaRole | null => {
    if (mimeType === 'application/pdf') return 'document';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('image/')) return preferred === 'document' ? 'gallery' : preferred;
    return null;
  };

  const media: MediaChunk[] = [];

  for (const product of products) {
    const positions = new Map<MediaRole, number>();
    const push = (attachment: Attachment, preferred: MediaRole): void => {
      const role = roleFor(attachment.mimeType, preferred);
      if (!role) {
        note('media', attachment.id, attachment.path, `unsupported mime ${attachment.mimeType}`);
        return;
      }
      const position = positions.get(role) ?? 0;
      positions.set(role, position + 1);
      media.push({
        productId: product.id,
        wpPostId: product.wpPostId,
        wpAttachmentId: attachment.id,
        role,
        position,
        sourceUrl: urlOf(attachment),
        mimeType: attachment.mimeType,
        alt: attachment.alt ?? attachment.title ?? null,
      });
    };

    const thumbId = int(metaOf(product.wpPostId, '_thumbnail_id'));
    const thumb = attachments.get(thumbId);
    if (thumb) push(thumb, 'thumbnail');
    else if (thumbId) {
      note(
        'media',
        product.wpPostId,
        product.translation.title,
        `_thumbnail_id ${thumbId} missing`,
      );
    }

    const galleryIds = metaOf(product.wpPostId, '_product_image_gallery')
      .split(',')
      .map((piece) => Number.parseInt(piece.trim(), 10))
      .filter((value) => Number.isInteger(value) && value > 0);
    for (const id of galleryIds) {
      const attachment = attachments.get(id);
      if (attachment) push(attachment, 'gallery');
      else note('media', product.wpPostId, product.translation.title, `gallery id ${id} missing`);
    }
  }

  return media;
}

// --- addons -----------------------------------------------------------------

/**
 * YITH WAPO stores an addon's settings and its options as two parallel
 * serialized arrays. Only two exist in this dump and neither is bound to a
 * product, so `productIds` comes back empty for a human to fill in.
 */
async function extractAddons(q: Query): Promise<AddonChunk[]> {
  const rows = await q(`SELECT id, settings, options, priority FROM {p}yith_wapo_addons`);
  const addons: AddonChunk[] = [];

  for (const row of rows) {
    const wpId = int(row.id);
    const settings = tryPhpUnserialize(str(row.settings));
    const options = tryPhpUnserialize(str(row.options));
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      note('addon', wpId, 'yith addon', 'settings unparseable — SKIPPED');
      continue;
    }
    const config = settings as Record<string, unknown>;
    const title = str(config.title).trim();
    const description = str(config.description).trim();

    const optionRecord =
      options && typeof options === 'object' && !Array.isArray(options)
        ? (options as Record<string, unknown>)
        : {};
    const labels = Array.isArray(optionRecord.label) ? optionRecord.label.map(String) : [];
    const prices = Array.isArray(optionRecord.price) ? optionRecord.price.map(String) : [];

    // One addon row per option: `product_addons` is a flat priced extra, not a
    // group with choices, so a two-choice YITH block becomes two addons.
    labels.forEach((label, index) => {
      const price = toMoney(prices[index] ?? '') ?? '0.00';
      const name = label.trim() || title || `Extra ${wpId}`;
      addons.push({
        id: addonId(wpId * 100 + index),
        productIds: [],
        name: { it: name },
        description: description ? { it: description } : null,
        pricingMode: 'fixed',
        price,
        minQuantity: 0,
        maxQuantity: 1,
        position: addons.length,
        needsReview: ['productIds', ...(price === '0.00' ? ['price'] : [])],
      });
      note(
        'addon',
        wpId,
        name,
        `YITH addon "${title}" → flat addon at ${price}; not bound to a product, ASSIGN productIds`,
      );
    });
  }

  return addons;
}

await main().catch((error: unknown) => {
  console.error('\nExtract failed:', error);
  process.exit(1);
});
