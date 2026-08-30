import type { Database } from '@mia/db';
import type { LanguageCode } from '@mia/db/schema';
import { P, can } from '@mia/permissions';
import type { CreateProductInput, ProductQuery, UpdateProductInput } from '@mia/validators';

import type { FileUploader } from '../../../infra/storage/port.ts';
import type { SessionUser } from '../../../shared/http/context.ts';
import { sanitizeRichText } from '../../../shared/html/rich-text.ts';
import { conflict, httpError, notFound } from '../../../shared/http/errors.ts';
import { pick } from '../i18n.ts';
import type { FacetDto } from '../dto.ts';
import { commitProductMedia, deleteAllMedia } from '../media/service.ts';
import type {
  ProductAggregate,
  ProductListFilters,
  ProductSummaryRowData,
  SpecFilter,
} from '../types.ts';
import * as repo from './repo.ts';

/**
 * Business orchestration. Owns visibility policy and invariants; returns
 * aggregates so it stays transport-agnostic — routes apply the mapper.
 */

/** Back-office users with product read access see drafts; the public does not. */
const canSeeHidden = (user: SessionUser | null): boolean => can(user, P.PRODUCT_READ);

/** `key:value|value;key:10..20;key:true` → structured filters. */
export function parseSpecFilters(raw: string | undefined): SpecFilter[] {
  if (!raw) return [];
  const filters: SpecFilter[] = [];
  for (const part of raw.split(';').slice(0, 20)) {
    const [key, value] = part.split(':', 2);
    if (!key || !value) continue;
    const range = /^(-?\d+(?:\.\d+)?)?\.\.(-?\d+(?:\.\d+)?)?$/.exec(value);
    if (range) {
      const filter: SpecFilter = { key };
      if (range[1] !== undefined) filter.min = Number(range[1]);
      if (range[2] !== undefined) filter.max = Number(range[2]);
      filters.push(filter);
    } else if (value === 'true' || value === 'false') {
      filters.push({ key, boolean: value === 'true' });
    } else {
      filters.push({ key, values: value.split('|').filter(Boolean).slice(0, 20) });
    }
  }
  return filters;
}

export interface ListResult {
  rows: ProductSummaryRowData[];
  total: number;
  facets: { specs: FacetDto[] };
  filters: ProductListFilters;
}

export async function list(
  db: Database,
  query: ProductQuery,
  user: SessionUser | null,
): Promise<ListResult> {
  const categoryId = query.category
    ? await repo.findCategoryIdByCode(db, query.category)
    : undefined;
  // An unknown category matches nothing rather than everything.
  if (query.category && !categoryId) {
    const filters = emptyFilters(query);
    return { rows: [], total: 0, facets: { specs: [] }, filters };
  }

  const filters: ProductListFilters = {
    page: query.page,
    perPage: query.perPage,
    locale: query.locale,
    q: query.q,
    categoryId,
    mode: query.mode,
    status: query.status,
    featured: query.featured,
    sort: query.sort,
    specFilters: parseSpecFilters(query.specs),
    includeNonActive: canSeeHidden(user),
  };

  const [{ rows, total }, counts] = await Promise.all([
    repo.findMany(db, filters),
    repo.facetCounts(db, filters),
  ]);

  return { rows, total, facets: buildFacets(counts, filters), filters };
}

function emptyFilters(query: ProductQuery): ProductListFilters {
  return {
    page: query.page,
    perPage: query.perPage,
    locale: query.locale,
    q: query.q,
    categoryId: undefined,
    mode: query.mode,
    status: query.status,
    featured: query.featured,
    sort: query.sort,
    specFilters: [],
    includeNonActive: false,
  };
}

function buildFacets(
  counts: Awaited<ReturnType<typeof repo.facetCounts>>,
  filters: ProductListFilters,
): { specs: FacetDto[] } {
  const selectedBySpec = new Map(
    filters.specFilters
      .filter((filter) => filter.values)
      .map((filter) => [filter.key, new Set(filter.values)]),
  );

  const selectFacets = new Map<string, Extract<FacetDto, { options: unknown }>>();
  for (const row of counts.selects) {
    let facet = selectFacets.get(row.specKey);
    if (!facet) {
      facet = {
        key: row.specKey,
        label: pick(row.specLabel, filters.locale),
        valueType: row.valueType as 'single_select' | 'multi_select',
        options: [],
      };
      selectFacets.set(row.specKey, facet);
    }
    facet.options.push({
      value: row.optionValue,
      label: pick(row.optionLabel, filters.locale),
      count: row.count,
      selected: selectedBySpec.get(row.specKey)?.has(row.optionValue) ?? false,
    });
  }

  const numberFacets: FacetDto[] = counts.numbers.map((row) => ({
    key: row.specKey,
    label: pick(row.specLabel, filters.locale),
    valueType: row.valueType as 'number' | 'number_range',
    unit: row.unit,
    min: row.min === null ? null : Number(row.min),
    max: row.max === null ? null : Number(row.max),
  }));

  return { specs: [...selectFacets.values(), ...numberFacets] };
}

