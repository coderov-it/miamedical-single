/**
 * The delivery-zone tree as the admin sees it: shape, resolution, and the rules
 * about what may nest inside what.
 *
 * These rules are a MIRROR, not the authority. The server enforces the same
 * nesting and the same code shapes (`modules/delivery/service.ts`), and the
 * database enforces them again with constraints. They live here so the UI can grey
 * out an impossible action instead of offering it and showing a 422.
 *
 * WHY A TREE. The owner's price sheet covers the areas they actually serve, not all
 * ~7,900 comuni. Inheritance closes that gap: a fee set on a region or a province
 * covers every area below it that has nothing of its own, so coverage is complete
 * from the first row entered.
 *
 * WHY CAP IS NOT A LEVEL OF ITS OWN. A CAP is a postal code drawn by the post
 * office and it lines up with nothing in either direction. Measured on the seeded
 * reference data: Rome alone holds 79 CAPs, while CAP 00060 covers 17 whole comuni
 * and 24060 covers 45. So a `cap` node always means the PAIR (its parent comune +
 * this code) — never a CAP on its own. Pinning the comune first is what stops a
 * shared CAP leaking one comune's fee onto its neighbours.
 *
 * Full reasoning, with worked examples: docs/code/delivery-pricing.md.
 */

import type { InferResponseType } from 'hono/client';

import type { api } from '~/lib/api';

/** The wire shape, taken from the endpoint rather than restated. */
export type ZoneResponse = InferResponseType<
  (typeof api.api.admin)['delivery-zones']['$get'],
  200
>;
export type ApiZone = ZoneResponse['data'][number];

export type ZoneLevel = ApiZone['level'];
export type ZoneValueKind = NonNullable<ApiZone['valueKind']>;

/**
 * A node of the tree the page renders.
 *
 * Structurally the API shape, restated as a recursive interface because
 * `InferResponseType` flattens the nesting at a fixed depth — the tree is five
 * levels deep and the inferred type stops short.
 */
export interface ZoneNode {
  readonly id: string;
  readonly parentId: string | null;
  readonly level: ZoneLevel;
  /**
   * DISPLAY ONLY. Never matched on, never parsed, safe to rename at any time — an
   * operator fixing a spelling must not be able to change what an address resolves
   * to. Everything the resolver needs is in `code`.
   */
  name: string;
  /**
   * The identity this node matches on, and the only field pricing reads:
   *
   *   country   → 'IT'
   *   region    → ISTAT region code   ('12')
   *   province  → province code       ('RM')
   *   comune    → ISTAT comune code   ('058091')
   *   cap       → the CAP alone       ('00121')
   *   frazione  → a stable slug       ('ostia-antica')
   *
   * A node stores ONLY its own discriminator. A cap node does not repeat its
   * comune's ISTAT code, because the comune is already its parent — see `matchKey`,
   * which composes the full tuple by walking the path. That is what keeps
   * "Roma + 00121" a rendering concern rather than a stored string.
   */
  code: string;
  /** `null` means inherit. See `resolveZone`. */
  valueKind: ZoneValueKind | null;
  /** Set only when `valueKind` is `'fee'`. A decimal string, never a number. */
  fee: string | null;
  children: ZoneNode[];
}

/** The API's nested payload, as the recursive type the UI wants. */
export function toZoneNodes(rows: readonly ApiZone[]): ZoneNode[] {
  return rows.map((row) => ({
    id: row.id,
    parentId: row.parentId,
    level: row.level,
    name: row.name,
    code: row.code,
    valueKind: row.valueKind,
    fee: row.fee,
    children: toZoneNodes((row.children ?? []) as ApiZone[]),
  }));
}

/**
 * The tuple an address is matched against, composed from the path rather than
 * stored on the node.
 *
 * Nothing here reads `name`. If this function ever needs to, the model is wrong.
 */
export interface ZoneMatchKey {
  readonly countryCode?: string;
  readonly regionCode?: string;
  readonly provinceCode?: string;
  readonly istatCode?: string;
  readonly cap?: string;
  readonly frazioneKey?: string;
}

export function matchKey(node: ZoneNode, parents: ParentIndex): ZoneMatchKey {
  const key: {
    countryCode?: string;
    regionCode?: string;
    provinceCode?: string;
    istatCode?: string;
    cap?: string;
    frazioneKey?: string;
  } = {};
  for (const step of zonePath(node, parents)) {
    if (step.level === 'country') key.countryCode = step.code;
    else if (step.level === 'region') key.regionCode = step.code;
    else if (step.level === 'province') key.provinceCode = step.code;
    else if (step.level === 'comune') key.istatCode = step.code;
    else if (step.level === 'cap') key.cap = step.code;
    else if (step.level === 'frazione') key.frazioneKey = step.code;
  }
  return key;
}

/** `istat=058091 · cap=00121` — the stored identity, for the editor to show. */
export function describeMatchKey(key: ZoneMatchKey): string {
  return (
    [
      key.countryCode ? `country=${key.countryCode}` : '',
      key.regionCode ? `region=${key.regionCode}` : '',
      key.provinceCode ? `province=${key.provinceCode}` : '',
      key.istatCode ? `istat=${key.istatCode}` : '',
      key.cap ? `cap=${key.cap}` : '',
      key.frazioneKey ? `frazione=${key.frazioneKey}` : '',
    ]
      .filter(Boolean)
      .join(' · ') || '—'
  );
}

/**
 * What the code field is called per level, and what a valid one looks like.
 *
 * `pattern` mirrors `CODE_SHAPE` in the server's service. Checking it here turns a
 * round trip into an inline hint; the server still rejects a bad code either way.
 */
