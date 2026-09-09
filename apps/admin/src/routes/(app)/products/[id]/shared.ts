import type { InferResponseType } from 'hono/client';

import type { DirtyState } from '~/lib/dirty.svelte';

import { api } from '~/lib/api';
import type { LocalizedValue } from '~/lib/i18n';

/** DTO shapes inferred from the RPC client — never redeclared by hand. */
export type AdminProduct = InferResponseType<
  (typeof api.api.admin.products)[':id']['$get'],
  200
>['data'];

export type AdminCategory = InferResponseType<
  typeof api.api.admin.categories.$get,
  200
>['data'][number];

export type AdminTerms = InferResponseType<typeof api.api.admin.terms.$get, 200>['data'][number];

/* The three localized helpers are the registry's, not this module's — a
   `{ it, en }` written out here is exactly what stopped a third language from
   being a data change. Re-exported so the tabs keep one import. */
export type Localized = LocalizedValue;
export { cloneLocalized as localizedOf, localizedOrNull, translationError } from '~/lib/i18n';

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
   * Shared across every tab. Each reports its own section so the strip can
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
