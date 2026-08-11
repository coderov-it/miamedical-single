import type { Database } from '@mia/db';
import type { CreateZoneInput, QuoteInput, UpdateZoneInput } from '@mia/validators';

import { conflict, httpError, notFound } from '../../shared/http/errors.ts';
import type { AdminZoneDto, QuoteDto } from './dto.ts';
import { toQuote, toZone, toZoneTree } from './mapper.ts';
import { normaliseComuneName } from './name.ts';
import * as repo from './repo.ts';
import type { ComuneRow, ZoneCandidate, ZoneLevel, ZoneRow } from './types.ts';

/**
 * The delivery-zone tree and the one function that reads it.
 *
 * `resolveQuote` is the only place an address becomes a price. The admin's coverage
 * checker calls the same endpoint rather than reimplementing the ladder in the
 * browser, because two implementations of a pricing rule is one too many.
 *
 * Full reasoning, with worked examples: docs/code/delivery-pricing.md.
 */

/* -------------------------------------------------------------- the tree --- */

/** Which levels may nest inside which. Mirrors `delivery_zones_nesting_check`. */
const ALLOWED_CHILDREN: Record<ZoneLevel, readonly ZoneLevel[]> = {
  country: ['region'],
  region: ['province'],
  province: ['comune'],
  comune: ['cap', 'frazione'],
  cap: ['frazione'],
  frazione: [],
};

/**
 * What a code must look like, per level. Checked here rather than in the schema
 * because the rule depends on the level the row is being created at.
 *
 * A wrong code is the one mistake with no symptom: the row looks fine in the tree
 * and silently matches nothing forever.
 */
const CODE_SHAPE: Record<ZoneLevel, { pattern: RegExp; hint: string }> = {
  country: { pattern: /^[A-Z]{2}$/, hint: 'two uppercase letters, e.g. IT' },
  region: { pattern: /^\d{2}$/, hint: 'the two-digit ISTAT region code, e.g. 12' },
  province: { pattern: /^[A-Z]{2}$/, hint: 'the two letters an address carries, e.g. RM' },
  comune: { pattern: /^\d{6}$/, hint: 'the six-digit ISTAT comune code, e.g. 058091' },
  cap: { pattern: /^\d{5}$/, hint: 'five digits, e.g. 00121' },
  frazione: { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, hint: 'a lowercase slug, e.g. ostia-antica' },
};

/**
 * Codes are stored exactly as they must be matched, so they are canonicalised on
 * the way in: a province typed as "rm" would never match an address giving "RM".
 */
function normaliseCode(level: ZoneLevel, code: string): string {
  const trimmed = code.trim();
  return level === 'country' || level === 'province'
    ? trimmed.toUpperCase()
    : level === 'frazione'
      ? trimmed.toLowerCase()
      : trimmed;
}

export async function getTree(db: Database): Promise<AdminZoneDto[]> {
  return toZoneTree(await repo.findAllZones(db));
}

export async function createZone(db: Database, input: CreateZoneInput): Promise<AdminZoneDto> {
  const parent = input.parentId ? await repo.findZoneById(db, input.parentId) : undefined;
  if (input.parentId && !parent) throw notFound('Parent area');

  if (!parent) {
    // The country row is created by the seed and there may only ever be one, so
    // there is nothing legitimate for this branch to do.
    throw httpError(
      422,
      'Every area sits under another one. Pick a parent — the country row already exists.',
      'unprocessable_entity',
    );
  }

  if (!ALLOWED_CHILDREN[parent.level].includes(input.level)) {
    throw httpError(
      422,
      `A ${parent.level} cannot contain a ${input.level}.`,
      'unprocessable_entity',
      { fields: { level: `Allowed here: ${ALLOWED_CHILDREN[parent.level].join(', ') || 'nothing'}.` } },
    );
  }

  const code = normaliseCode(input.level, input.code);
  assertCodeShape(input.level, code);

  if (await repo.findSibling(db, parent.id, input.level, code)) {
    throw conflict(`“${parent.name}” already contains a ${input.level} with code ${code}.`);
  }

  const row = await repo.insertZone(db, {
    parentId: parent.id,
    parentLevel: parent.level,
    level: input.level,
    code,
    name: input.name,
    valueKind: input.valueKind ?? null,
    fee: input.fee ?? null,
  });
  return toZone(row);
}

