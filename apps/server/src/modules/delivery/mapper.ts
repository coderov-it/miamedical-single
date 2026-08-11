import type { AdminZoneDto, QuoteDto } from './dto.ts';
import type { ZoneCandidate, ZoneRow } from './types.ts';

/**
 * Flat rows → the nested tree the admin renders.
 *
 * Siblings are ordered by name rather than by an explicit position column: the
 * order of two priced areas carries no meaning, and a position column would be one
 * more thing to keep correct on every insert for no gain. `numeric`-looking codes
 * sort naturally because they are zero-padded.
 */
export function toZoneTree(rows: readonly ZoneRow[]): AdminZoneDto[] {
  const byParent = new Map<string | null, ZoneRow[]>();
  for (const row of rows) {
    const siblings = byParent.get(row.parentId);
    if (siblings) siblings.push(row);
    else byParent.set(row.parentId, [row]);
  }

  const build = (parentId: string | null): AdminZoneDto[] =>
    (byParent.get(parentId) ?? [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'it') || a.code.localeCompare(b.code))
      .map((row) => ({
        id: row.id,
        parentId: row.parentId,
        level: row.level,
        code: row.code,
        name: row.name,
        valueKind: row.valueKind,
        fee: row.fee,
        children: build(row.id),
      }));

  return build(null);
}

/** A single row, without its subtree — what a create or update responds with. */
export function toZone(row: ZoneRow): AdminZoneDto {
  return {
    id: row.id,
    parentId: row.parentId,
    level: row.level,
    code: row.code,
    name: row.name,
    valueKind: row.valueKind,
    fee: row.fee,
    children: [],
  };
}

/**
 * The answering row plus the comune we pinned, as the checkout's quote.
 *
 * `answer.valueKind` is asserted non-null by construction: only a row that carries
 * a value is ever passed here, and the country row always carries one.
 */
export function toQuote(answer: ZoneRow, comune: ZoneCandidate['comune'] | null): QuoteDto {
  return {
    kind: answer.valueKind ?? 'call',
    fee: answer.valueKind === 'fee' ? answer.fee : null,
    areaLabel: answer.name,
    resolvedVia: answer.level,
    zoneId: answer.id,
    comune: comune
      ? { istatCode: comune.istatCode, name: comune.name, provinceCode: comune.provinceCode }
      : null,
  };
}
