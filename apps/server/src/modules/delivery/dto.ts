import type { ZoneLevel, ZoneValueKind } from './types.ts';

// --- admin -----------------------------------------------------------------

/**
 * One node of the price tree. The admin renders this shape directly, so the
 * hierarchy is nested rather than a flat list plus `parentId` — the client should
 * not have to rebuild the tree the server already knows.
 *
 * `parentId` is still here because mutations need it.
 */
export interface AdminZoneDto {
  id: string;
  parentId: string | null;
  level: ZoneLevel;
  /** What an address matches on. See docs/code/delivery-pricing.md. */
  code: string;
  /** Display only — renaming never changes what an address matches. */
  name: string;
  /** `null` means inherit from the nearest ancestor that decided something. */
  valueKind: ZoneValueKind | null;
  /** Set only when `valueKind` is `'fee'`. A decimal string, never a number. */
  fee: string | null;
  children: AdminZoneDto[];
}

// --- public ----------------------------------------------------------------

/**
 * What the checkout gets back. There is always an answer — the country row
 * guarantees it — so this has no "unknown" case.
 *
 * `kind: 'call'` is not an error: it means we serve the address and will agree the
 * cost by phone. The storefront shows a total of "€ X + consegna".
 */
export interface QuoteDto {
  kind: ZoneValueKind;
  /** Present exactly when `kind` is `'fee'`. */
  fee: string | null;
  /** The name of the row that answered, as the operator typed it (Italian). */
  areaLabel: string;
  /** Which tier answered, so the storefront can say how precise this is. */
  resolvedVia: ZoneLevel;
  zoneId: string;
  /**
   * The comune we pinned, when the CAP named exactly one — or the name matched one
   * of several. `null` when the CAP is shared and nothing broke the tie, which is
   * also when `resolvedVia` will be `province` or wider.
   */
  comune: { istatCode: string; name: string; provinceCode: string } | null;
}