export async function updateZone(
  db: Database,
  id: string,
  input: UpdateZoneInput,
): Promise<AdminZoneDto> {
  const existing = await repo.findZoneById(db, id);
  if (!existing) throw notFound('Area');

  const data: repo.ZoneUpdate = {};

  if (input.code !== undefined) {
    const code = normaliseCode(existing.level, input.code);
    assertCodeShape(existing.level, code);
    if (code !== existing.code) {
      if (await repo.findSibling(db, existing.parentId, existing.level, code, id)) {
        throw conflict(`Another ${existing.level} here already uses code ${code}.`);
      }
      // The country row is what makes coverage total; repointing it at another
      // country would leave every Italian address resolving to nothing.
      if (existing.level === 'country') {
        throw httpError(422, 'The country row cannot be recoded.', 'unprocessable_entity');
      }
      data.code = code;
    }
  }

  if (input.name !== undefined) data.name = input.name;

  // Sent as a pair or not at all: `valueKind` without `fee` would leave a stale
  // amount on a row that no longer charges one, which the CHECK rejects anyway.
  if (input.valueKind !== undefined || input.fee !== undefined) {
    const valueKind = input.valueKind ?? null;
    if (existing.level === 'country' && valueKind === null) {
      throw httpError(
        422,
        'The country row must keep a value — it is the fallback that gives every address an answer.',
        'unprocessable_entity',
        { fields: { valueKind: 'Choose a fixed fee or “needs call”.' } },
      );
    }
    data.valueKind = valueKind;
    data.fee = valueKind === 'fee' ? (input.fee ?? null) : null;
  }

  const row = await repo.updateZone(db, id, data);
  if (!row) throw notFound('Area');
  return toZone(row);
}

export async function deleteZone(db: Database, id: string): Promise<void> {
  const existing = await repo.findZoneById(db, id);
  if (!existing) throw notFound('Area');

  // Deleting it would cascade the entire tree away and leave every address with no
  // answer at all. Not enforced in the database because that would need the only
  // hand-written trigger in the repo — see docs/code/delivery-pricing.md.
  if (existing.level === 'country') {
    throw httpError(
      422,
      'The country row cannot be deleted — it is what guarantees every address gets an answer.',
      'unprocessable_entity',
    );
  }

  await repo.deleteZone(db, id);
}

function assertCodeShape(level: ZoneLevel, code: string): void {
  const shape = CODE_SHAPE[level];
  if (shape.pattern.test(code)) return;
  throw httpError(422, `That is not a valid ${level} code.`, 'unprocessable_entity', {
    fields: { code: `Use ${shape.hint}.` },
  });
}

/* ------------------------------------------------------------ the ladder --- */

/**
 * Walks the tree top-down for one comune and returns the path plus the deepest row
 * on it that carries a value.
 *
 * Top-down rather than looking rows up by `(level, code)`: a comune row only counts
 * if its province and region rows are actually its ancestors. Matching on level and
 * code alone would let a comune priced under the wrong province answer.
 *
 * `frazione` is never reached — a CAP does not name one, and the case study found no
 * address field reliable enough to key a price on. The level exists so enabling it
 * later needs no migration.
 */
function walk(
  country: ZoneRow,
  childrenOf: Map<string, Map<string, ZoneRow>>,
  comune: ComuneRow,
  cap: string,
): ZoneCandidate {
  const path: ZoneRow[] = [country];
  let cursor = country;

  const steps: [ZoneLevel, string][] = [
    ['region', comune.regionCode],
    ['province', comune.provinceCode],
    ['comune', comune.istatCode],
    ['cap', cap],
  ];

  for (const [level, code] of steps) {
    const next = childrenOf.get(cursor.id)?.get(`${level}|${code}`);
    if (!next) break;
    path.push(next);
    cursor = next;
  }

  let answer: ZoneRow | null = null;
  for (const row of path) {
    if (row.valueKind !== null) answer = row;
  }
  return { comune, path, answer };
}