export async function getPublicBySlug(
  db: Database,
  slug: string,
  user: SessionUser | null,
): Promise<ProductAggregate> {
  const hit = await repo.findIdBySlug(db, slug);
  if (!hit) throw notFound('Product');

  const product = await repo.findAggregate(db, hit.productId);
  if (!product || (product.status !== 'active' && !canSeeHidden(user))) {
    // Deliberately a 404, not a 403 — a hidden product's existence is not public.
    throw notFound('Product');
  }
  return product;
}

export async function getAggregate(db: Database, id: string): Promise<ProductAggregate> {
  const product = await repo.findAggregate(db, id);
  if (!product) throw notFound('Product');
  return product;
}

async function assertSlugsFree(
  db: Database,
  translations: CreateProductInput['translations'] | undefined,
  excludeId?: string,
): Promise<void> {
  for (const lang of ['it', 'en'] as LanguageCode[]) {
    const translation = translations?.[lang];
    if (!translation) continue;
    if (await repo.existsBySlug(db, lang, translation.slug, excludeId)) {
      throw conflict(`A product with slug "${translation.slug}" already exists (${lang}).`);
    }
  }
}

export async function create(db: Database, input: CreateProductInput): Promise<ProductAggregate> {
  await assertSlugsFree(db, input.translations);

  const id = await repo.create(db, {
    categoryId: input.categoryId,
    status: input.status,
    brand: input.brand ?? null,
    pricingMode: input.pricingMode,
    basePrice: input.basePrice ?? null,
    marketingRate: input.marketingRate ?? null,
    currency: input.currency,
    rentalUnit: input.rentalUnit ?? null,
    /* Unlike every other pricing detail, packages cannot wait for the edit
       screen: they ARE the rental's price, and the CHECK refuses the INSERT
       without one. `CreateProductSchema` has already paired them with the mode. */
    rentalPackages: input.rentalPackages ?? [],
    stock: input.stock,
    isFeatured: input.isFeatured,
    chips: input.chips,
    translations: normalizeTranslations(input.translations),
  });

  return getAggregate(db, id);
}

function normalizeTranslations(
  translations: CreateProductInput['translations'] | undefined,
): Partial<Record<LanguageCode, repo.TranslationData>> {
  const result: Partial<Record<LanguageCode, repo.TranslationData>> = {};
  for (const lang of ['it', 'en'] as LanguageCode[]) {
    const t = translations?.[lang];
    if (!t) continue;
    result[lang] = {
      title: t.title,
      shortDescription: t.shortDescription ?? null,
      // The only rich-text field in the catalog. Sanitised here, on the way in,
      // so the database never holds markup the storefront would not dare render.
      description: sanitizeRichText(t.description),
      slug: t.slug,
      metaTitle: t.metaTitle ?? null,
      metaDescription: t.metaDescription ?? null,
    };
  }
  return result;
}

export async function update(
  db: Database,
  storage: FileUploader,
  id: string,
  input: UpdateProductInput,
): Promise<ProductAggregate> {
  const existing = await repo.findRow(db, id);
  if (!existing) throw notFound('Product');

  /* Every one of these has a CHECK saying the same thing one layer down. They
     are restated here to answer with the field that is wrong rather than a
     constraint name the admin form cannot place. */
  if (input.rentalUnit !== undefined && existing.pricingMode !== 'rental') {
    throw httpError(422, 'A fixed-price product has no rental unit.', 'validation_failed');
  }
  if (input.rentalPackages !== undefined && existing.pricingMode !== 'rental') {
    throw httpError(422, 'A fixed-price product cannot have rental packages.', 'validation_failed');
  }
  if (input.basePrice !== undefined && existing.pricingMode !== 'fixed') {
    throw httpError(
      422,
      'A rental product has no base price — its packages are its price.',
      'validation_failed',
    );
  }
  if (input.marketingRate !== undefined && existing.pricingMode !== 'rental') {
    throw httpError(422, 'Only a rental product carries a marketing rate.', 'validation_failed');
  }
  await assertSlugsFree(db, input.translations, id);

  const data: repo.UpdateProductData = {};
  if (input.categoryId !== undefined) data.categoryId = input.categoryId;
  if (input.status !== undefined) data.status = input.status;
  if (input.brand !== undefined) data.brand = input.brand;
  if (input.basePrice !== undefined) data.basePrice = input.basePrice;
  if (input.marketingRate !== undefined) data.marketingRate = input.marketingRate;
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.rentalUnit !== undefined) data.rentalUnit = input.rentalUnit;
  if (input.rentalPackages !== undefined) data.rentalPackages = input.rentalPackages;
  if (input.stock !== undefined) data.stock = input.stock;
  if (input.isFeatured !== undefined) data.isFeatured = input.isFeatured;
  if (input.chips !== undefined) data.chips = input.chips;
  if (input.translations !== undefined) {
    data.translations = normalizeTranslations(input.translations);
  }
  if (input.media !== undefined) {
    data.media = await commitProductMedia(storage, id, existing.media, input.media);
  }

  await repo.update(db, id, data);
  return getAggregate(db, id);
}

export async function remove(db: Database, storage: FileUploader, id: string): Promise<void> {
  const product = await repo.findAggregate(db, id);
  if (!product) throw notFound('Product');
  await repo.remove(db, id);
  // Bucket cleanup is best-effort and after the row is gone.
  await deleteAllMedia(
    storage,
    product.media,
    product.addons.map((addon) => addon.icon),
  );
}
