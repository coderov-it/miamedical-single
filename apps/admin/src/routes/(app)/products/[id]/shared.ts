import type { InferResponseType } from 'hono/client';

import { api } from '~/lib/api';

/** DTO shapes inferred from the RPC client — never redeclared by hand. */
export type AdminProduct = InferResponseType<
  (typeof api.api.admin.products)[':id']['$get'],
  200
>['data'];

export type AdminCategory = InferResponseType<
  typeof api.api.admin.categories.$get,
  200
>['data'][number];

export type AdminPreset = InferResponseType<
  typeof api.api.admin.attributes.$get,
  200
>['data'][number];

export type AdminTerms = InferResponseType<typeof api.api.admin.terms.$get, 200>['data'][number];

export type Localized = { it: string; en?: string | undefined };

/** Normalise a possibly-null jsonb label into a bindable `{ it, en }`. */
export function localizedOf(value: Localized | null | undefined): Localized {
  return value ? { it: value.it, en: value.en } : { it: '' };
}

/** Empty string → the object is dropped (nullable columns). */
export function localizedOrNull(value: Localized): Localized | null {
  const it = value.it.trim();
  if (!it) return null;
  const en = value.en?.trim();
  return en ? { it, en } : { it };
}

export interface TabProps {
  product: AdminProduct;
  onSaved: (product: AdminProduct) => void;
}