/** `fee 35.00` / `call` — two candidates agree when this string matches. */
const answerKey = (row: ZoneRow | null): string =>
  row === null ? 'none' : `${row.valueKind}|${row.fee ?? ''}`;

/**
 * The deepest row every candidate has in common.
 *
 * Used when candidates disagree: they always share the country row, and share their
 * region and province rows when they sit in the same ones, so the longest common
 * prefix IS "the narrowest area all of them are inside".
 */
function deepestSharedAnswer(candidates: readonly ZoneCandidate[]): ZoneRow | null {
  const [first, ...rest] = candidates;
  if (!first) return null;

  let shared = first.path.length;
  for (const candidate of rest) {
    let index = 0;
    while (index < shared && candidate.path[index]?.id === first.path[index]?.id) index += 1;
    shared = index;
  }

  let answer: ZoneRow | null = null;
  for (const row of first.path.slice(0, shared)) {
    if (row.valueKind !== null) answer = row;
  }
  return answer;
}

/**
 * A CAP (and optionally the comune name an address provider gave us) → a price.
 *
 * Always answers. Never guesses: a wrong price is worse than a coarse one, so the
 * comune name is compared against a normalised column exactly, never fuzzily, and
 * an unbreakable tie widens to the shared parent instead of picking a favourite.
 */
export async function resolveQuote(db: Database, input: QuoteInput): Promise<QuoteDto> {
  const [zones, comuni] = await Promise.all([
    repo.findAllZones(db),
    repo.findComuniByCap(db, input.cap),
  ]);

  const country = zones.find((row) => row.level === 'country');
  if (!country) {
    // Only reachable on a database that was never seeded.
    throw httpError(500, 'Delivery pricing is not configured.', 'internal_error');
  }

  const childrenOf = new Map<string, Map<string, ZoneRow>>();
  for (const row of zones) {
    if (!row.parentId) continue;
    let siblings = childrenOf.get(row.parentId);
    if (!siblings) childrenOf.set(row.parentId, (siblings = new Map()));
    siblings.set(`${row.level}|${row.code}`, row);
  }

  // 1. A CAP our reference data does not know. Every one of Italy's 4,735 CAPs is
  //    in there, so this is a typo or a foreign postcode — the country row answers
  //    and the miss is recorded.
  if (comuni.length === 0) {
    repo.logResolutionMiss(db, {
      cap: input.cap,
      providerName: input.comuneName ?? null,
      provinceCode: null,
      resolvedVia: country.level,
    });
    return toQuote(country, null);
  }

  // 2. The name, if we were given one, and only as an exact match on the
  //    normalised column. This is what makes a shared CAP precise.
  const wanted = input.comuneName ? normaliseComuneName(input.comuneName) : '';
  const named = wanted ? comuni.filter((row) => row.nameNormalised === wanted) : [];
  const candidates = (named.length === 1 ? named : comuni).map((comune) =>
    walk(country, childrenOf, comune, input.cap),
  );

  const pinned = candidates.length === 1 ? candidates[0] : undefined;

  // 3. One comune, or several that all price the same — either way there is a
  //    single answer and no reason to widen.
  const distinct = new Set(candidates.map((candidate) => answerKey(candidate.answer)));
  if (pinned?.answer) return toQuote(pinned.answer, pinned.comune);
  if (distinct.size === 1) {
    const answer = candidates[0]?.answer;
    if (answer) return toQuote(answer, null);
  }

  // 4. They disagree. Widen to the deepest row they all share rather than guess.
  const shared = deepestSharedAnswer(candidates) ?? country;
  repo.logResolutionMiss(db, {
    cap: input.cap,
    providerName: input.comuneName ?? null,
    provinceCode: candidates[0]?.comune.provinceCode ?? null,
    resolvedVia: shared.level,
  });
  return toQuote(shared, null);
}
