import type { InferResponseType } from 'hono/client';

import type { DirtyState } from '~/lib/dirty.svelte';

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

/**
 * Card/hero chips. The limits mirror `ProductChipsSchema` in @mia/validators —
 * the server is the authority, these two numbers only let the form say so
 * before a save round-trip.
 */
export const MAX_CHIPS = 5;
export const MAX_CHIP_LENGTH = 20;

export interface ChipEdit {
  /** Client-only stable key — reordering keyed by index corrupts edits. */
  uid: string;
  text: Localized;
}

export interface TabProps {
  product: AdminProduct;
  onSaved: (product: AdminProduct) => void;
  /**
   * Shared across all ten tabs. Each reports its own section so the strip can
   * show a dot and the page-exit guard can name what would be lost.
   */
  dirty: DirtyState;
}

/**
 * Cheap structural comparison for dirty tracking. The editor state is plain
 * JSON — strings, numbers, booleans, arrays of those — so key order is stable
 * because both sides are built by the same code, and this is far cheaper than
 * a deep walk on every keystroke.
 */
export function sameAsSaved(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
