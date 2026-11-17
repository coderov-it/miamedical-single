/**
 * Catalogue products an agent can put on a manual order, with exactly the choices
 * `resolveLine` will ask about: packages, add-ons, intake questions. Same projection
 * the storefront buy box prices from (`toPublicDetail`, source language), so the
 * form offers nothing the order would refuse. Docs: docs/code/manual-orders.md.
 *
 * ```
 * q "letto" → [{ title "Letto degenza", mode rental, packages [7 giorni 180.00, …],
 *               addons [{ id, name "Sponda", minQuantity 0, maxQuantity 2 }], questions [...] }]
 * ```
 */

import type { Database } from '@mia/db';
import { ProductQuerySchema } from '@mia/validators';
import { SOURCE_LANGUAGE } from '@mia/validators/language';
import * as v from 'valibot';

import type { SessionUser } from '../../../shared/http/context.ts';
import * as catalogRepo from '../../products/catalog/repo.ts';
import * as catalogService from '../../products/catalog/service.ts';
import type { PublicProductDetailDto } from '../../products/dto.ts';
import { toPublicDetail } from '../../products/mapper.ts';

export interface LineProductDto {
  id: string;
  slug: string;
  title: string;
  mode: 'fixed' | 'rental';
  rentalUnit: 'hour' | 'day' | null;
  /** A fixed product's price; null on a rental (its packages are the price). */
  price: string | null;
  inStock: boolean;
  packages: { code: string; label: string; price: string; unit: 'hour' | 'day' }[];
  addons: {
    id: string;
    name: string;
    price: string;
    minQuantity: number;
    maxQuantity: number | null;
  }[];
  questions: {
    key: string;
    prompt: string;
    valueType: string;
    isRequired: boolean;
    options: { value: string; label: string }[];
  }[];
}

const MAX_RESULTS = 8;

export function toLineProduct(product: PublicProductDetailDto): LineProductDto {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    mode: product.pricing.mode,
    rentalUnit: product.pricing.rentalUnit,
    price: product.pricing.price,
    inStock: product.inStock,
    packages: product.rentalPackages.map((pkg) => ({
      code: pkg.code,
      label: pkg.label,
      price: pkg.price,
      unit: pkg.unit,
    })),
    addons: product.addons.map((addon) => ({
      id: addon.id,
      name: addon.name,
      price: addon.pricing.price,
      minQuantity: addon.minQuantity,
      maxQuantity: addon.maxQuantity,
    })),
    questions: product.questions.map((question) => ({
      key: question.key,
      prompt: question.prompt,
      valueType: question.valueType,
      isRequired: question.isRequired,
      options: question.options.map((option) => ({ value: option.value, label: option.label })),
    })),
  };
}

export async function searchLineProducts(
  db: Database,
  q: string,
  user: SessionUser | null,
): Promise<LineProductDto[]> {
  const query = v.parse(ProductQuerySchema, { q, perPage: String(MAX_RESULTS), sort: 'title' });
  const { rows } = await catalogService.list(db, query, user);
  const aggregates = await catalogRepo.findAggregatesByIds(
    db,
    rows.map((row) => row.id),
  );
  return rows.flatMap((row) => {
    const aggregate = aggregates.get(row.id);
    if (!aggregate || aggregate.status !== 'active') return [];
    return [toLineProduct(toPublicDetail(aggregate, SOURCE_LANGUAGE))];
  });
}
