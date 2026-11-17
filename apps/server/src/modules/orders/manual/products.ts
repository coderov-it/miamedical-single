/**
 * Catalogue products an agent can put on a manual order, with exactly the choices
 * `resolveLine` will ask about: packages, add-ons, intake questions. Same projection
 * the storefront buy box prices from (`toPublicDetail`, source language), so the
 * form offers nothing the order would refuse. The grid reads light cards; a product's choices load
 * when it is picked. Docs: docs/code/manual-orders.md.
 *
 * ```
 * q "letto" → rows [{ title "Letto degenza", mode rental, packages [7 giorni 180.00, …],
 *               addons [{ id, name "Sponda", minQuantity 0, maxQuantity 2 }], questions [...] }]
 * ```
 */

import type { Database } from '@mia/db';
import { type LineProductSearchInput, ProductQuerySchema } from '@mia/validators';
import { SOURCE_LANGUAGE } from '@mia/validators/language';
import * as v from 'valibot';

import type { SessionUser } from '../../../shared/http/context.ts';
import * as catalogRepo from '../../products/catalog/repo.ts';
import * as catalogService from '../../products/catalog/service.ts';
import type { PublicProductDetailDto } from '../../products/dto.ts';
import { toPublicDetail, toPublicSummary } from '../../products/mapper.ts';

/** What the browser's grid needs to draw a card; the choices come with `getLineProduct`. */
export interface LineCardDto {
  id: string;
  title: string;
  mode: 'fixed' | 'rental';
  /** The lowest real total: the price when fixed, the cheapest package when rental. */
  fromPrice: string | null;
  inStock: boolean;
  /** Units on the shelf. */
  stock: number;
  /** Stored media key of the cover image; `mediaUrl()` turns it into a URL. */
  image: string | null;
  category: { code: string; name: string };
}

export interface LineProductDto {
  id: string;
  slug: string;
  title: string;
  mode: 'fixed' | 'rental';
  rentalUnit: 'hour' | 'day' | null;
  /** A fixed product's price; null on a rental (its packages are the price). */
  price: string | null;
  /** The lowest real total: the price when fixed, the cheapest package when rental. */
  fromPrice: string | null;
  inStock: boolean;
  /** Units on the shelf. */
  stock: number;
  /** Stored media key of the cover image; `mediaUrl()` turns it into a URL. */
  image: string | null;
  category: { code: string; name: string };
  packages: {
    code: string;
    name: string;
    label: string;
    price: string;
    duration: number;
    unit: 'hour' | 'day';
  }[];
  addons: {
    id: string;
    name: string;
    description: string | null;
    price: string;
    /** Set when the add-on is priced per rental unit. */
    rentalUnit: 'hour' | 'day' | null;
    minQuantity: number;
    maxQuantity: number | null;
  }[];
  questions: {
    key: string;
    prompt: string;
    helpText: string | null;
    valueType: string;
    isRequired: boolean;
    options: { value: string; label: string }[];
  }[];
}

export function toLineProduct(product: PublicProductDetailDto): LineProductDto {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    mode: product.pricing.mode,
    rentalUnit: product.pricing.rentalUnit,
    price: product.pricing.price,
    fromPrice: product.pricing.fromPrice,
    inStock: product.inStock,
    stock: product.stock,
    image: product.media.thumbnail?.path ?? null,
    category: { code: product.category.code, name: product.category.name },
    packages: product.rentalPackages.map((pkg) => ({
      code: pkg.code,
      name: pkg.name,
      label: pkg.label,
      price: pkg.price,
      duration: pkg.duration,
      unit: pkg.unit,
    })),
    addons: product.addons.map((addon) => ({
      id: addon.id,
      name: addon.name,
      description: addon.description,
      price: addon.pricing.price,
      rentalUnit: addon.pricing.mode === 'rental' ? addon.pricing.rentalUnit : null,
      minQuantity: addon.minQuantity,
      maxQuantity: addon.maxQuantity,
    })),
    questions: product.questions.map((question) => ({
      key: question.key,
      prompt: question.prompt,
      helpText: question.helpText,
      valueType: question.valueType,
      isRequired: question.isRequired,
      options: question.options.map((option) => ({ value: option.value, label: option.label })),
    })),
  };
}

export interface LineProductPage {
  rows: LineCardDto[];
  meta: { page: number; perPage: number; total: number; pageCount: number };
}

/** One page of the browser: best sellers first, or title order for a typed search. */
export async function searchLineProducts(
  db: Database,
  search: LineProductSearchInput,
  user: SessionUser | null,
): Promise<LineProductPage> {
  const query = v.parse(ProductQuerySchema, {
    ...(search.q ? { q: search.q } : {}),
    ...(search.category ? { category: search.category } : {}),
    ...(search.mode ? { mode: search.mode } : {}),
    page: String(search.page),
    perPage: String(search.perPage),
    // `popular` is the catalogue's order-count rank: what has sold most leads.
    sort: search.sort === 'best_selling' ? 'popular' : 'title',
  });
  const { rows, total } = await catalogService.listRows(db, query, user);
  const cards = rows.flatMap((row) => {
    if (row.status !== 'active') return [];
    const card = toPublicSummary(row, SOURCE_LANGUAGE);
    return [
      {
        id: card.id,
        title: card.title,
        mode: card.pricing.mode,
        fromPrice: card.pricing.fromPrice,
        inStock: card.inStock,
        stock: row.stock,
        image: card.thumbnail?.path ?? null,
        category: { code: row.category.code, name: card.category.name },
      },
    ];
  });
  return {
    rows: cards,
    meta: {
      page: query.page,
      perPage: query.perPage,
      total,
      pageCount: Math.max(1, Math.ceil(total / query.perPage)),
    },
  };
}

/** The choices of one product, loaded when the agent picks its card. */
export async function getLineProduct(db: Database, id: string): Promise<LineProductDto | null> {
  const aggregate = await catalogRepo.findLineAggregate(db, id);
  if (!aggregate || aggregate.status !== 'active') return null;
  return toLineProduct(toPublicDetail(aggregate, SOURCE_LANGUAGE));
}