export const CODE_FIELD: Record<
  ZoneLevel,
  { label: string; placeholder: string; hint: string; pattern: RegExp }
> = {
  country: {
    label: 'Country code',
    placeholder: 'IT',
    hint: 'Two letters. There is only one country row and it cannot be changed.',
    pattern: /^[A-Za-z]{2}$/,
  },
  region: {
    label: 'Region code',
    placeholder: '12',
    hint: 'The two-digit ISTAT region code — Lazio is 12, Lombardia 03.',
    pattern: /^\d{2}$/,
  },
  province: {
    label: 'Province code',
    placeholder: 'RM',
    hint: 'The two letters that appear in an address.',
    pattern: /^[A-Za-z]{2}$/,
  },
  comune: {
    label: 'ISTAT code',
    placeholder: '058091',
    hint: 'Six digits, from the ISTAT comune list. Survives renames, which is why pricing keys on it.',
    pattern: /^\d{6}$/,
  },
  cap: {
    label: 'CAP',
    placeholder: '00121',
    hint: 'Five digits — the postal code alone. The comune comes from the parent row.',
    pattern: /^\d{5}$/,
  },
  frazione: {
    label: 'Frazione key',
    placeholder: 'ostia-antica',
    hint: 'A lowercase slug you choose. Nothing matches on it yet — see Help.',
    pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  },
};

export const LEVEL_LABEL: Record<ZoneLevel, string> = {
  country: 'Country',
  region: 'Region',
  province: 'Province',
  comune: 'Comune',
  cap: 'CAP',
  frazione: 'Frazione',
};

/** Short form for the row badge, where the column is narrow. */
export const LEVEL_BADGE: Record<ZoneLevel, string> = {
  country: 'PAESE',
  region: 'REG',
  province: 'PROV',
  comune: 'COMUNE',
  cap: 'CAP',
  frazione: 'FRAZ',
};

/**
 * What each level may contain. Mirrors `delivery_zones_nesting_check`.
 *
 * A frazione is the deepest node: below it there is nothing in the address data
 * reliable enough to key a price on.
 */
export const ALLOWED_CHILDREN: Record<ZoneLevel, readonly ZoneLevel[]> = {
  country: ['region'],
  region: ['province'],
  province: ['comune'],
  comune: ['cap', 'frazione'],
  cap: ['frazione'],
  frazione: [],
};

/** id → parent, or null for the root. Rebuilt whenever the tree is replaced. */
export type ParentIndex = ReadonlyMap<string, ZoneNode | null>;

export function indexParents(roots: readonly ZoneNode[]): ParentIndex {
  const parents = new Map<string, ZoneNode | null>();
  const walk = (nodes: readonly ZoneNode[], parent: ZoneNode | null) => {
    for (const node of nodes) {
      parents.set(node.id, parent);
      walk(node.children, node);
    }
  };
  walk(roots, null);
  return parents;
}

export interface ResolvedZone {
  /** What applies here. Never null in practice — the country row always decides. */
  readonly value: { kind: ZoneValueKind; fee: string | null } | null;
  /** The node the value was read from — the same node when it owns one. */
  readonly source: ZoneNode | null;
  readonly inherited: boolean;
}

/**
 * Walks up to the nearest ancestor that owns a value.
 *
 * It reports the SOURCE as well as the value on purpose: an inherited fee and a
 * typed one look identical as a number, and an editor that cannot tell them apart
 * invites someone to "fix" a figure on the wrong row.
 *
 * This is the display-side twin of the server's `resolveQuote`. It answers "what
 * does this ROW effectively cost", which is a walk up one path; the server answers
 * "what does this ADDRESS cost", which has to reconcile every comune a CAP could
 * mean. The quote is never computed here.
 */
export function resolveZone(node: ZoneNode, parents: ParentIndex): ResolvedZone {
  let cursor: ZoneNode | null | undefined = node;
  while (cursor) {
    if (cursor.valueKind !== null) {
      return {
        value: { kind: cursor.valueKind, fee: cursor.fee },
        source: cursor,
        inherited: cursor !== node,
      };
    }
    cursor = parents.get(cursor.id);
  }
  return { value: null, source: null, inherited: false };
}

/** Every node from the root down to this one, for the breadcrumb. */
export function zonePath(node: ZoneNode, parents: ParentIndex): ZoneNode[] {
  const chain: ZoneNode[] = [];
  let cursor: ZoneNode | null | undefined = node;
  while (cursor) {
    chain.unshift(cursor);
    cursor = parents.get(cursor.id);
  }
  return chain;
}

export function countDescendants(node: ZoneNode): number {
  return node.children.reduce((total, child) => total + 1 + countDescendants(child), 0);
}

/**
 * How a row is titled. A `cap` node is the pair, so it reads as one — writing it as
 * a bare CAP is exactly the mistake the model exists to prevent.
 */
export function zoneTitle(node: ZoneNode, parents: ParentIndex): string {
  if (node.level !== 'cap') return node.name;
  /* Composed for the eye only — the pair is stored as (parent comune, this CAP),
     never as this string. */
  const parent = parents.get(node.id);
  return `${parent?.name ?? '—'} + ${node.code}`;
}

/** Matches the node itself, or is kept because a descendant matches. */
export function zoneMatches(node: ZoneNode, term: string): boolean {
  if (!term) return true;
  const haystack = [node.name, node.code, LEVEL_LABEL[node.level]]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(term) || node.children.some((child) => zoneMatches(child, term));
}

/** Finds a node anywhere in the tree. */
export function findZone(nodes: readonly ZoneNode[], id: string): ZoneNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const hit = findZone(node.children, id);
    if (hit) return hit;
  }
  return undefined;
}
